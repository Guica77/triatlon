import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config({ path: '.env.local' });

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Para poder usar esto de forma standalone
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
// Necesitamos usar la SERVICE_ROLE_KEY para ignorar RLS en el seedeo
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error("Falta SUPABASE_SERVICE_ROLE_KEY en el entorno. No se puede hacer el seed.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
  console.log("Iniciando seedeo de datos de entrenamiento...");

  const dataPath = path.join(__dirname, '../../triathlon_data_completo.json');
  const rawData = fs.readFileSync(dataPath, 'utf-8');
  const jsonData = JSON.parse(rawData);

  const planes = jsonData.planes_entrenamiento;

  // Limpiar datos existentes (Cascade eliminará sessions y workouts si existieran)
  console.log("Limpiando planes antiguos...");
  await supabase.from('training_plans').delete().neq('id', 'dummy');

  for (const [key, plan] of Object.entries(planes)) {
    console.log(`Insertando plan: ${plan.nombre || key}...`);
    
    // Asignar variables por defecto si no existen
    let distance = key.includes('sprint') ? 'sprint' : 
                   key.includes('olimpico') ? 'olimpico' :
                   key.includes('70_3') ? '70.3' : 'ironman';
                   
    let level = key.includes('cero') ? 'principiante' :
                key.includes('sub10') ? 'avanzado' : 'intermedio';

    // Insertar el plan
    const { data: planData, error: planError } = await supabase
      .from('training_plans')
      .insert({
        id: key,
        name: plan.nombre || `Plan ${key}`,
        distance: distance,
        duration_weeks: plan.duracion_semanas || (plan.plan_semana_a_semana ? plan.plan_semana_a_semana.length : 12),
        level: level,
        description: `Plan estructurado para distancia ${distance}. Nivel: ${level}.`
      })
      .select()
      .single();

    if (planError) {
      console.error(`Error al insertar plan ${key}:`, planError);
      continue;
    }

    const sessionInserts = [];

    // 1. Si el plan tiene plan_semana_a_semana, insertamos sus sesiones detalladas
    if (plan.plan_semana_a_semana) {
      console.log(`Insertando sesiones detalladas para ${key}...`);
      plan.plan_semana_a_semana.forEach(semana => {
        if (semana.sesiones) {
          semana.sesiones.forEach(sesion => {
            const text = (sesion.descripcion || '').toLowerCase();
            const gear = [];
            if (text.includes('palas')) gear.push('Palas de Natación');
            if (text.includes('aletas')) gear.push('Aletas de Natación');
            if (text.includes('potenciómetro') || text.includes('potenciometro') || text.includes('vatios')) gear.push('Potenciómetro');
            if (text.includes('cabra') || text.includes('acoples')) gear.push('Cabra Triatlón');

            sessionInserts.push({
              plan_id: planData.id,
              week_number: semana.semana,
              day_name: sesion.dia,
              sport_type: sesion.deporte || 'descanso',
              duration_min: sesion.duracion_min || 0,
              description: sesion.descripcion || 'Entrenamiento del día',
              gear_needed: gear
            });
          });
        }
      });
    } 
    // 2. Si el plan tiene semana_tipo (en cualquiera de sus variantes), la repetimos por el número de semanas del plan
    else {
      const semanaTipo = plan.semana_tipo || plan.semana_tipo_media || plan.semana_tipo_pico || plan.semana_tipo_fase_construccion || plan.semana_tipo_semana_10 || plan.semana_tipo_pico_semana_22;
      
      if (semanaTipo) {
        console.log(`Generando sesiones desde semana_tipo para ${key}...`);
        const durationWeeks = plan.duracion_semanas || 12;
        
        for (let w = 1; w <= durationWeeks; w++) {
          semanaTipo.forEach(diaItem => {
            const desc = diaItem.sesion || diaItem.descripcion || 'Entrenamiento del día';
            let sport = diaItem.deporte || 'descanso';
            
            if (!diaItem.deporte) {
              const text = desc.toLowerCase();
              if (text.includes('natación') || text.includes('natacion') || text.includes('swim') || text.includes('agua')) sport = 'natacion';
              else if (text.includes('brick') || text.includes('transición') || text.includes('transicion')) sport = 'brick';
              else if (text.includes('bike') || text.includes('bici') || text.includes('ciclismo') || text.includes('rodillo')) sport = 'ciclismo';
              else if (text.includes('run') || text.includes('carrera') || text.includes('trote') || text.includes('correr')) sport = 'carrera';
            }
            
            let duration = diaItem.duracion_min || 0;
            if (!duration) {
              const match = desc.match(/(\d+)\s*(min|h|km)/);
              if (match) {
                if (match[2] === 'min') duration = parseInt(match[1]);
                else if (match[2] === 'h') duration = parseInt(match[1]) * 60;
                else if (match[2] === 'km') duration = parseInt(match[1]) * 15; // estimación min por km natacion/carrera
              } else {
                if (sport !== 'descanso') duration = 45; // por defecto 45 min
              }
            }

            let dayName = diaItem.dia || 'Lunes';
            if (dayName === 'Sabado') dayName = 'Sábado';

            const gear = [];
            const descLower = desc.toLowerCase();
            if (descLower.includes('palas')) gear.push('Palas de Natación');
            if (descLower.includes('aletas')) gear.push('Aletas de Natación');
            if (descLower.includes('potenciómetro') || descLower.includes('potenciometro') || descLower.includes('vatios')) gear.push('Potenciómetro');
            if (descLower.includes('cabra') || descLower.includes('acoples')) gear.push('Cabra Triatlón');

            sessionInserts.push({
              plan_id: planData.id,
              week_number: w,
              day_name: dayName,
              sport_type: sport,
              duration_min: duration,
              description: desc,
              gear_needed: gear
            });
          });
        }
      }
    }

    if (sessionInserts.length > 0) {
      const { error: sessionError } = await supabase
        .from('training_sessions')
        .insert(sessionInserts);
        
      if (sessionError) {
        console.error(`Error al insertar sesiones para ${key}:`, sessionError);
      } else {
        console.log(`Insertadas ${sessionInserts.length} sesiones para ${key}`);
      }
    }
  }

  console.log("Seedeo finalizado correctamente.");
}

main().catch(console.error);
