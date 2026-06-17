-- Añadir columnas para el cálculo de nutrición dinámica y test de sudoración en profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS sweat_rate NUMERIC(3,1) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS sweat_test_weight_before NUMERIC(4,1) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS sweat_test_weight_after NUMERIC(4,1) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS sweat_test_fluid_intake INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS sweat_test_duration_min INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS custom_carbs_per_hour INTEGER DEFAULT NULL;
