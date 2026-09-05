import os
import sys
from zoneinfo import ZoneInfo
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client, Client
from garminconnect import Garmin, GarminConnectAuthenticationError

# Cargar las variables de entorno desde .env.local del proyecto Next.js
env_path = os.path.join(os.path.dirname(__file__), '../../.env.local')
load_dotenv(dotenv_path=env_path)

url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    print("Error: No se encontraron las variables de entorno de Supabase.")
    exit(1)

supabase: Client = create_client(url, key)

def calc_readiness(hrv, rhr, sleep_hours, fatigue, stress):
    hrv = hrv or 65
    rhr = rhr or 52
    sleep_hours = sleep_hours or 7.5
    fatigue = fatigue or 2
    stress = stress or 2

    sleep_score = min(35, (sleep_hours / 8.0) * 35)
    hrv_score = min(25, (hrv / 65) * 25)
    rhr_score = min(20, (52 / rhr) * 20)
    fatigue_score = ((6 - fatigue) / 5) * 10
    stress_score = ((6 - stress) / 5) * 10

    total = sleep_score + hrv_score + rhr_score + fatigue_score + stress_score
    return min(100, max(0, round(total)))

def process_user(user):
    user_id = user["id"]
    print(f"\n--- Procesando usuario: {user_id} ---")

    tokens = user.get("garmin_auth_tokens")
    if not tokens or not isinstance(tokens, dict):
        print("No hay credenciales válidas en la DB.")
        return False

    email = tokens.get("email")
    password = tokens.get("password")

    if not email or not password:
        print("Faltan email o password en los tokens.")
        return False

    try:
        print("Autenticando en Garmin...")
        client = Garmin(email, password)
        client.login()

        today = datetime.now(ZoneInfo(os.environ.get("GARMIN_TIMEZONE", "Europe/Madrid")))
        date_str = today.isoformat()[:10]

        print("Descargando métricas de hoy...")
        stats = client.get_stats(date_str) or {}
        sleep = client.get_sleep_data(date_str) or {}

        try:
            hrv_data = client.get_hrv_data(date_str) or {}
        except Exception:
            hrv_data = {}

        try:
            training_status = client.get_training_status(date_str) or {}
        except Exception:
            training_status = {}

        sleep_score = None
        sleep_seconds = None

        if "dailySleepDTO" in sleep:
            dto = sleep["dailySleepDTO"]
            sleep_seconds = dto.get("sleepTimeSeconds")
            if "sleepScores" in dto and isinstance(dto["sleepScores"], dict):
                overall = dto["sleepScores"].get("overall", {})
                sleep_score = overall.get("value")
            elif "sleepScore" in dto and isinstance(dto["sleepScore"], dict):
                sleep_score = dto["sleepScore"].get("value")
            elif "sleepScore" in dto:
                sleep_score = dto["sleepScore"]
        else:
            sleep_score = sleep.get("sleepScore")
            sleep_seconds = sleep.get("sleepTimeSeconds")

        rhr = stats.get("restingHeartRate") or stats.get("minHeartRate")
        raw_stress = stats.get("averageStressLevel")
        garmin_stress = max(1, min(5, round(raw_stress / 20))) if raw_stress else None

        sleep_hours = sleep_seconds / 3600 if sleep_seconds else None
        sleep_score = sleep_score or (round(sleep_hours * 10) if sleep_hours else None)

        if not rhr and not sleep_hours:
            print("No se encontraron datos fisiológicos relevantes para hoy todavía.")
            return True

        print(f"Extraído: RHR={rhr}, Sueño={sleep_hours}h, Stress={garmin_stress}")

        # Recuperar datos actuales del usuario para no sobreescribir fatiga/estrés
        response = supabase.table("user_biometrics").select("*").eq("user_id", user_id).eq("date", date_str).execute()
        existing = response.data[0] if response.data else {}

        bb = stats.get("bodyBatteryHighestValue") or stats.get("bodyBatteryHighest")
        garmin_fatigue = None
        if bb is not None:
            if bb > 75: garmin_fatigue = 1
            elif bb > 50: garmin_fatigue = 2
            elif bb > 25: garmin_fatigue = 3
            elif bb > 10: garmin_fatigue = 4
            else: garmin_fatigue = 5

        fatigue = existing.get("fatigue_rating") or garmin_fatigue or 2
        stress = garmin_stress or existing.get("stress_level") or 2

        raw_hrv = hrv_data.get("hrvSummary", {}).get("lastNightAvg") or hrv_data.get("lastNightAvg")
        hrv = raw_hrv or existing.get("hrv")

        final_rhr = rhr or existing.get("rhr")
        final_sleep = sleep_hours or existing.get("sleep_hours")

        readiness = calc_readiness(hrv, final_rhr, final_sleep, fatigue, stress)

        print(f"Calculado Readiness: {readiness}")

        upsert_data = {
            "user_id": user_id,
            "date": date_str,
            "hrv": hrv,
            "rhr": final_rhr,
            "sleep_hours": round(final_sleep, 1) if final_sleep else None,
            "sleep_score": sleep_score or existing.get("sleep_score"),
            "stress_level": stress,
            "readiness_score": readiness,
            "raw_garmin_data": {
                "stats": stats,
                "sleep": sleep,
                "hrv": hrv_data,
                "training_status": training_status
            }
        }

        supabase.table("user_biometrics").upsert(upsert_data, on_conflict="user_id,date").execute()
        print("✓ Datos guardados exitosamente en Supabase.")
        return True

    except GarminConnectAuthenticationError:
        print("Error de autenticación. Las credenciales caducaron o son incorrectas.")
    except Exception as e:
        print(f"Error de sincronización: {type(e).__name__}")
    return False

def main():
    print("Iniciando cron job de Garmin Sync...")
    try:
        response = supabase.table("profiles").select("id, garmin_auth_tokens").eq("garmin_connected", True).execute()
        users = response.data
        print(f"Encontrados {len(users)} usuarios con Garmin conectado.")

        failures = 0
        for user in users:
            if not process_user(user):
                failures += 1
        print(f"Finalizado: {len(users) - failures} correctos, {failures} fallidos.")
        return 1 if failures else 0

    except Exception as e:
        print(f"Error al conectar con Supabase: {type(e).__name__}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
