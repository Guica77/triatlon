-- SQL Migration: Add Bio and Achievements for Coach Directory

ALTER TABLE "public"."profiles"
ADD COLUMN IF NOT EXISTS "bio" TEXT,
ADD COLUMN IF NOT EXISTS "achievements" TEXT[];

-- Update the existing test coach with some mock data for UI testing
UPDATE "public"."profiles"
SET 
  "bio" = 'Entrenador de triatlón especializado en larga distancia y preparación mental. Ayudando a atletas a cruzar la meta desde 2018.',
  "achievements" = ARRAY['Ironman Finisher', 'Entrenador Nivel 3', '20+ Atletas Activos', 'Ex-Atleta Élite']
WHERE "role" = 'coach' AND "first_name" = 'Guillermo';
