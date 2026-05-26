import { describe, it, expect } from 'vitest';
import {
  parsePaceToSeconds,
  formatSecondsToPace,
  getCyclingZones,
  getRunningZones,
  getSwimmingZones,
  adaptWorkoutDescription,
} from '@/lib/zones-utility';

describe('Zones Fisiológicas Utility', () => {
  describe('parsePaceToSeconds', () => {
    it('debería parsear ritmos en formato MM:SS a segundos', () => {
      expect(parsePaceToSeconds('05:30', 300)).toBe(330);
      expect(parsePaceToSeconds('02:00', 120)).toBe(120);
      expect(parsePaceToSeconds(' 04:15 ', 300)).toBe(255);
    });

    it('debería retornar valor por defecto con strings vacíos o inválidos', () => {
      expect(parsePaceToSeconds(null, 300)).toBe(300);
      expect(parsePaceToSeconds(undefined, 120)).toBe(120);
      expect(parsePaceToSeconds('invalid-pace', 180)).toBe(180);
      expect(parsePaceToSeconds('12', 180)).toBe(180);
    });
  });

  describe('formatSecondsToPace', () => {
    it('debería formatear segundos a ritmo MM:SS', () => {
      expect(formatSecondsToPace(330)).toBe('05:30');
      expect(formatSecondsToPace(120)).toBe('02:00');
      expect(formatSecondsToPace(255)).toBe('04:15');
      expect(formatSecondsToPace(0)).toBe('00:00');
    });
  });

  describe('getCyclingZones', () => {
    it('debería calcular zonas de ciclismo basadas en FTP', () => {
      const ftp = 200;
      const zones = getCyclingZones(ftp);
      
      // Z1: 30% - 55%
      expect(zones.Z1.min).toBe(60);
      expect(zones.Z1.max).toBe(110);
      
      // Z2: 56% - 75%
      expect(zones.Z2.min).toBe(112);
      expect(zones.Z2.max).toBe(150);

      // Z4: 91% - 105%
      expect(zones.Z4.min).toBe(182);
      expect(zones.Z4.max).toBe(210);

      // Z5: 106% - 120%
      expect(zones.Z5.min).toBe(212);
      expect(zones.Z5.max).toBe(240);
    });
  });

  describe('getRunningZones', () => {
    it('debería calcular zonas de carrera basadas en ritmo umbral (sec/km)', () => {
      const runThresholdSec = 300; // 05:00 min/km
      const zones = getRunningZones(runThresholdSec);

      // Z1: 1.25 - 1.35
      expect(zones.Z1.min).toBe(375); // 06:15
      expect(zones.Z1.max).toBe(405); // 06:45

      // Z4: 0.95 - 1.00
      expect(zones.Z4.min).toBe(285); // 04:45
      expect(zones.Z4.max).toBe(300); // 05:00
    });
  });

  describe('getSwimmingZones', () => {
    it('debería calcular zonas de natación basadas en ritmo umbral (sec/100m)', () => {
      const swimThresholdSec = 100; // 01:40 min/100m
      const zones = getSwimmingZones(swimThresholdSec);

      // Z1: threshold + 20 to + 30
      expect(zones.Z1.min).toBe(120); // 02:00
      expect(zones.Z1.max).toBe(130); // 02:10

      // Z4: threshold to threshold + 4
      expect(zones.Z4.min).toBe(100); // 01:40
      expect(zones.Z4.max).toBe(104); // 01:44
    });
  });

  describe('adaptWorkoutDescription', () => {
    const mockProfile = {
      current_ftp: 200,
      current_run_pace: '05:00',
      current_swim_pace: '01:40',
    };

    it('debería inyectar potencias de ciclismo dinámicas', () => {
      const description = 'Realizar 15 min en Z1, luego 30 min en Z2, y terminar con 5 min en Z5';
      const adapted = adaptWorkoutDescription(description, 'ciclismo', mockProfile);
      
      expect(adapted).toContain('Z1 (60-110W)');
      expect(adapted).toContain('Z2 (112-150W)');
      expect(adapted).toContain('Z5 (212-240W)');
    });

    it('debería inyectar ritmos de carrera dinámicos formateados intuitivamente (lento a rápido)', () => {
      const description = 'Rodar en Z2 y acabar con 2x1000m en Z4';
      const adapted = adaptWorkoutDescription(description, 'carrera', mockProfile);

      // Running zones target paces: Z2 (336-372 sec/km) -> 06:12 - 05:36
      // Z4 (285-300 sec/km) -> 05:00 - 04:45
      expect(adapted).toContain('Z2 (06:12-05:36 min/km)');
      expect(adapted).toContain('Z4 (05:00-04:45 min/km)');
    });

    it('debería inyectar ritmos de natación dinámicos', () => {
      const description = 'Nadar 200m en Z1 suave, 4x100m en Z4 con 15s descanso';
      const adapted = adaptWorkoutDescription(description, 'natacion', mockProfile);

      expect(adapted).toContain('Z1 (02:00-02:10 min/100m)');
      expect(adapted).toContain('Z4 (01:40-01:44 min/100m)');
    });

    it('debería retornar la descripción original si no se provee perfil', () => {
      const desc = 'Rodar 40 min en Z2';
      expect(adaptWorkoutDescription(desc, 'ciclismo', null)).toBe(desc);
      expect(adaptWorkoutDescription(desc, 'ciclismo', undefined)).toBe(desc);
    });
  });
});
