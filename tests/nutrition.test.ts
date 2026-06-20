import { describe, it, expect } from 'vitest';
import {
  calculateSweatRate,
  calculateBmr,
  calculateWorkoutCalories,
  calculateDailyMacros,
  calculateSessionPacing,
} from '@/lib/nutrition-utility';

describe('Nutrición Deportiva Utility', () => {
  describe('calculateSweatRate', () => {
    it('debería calcular la tasa de sudoración en L/hora basándose en peso y líquidos', () => {
      // Peso antes: 75.0 kg, Peso después: 74.2 kg (pérdida de 800g), Líquido: 500ml, Duración: 60 min (1h)
      // Tasa = (0.8 + 0.5) / 1 = 1.3 L/h
      expect(calculateSweatRate(75.0, 74.2, 500, 60)).toBe(1.3);
      
      // Duración: 90 min (1.5h), Peso antes: 70.0 kg, después: 69.1 kg (900g), Líquido: 300ml
      // Tasa = (0.9 + 0.3) / 1.5 = 1.2 / 1.5 = 0.8 L/h
      expect(calculateSweatRate(70.0, 69.1, 300, 90)).toBe(0.8);
    });

    it('debería retornar el fallback por defecto ante parámetros inválidos', () => {
      expect(calculateSweatRate(0, 72, 500, 60)).toBe(0.8);
      expect(calculateSweatRate(75, 0, 500, 60)).toBe(0.8);
      expect(calculateSweatRate(75, 74, 500, 0)).toBe(0.8);
    });
  });

  describe('calculateBmr', () => {
    it('debería calcular el Metabolismo Basal en 24 kcal/kg', () => {
      expect(calculateBmr(70)).toBe(1680);
      expect(calculateBmr(60)).toBe(1440);
    });
  });

  describe('calculateWorkoutCalories', () => {
    it('debería calcular las calorías consumidas según el deporte y METs', () => {
      // Ciclismo MET 8: 70kg, 60 min -> 8 * 70 * 1 = 560 kcal
      expect(calculateWorkoutCalories('ciclismo', 70, 60)).toBe(560);
      // Carrera MET 10: 70kg, 30 min -> 10 * 70 * 0.5 = 350 kcal
      expect(calculateWorkoutCalories('carrera', 70, 30)).toBe(350);
    });
  });

  describe('calculateDailyMacros', () => {
    it('debería calcular la distribución diaria de macros para descanso', () => {
      // 70kg, 0h entreno (días descanso), sin fuerza, sin brick, 0 active calories
      // BMR = 1680. Base = 1680 * 1.2 = 2016.
      // Carbs Rate: 4.0 g/kg -> 280g Carbs -> 1120 kcal
      // Protein Rate: 1.6 g/kg -> 112g Prot -> 448 kcal
      // Fat Kcal: totalKcal - (1120 + 448) = 2016 - 1568 = 448 kcal -> 448 / 9 = 50g Fat.
      // 50g Fat es menor que minFatGrams (70g) -> Fat se forza a 70g (630 kcal).
      // Total reajustado = 1120 + 448 + 630 = 2198 kcal.
      const result = calculateDailyMacros(70, 0, false, false, 0);
      expect(result.bmr).toBe(1680);
      expect(result.baseExpenditure).toBe(2016);
      expect(result.carbs.grams).toBe(280);
      expect(result.protein.grams).toBe(112);
      expect(result.fat.grams).toBe(70); // forzado al mínimo
      expect(result.totalCalories).toBe(2198);
    });

    it('debería incrementar carbohidratos en días de entrenamiento pesado', () => {
      // 70kg, 3h de ciclismo (totalWorkoutHours > 2.0) -> carbsRate = 8.5 g/kg -> 595g carbs
      const result = calculateDailyMacros(70, 3.0, false, false, 1500);
      expect(result.carbs.ratePerKg).toBe(8.5);
      expect(result.carbs.grams).toBe(595);
    });
  });

  describe('calculateSessionPacing', () => {
    it('debería calcular el pacing de hidratación y carbohidratos para ciclismo largo', () => {
      // Ciclismo de 3 horas (180 min), sweat rate = 1.2 L/h
      // Hidratación = 65% * 1.2 = 0.78 L/h = 780 ml/h. Total = 780 * 3 = 2340 ml
      // Sodio = 780 * 0.7 = 546 mg/h. Total = 546 * 3 = 1638 mg
      // Carbs: duración >= 150 min -> 75g HC/h. Total = 225g
      const result = calculateSessionPacing('ciclismo', 180, 1.2);
      expect(result.hourlyFluidMl).toBe(780);
      expect(result.totalFluidMl).toBe(2340);
      expect(result.hourlySodiumMg).toBe(546);
      expect(result.totalSodiumMg).toBe(1638);
      expect(result.hourlyCarbsG).toBe(75);
      expect(result.totalCarbsG).toBe(225);
      expect(result.practicalGuide).toContain('sales');
      expect(result.practicalGuide).toContain('geles');
    });

    it('debería soportar ritmos de carbohidratos personalizados si se especifican', () => {
      const result = calculateSessionPacing('carrera', 60, 1.0, 90);
      expect(result.hourlyCarbsG).toBe(90);
      expect(result.totalCarbsG).toBe(90);
    });

    it('debería ajustar hidratación, sodio y carbohidratos según clima y vestimenta', () => {
      // Caso base: ciclismo de 2 horas (120 min), sweat rate = 1.0, clima templado, ropa normal.
      const base = calculateSessionPacing('ciclismo', 120, 1.0);
      
      // Calor extremo (+45% sudoración, +20% carbohidratos)
      const hotWeather = calculateSessionPacing('ciclismo', 120, 1.0, null, { temperature: 'extremo' });
      expect(hotWeather.hourlyFluidMl).toBeGreaterThan(base.hourlyFluidMl);
      expect(hotWeather.hourlySodiumMg).toBeGreaterThan(base.hourlySodiumMg);
      expect(hotWeather.hourlyCarbsG).toBeGreaterThan(base.hourlyCarbsG);
      
      // Ropa abrigada (+18% sudoración)
      const heavyClothes = calculateSessionPacing('ciclismo', 120, 1.0, null, { clothing: 'abrigada' });
      expect(heavyClothes.hourlyFluidMl).toBeGreaterThan(base.hourlyFluidMl);
    });
  });
});

