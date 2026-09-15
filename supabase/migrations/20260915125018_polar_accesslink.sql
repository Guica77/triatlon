BEGIN;

ALTER TABLE public.user_connected_devices
  DROP CONSTRAINT IF EXISTS user_connected_devices_provider_check;
ALTER TABLE public.user_connected_devices
  ADD CONSTRAINT user_connected_devices_provider_check
  CHECK (provider IN ('garmin', 'strava', 'apple_health', 'coros', 'suunto', 'wahoo', 'polar'));

COMMIT;
