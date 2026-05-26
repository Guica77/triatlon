export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      coach_feedback: {
        Row: {
          athlete_id: string | null
          coach_id: string
          content: string
          created_at: string | null
          feedback_type: string
          id: string
          status: string | null
        }
        Insert: {
          athlete_id?: string | null
          coach_id: string
          content: string
          created_at?: string | null
          feedback_type: string
          id?: string
          status?: string | null
        }
        Update: {
          athlete_id?: string | null
          coach_id?: string
          content?: string
          created_at?: string | null
          feedback_type?: string
          id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coach_feedback_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_feedback_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_items: {
        Row: {
          category: string
          condition: string
          created_at: string | null
          external_images: string[]
          external_url: string
          id: string
          is_active: boolean | null
          location: string | null
          original_price: number | null
          price: number
          seller_name: string | null
          source_portal: string
          title: string
          updated_at: string | null
        }
        Insert: {
          category: string
          condition: string
          created_at?: string | null
          external_images: string[]
          external_url: string
          id?: string
          is_active?: boolean | null
          location?: string | null
          original_price?: number | null
          price: number
          seller_name?: string | null
          source_portal: string
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          condition?: string
          created_at?: string | null
          external_images?: string[]
          external_url?: string
          id?: string
          is_active?: boolean | null
          location?: string | null
          original_price?: number | null
          price?: number
          seller_name?: string | null
          source_portal?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          active_plan_id: string | null
          baseline_training_hours: string | null
          coach_id: string | null
          created_at: string
          current_ftp: number | null
          current_run_pace: string | null
          current_swim_pace: string | null
          external_athlete_id: string | null
          first_name: string | null
          ftp: number | null
          garmin_auth_tokens: Json | null
          garmin_connected: boolean | null
          goal_distance: string | null
          id: string
          last_name: string | null
          level: string | null
          run_pace: string | null
          strava_auth_tokens: Json | null
          strava_connected: boolean | null
          swim_pace: string | null
          target_finish_time: string | null
          target_race_date: string | null
          target_race_distance: string | null
          target_race_modality: string | null
          target_race_name: string | null
          updated_at: string
          virtual_garage: string[] | null
          swim_weekly_hours: number | null
          bike_weekly_hours: number | null
          run_weekly_hours: number | null
          target_swim_time: string | null
          target_bike_time: string | null
          target_run_time: string | null
          subscription_status: string | null
        }
        Insert: {
          active_plan_id?: string | null
          baseline_training_hours?: string | null
          coach_id?: string | null
          created_at?: string
          current_ftp?: number | null
          current_run_pace?: string | null
          current_swim_pace?: string | null
          external_athlete_id?: string | null
          first_name?: string | null
          ftp?: number | null
          garmin_auth_tokens?: Json | null
          garmin_connected?: boolean | null
          goal_distance?: string | null
          id: string
          last_name?: string | null
          level?: string | null
          run_pace?: string | null
          strava_auth_tokens?: Json | null
          strava_connected?: boolean | null
          swim_pace?: string | null
          target_finish_time?: string | null
          target_race_date?: string | null
          target_race_distance?: string | null
          target_race_modality?: string | null
          target_race_name?: string | null
          updated_at?: string
          virtual_garage?: string[] | null
          swim_weekly_hours?: number | null
          bike_weekly_hours?: number | null
          run_weekly_hours?: number | null
          target_swim_time?: string | null
          target_bike_time?: string | null
          target_run_time?: string | null
          subscription_status?: string | null
        }
        Update: {
          active_plan_id?: string | null
          baseline_training_hours?: string | null
          coach_id?: string | null
          created_at?: string
          current_ftp?: number | null
          current_run_pace?: string | null
          current_swim_pace?: string | null
          external_athlete_id?: string | null
          first_name?: string | null
          ftp?: number | null
          garmin_auth_tokens?: Json | null
          garmin_connected?: boolean | null
          goal_distance?: string | null
          id?: string
          last_name?: string | null
          level?: string | null
          run_pace?: string | null
          strava_auth_tokens?: Json | null
          strava_connected?: boolean | null
          swim_pace?: string | null
          target_finish_time?: string | null
          target_race_date?: string | null
          target_race_distance?: string | null
          target_race_modality?: string | null
          target_race_name?: string | null
          updated_at?: string
          virtual_garage?: string[] | null
          swim_weekly_hours?: number | null
          bike_weekly_hours?: number | null
          run_weekly_hours?: number | null
          target_swim_time?: string | null
          target_bike_time?: string | null
          target_run_time?: string | null
          subscription_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_active_plan_id_fkey"
            columns: ["active_plan_id"]
            isOneToOne: false
            referencedRelation: "training_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      training_plans: {
        Row: {
          created_at: string
          description: string | null
          distance: string
          duration_weeks: number
          id: string
          level: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          distance: string
          duration_weeks: number
          id: string
          level: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          distance?: string
          duration_weeks?: number
          id?: string
          level?: string
          name?: string
        }
        Relationships: []
      }
      training_sessions: {
        Row: {
          created_at: string
          day_name: string
          description: string
          duration_min: number | null
          gear_needed: string[] | null
          id: string
          plan_id: string | null
          sport_type: string
          week_number: number
        }
        Insert: {
          created_at?: string
          day_name: string
          description: string
          duration_min?: number | null
          gear_needed?: string[] | null
          id?: string
          plan_id?: string | null
          sport_type: string
          week_number: number
        }
        Update: {
          created_at?: string
          day_name?: string
          description?: string
          duration_min?: number | null
          gear_needed?: string[] | null
          id?: string
          plan_id?: string | null
          sport_type?: string
          week_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "training_sessions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "training_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      universal_telemetry: {
        Row: {
          actual_distance_km: number
          actual_duration_min: number
          actual_tss: number
          avg_cadence: number | null
          avg_hr: number | null
          avg_power: number | null
          created_at: string | null
          elevation_gain_m: number | null
          external_activity_id: string
          hr_zones_summary: Json | null
          id: string
          max_hr: number | null
          moving_time_min: number | null
          normalized_power: number | null
          raw_payload: Json
          source_provider: string
          training_effect_aerobic: number | null
          training_effect_anaerobic: number | null
          user_id: string
          workout_id: string
        }
        Insert: {
          actual_distance_km: number
          actual_duration_min: number
          actual_tss: number
          avg_cadence?: number | null
          avg_hr?: number | null
          avg_power?: number | null
          created_at?: string | null
          elevation_gain_m?: number | null
          external_activity_id: string
          hr_zones_summary?: Json | null
          id?: string
          max_hr?: number | null
          moving_time_min?: number | null
          normalized_power?: number | null
          raw_payload: Json
          source_provider: string
          training_effect_aerobic?: number | null
          training_effect_anaerobic?: number | null
          user_id: string
          workout_id: string
        }
        Update: {
          actual_distance_km?: number
          actual_duration_min?: number
          actual_tss?: number
          avg_cadence?: number | null
          avg_hr?: number | null
          avg_power?: number | null
          created_at?: string | null
          elevation_gain_m?: number | null
          external_activity_id?: string
          hr_zones_summary?: Json | null
          id?: string
          max_hr?: number | null
          moving_time_min?: number | null
          normalized_power?: number | null
          raw_payload?: Json
          source_provider?: string
          training_effect_aerobic?: number | null
          training_effect_anaerobic?: number | null
          user_id?: string
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "universal_telemetry_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "universal_telemetry_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "user_workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_biometrics: {
        Row: {
          created_at: string
          date: string
          fatigue_rating: number | null
          hrv: number | null
          id: string
          readiness_score: number | null
          rhr: number | null
          sleep_hours: number | null
          sleep_score: number | null
          stress_level: number | null
          user_id: string
          weight: number | null
        }
        Insert: {
          created_at?: string
          date: string
          fatigue_rating?: number | null
          hrv?: number | null
          id?: string
          readiness_score?: number | null
          rhr?: number | null
          sleep_hours?: number | null
          sleep_score?: number | null
          stress_level?: number | null
          user_id: string
          weight?: number | null
        }
        Update: {
          created_at?: string
          date?: string
          fatigue_rating?: number | null
          hrv?: number | null
          id?: string
          readiness_score?: number | null
          rhr?: number | null
          sleep_hours?: number | null
          sleep_score?: number | null
          stress_level?: number | null
          user_id?: string
          weight?: number | null
        }
        Relationships: []
      }
      user_connected_devices: {
        Row: {
          access_token: string
          created_at: string | null
          expires_at: string
          id: string
          provider: string
          refresh_token: string
          scopes: string[]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string | null
          expires_at: string
          id?: string
          provider: string
          refresh_token: string
          scopes?: string[]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          provider?: string
          refresh_token?: string
          scopes?: string[]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_connected_devices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_workouts: {
        Row: {
          actual_tss: number | null
          auto_adjusted: boolean | null
          completed_at: string | null
          created_at: string
          id: string
          scheduled_date: string
          session_id: string
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          actual_tss?: number | null
          auto_adjusted?: boolean | null
          completed_at?: string | null
          created_at?: string
          id?: string
          scheduled_date: string
          session_id: string
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          actual_tss?: number | null
          auto_adjusted?: boolean | null
          completed_at?: string | null
          created_at?: string
          id?: string
          scheduled_date?: string
          session_id?: string
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_workouts_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "training_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_workouts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_feedback: {
        Row: {
          created_at: string | null
          feeling: string
          id: string
          notes: string | null
          rpe_score: number
          user_id: string
          workout_id: string
        }
        Insert: {
          created_at?: string | null
          feeling: string
          id?: string
          notes?: string | null
          rpe_score: number
          user_id: string
          workout_id: string
        }
        Update: {
          created_at?: string | null
          feeling?: string
          id?: string
          notes?: string | null
          rpe_score?: number
          user_id?: string
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_feedback_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "user_workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_sync_logs: {
        Row: {
          attempt_count: number | null
          created_at: string | null
          error_message: string | null
          external_workout_id: string | null
          id: string
          next_retry_at: string | null
          provider: string
          status: string
          updated_at: string | null
          user_id: string
          workout_id: string
        }
        Insert: {
          attempt_count?: number | null
          created_at?: string | null
          error_message?: string | null
          external_workout_id?: string | null
          id?: string
          next_retry_at?: string | null
          provider: string
          status: string
          updated_at?: string | null
          user_id: string
          workout_id: string
        }
        Update: {
          attempt_count?: number | null
          created_at?: string | null
          error_message?: string | null
          external_workout_id?: string | null
          id?: string
          next_retry_at?: string | null
          provider?: string
          status?: string
          updated_at?: string | null
          user_id?: string
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_sync_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_sync_logs_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "user_workouts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
