export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
      profiles: {
        Row: {
          active_plan_id: string | null
          created_at: string
          first_name: string | null
          goal_distance: string | null
          id: string
          last_name: string | null
          level: string | null
          updated_at: string
          ftp: number | null
          swim_pace: string | null
          run_pace: string | null
          target_race_name: string | null
          target_race_date: string | null
          target_race_distance: string | null
          target_race_modality: string | null
          coach_id: string | null
        }
        Insert: {
          active_plan_id?: string | null
          created_at?: string
          first_name?: string | null
          goal_distance?: string | null
          id: string
          last_name?: string | null
          level?: string | null
          updated_at?: string
          ftp?: number | null
          swim_pace?: string | null
          run_pace?: string | null
          target_race_name?: string | null
          target_race_date?: string | null
          target_race_distance?: string | null
          target_race_modality?: string | null
          coach_id?: string | null
        }
        Update: {
          active_plan_id?: string | null
          created_at?: string
          first_name?: string | null
          goal_distance?: string | null
          id?: string
          last_name?: string | null
          level?: string | null
          updated_at?: string
          ftp?: number | null
          swim_pace?: string | null
          run_pace?: string | null
          target_race_name?: string | null
          target_race_date?: string | null
          target_race_distance?: string | null
          target_race_modality?: string | null
          coach_id?: string | null
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
      user_workouts: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          scheduled_date: string
          session_id: string
          status: string | null
          updated_at: string
          user_id: string
          auto_adjusted: boolean | null
          actual_tss: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          scheduled_date: string
          session_id: string
          status?: string | null
          updated_at?: string
          user_id: string
          auto_adjusted?: boolean | null
          actual_tss?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          scheduled_date?: string
          session_id?: string
          status?: string | null
          updated_at?: string
          user_id?: string
          auto_adjusted?: boolean | null
          actual_tss?: number | null
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
      user_biometrics: {
        Row: {
          id: string
          user_id: string
          date: string
          hrv: number
          rhr: number
          sleep_hours: number
          sleep_score: number
          weight: number
          fatigue_rating: number
          stress_level: number
          readiness_score: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          hrv?: number
          rhr?: number
          sleep_hours?: number
          sleep_score?: number
          weight?: number
          fatigue_rating?: number
          stress_level?: number
          readiness_score?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          hrv?: number
          rhr?: number
          sleep_hours?: number
          sleep_score?: number
          weight?: number
          fatigue_rating?: number
          stress_level?: number
          readiness_score?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_biometrics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      workout_feedback: {
        Row: {
          id: string
          workout_id: string
          user_id: string
          rpe_score: number
          feeling: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          workout_id: string
          user_id: string
          rpe_score: number
          feeling: string
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          workout_id?: string
          user_id?: string
          rpe_score?: number
          feeling?: string
          notes?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_feedback_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "user_workouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      coach_feedback: {
        Row: {
          id: string
          coach_id: string
          athlete_id: string | null
          feedback_type: string
          content: string
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          coach_id: string
          athlete_id?: string | null
          feedback_type: string
          content: string
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          coach_id?: string
          athlete_id?: string | null
          feedback_type?: string
          content?: string
          status?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_feedback_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_feedback_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      universal_telemetry: {
        Row: {
          id: string
          workout_id: string
          user_id: string
          source_provider: string
          external_activity_id: string
          actual_duration_min: number
          moving_time_min: number | null
          actual_distance_km: number
          elevation_gain_m: number | null
          actual_tss: number
          avg_hr: number | null
          max_hr: number | null
          hr_zones_summary: any | null
          avg_power: number | null
          normalized_power: number | null
          avg_cadence: number | null
          training_effect_aerobic: number | null
          training_effect_anaerobic: number | null
          raw_payload: any
          created_at: string
        }
        Insert: {
          id?: string
          workout_id: string
          user_id: string
          source_provider: string
          external_activity_id: string
          actual_duration_min: number
          moving_time_min?: number | null
          actual_distance_km: number
          elevation_gain_m?: number | null
          actual_tss: number
          avg_hr?: number | null
          max_hr?: number | null
          hr_zones_summary?: any | null
          avg_power?: number | null
          normalized_power?: number | null
          avg_cadence?: number | null
          training_effect_aerobic?: number | null
          training_effect_anaerobic?: number | null
          raw_payload: any
          created_at?: string
        }
        Update: {
          id?: string
          workout_id?: string
          user_id?: string
          source_provider?: string
          external_activity_id?: string
          actual_duration_min?: number
          moving_time_min?: number | null
          actual_distance_km?: number
          elevation_gain_m?: number | null
          actual_tss?: number
          avg_hr?: number | null
          max_hr?: number | null
          hr_zones_summary?: any | null
          avg_power?: number | null
          normalized_power?: number | null
          avg_cadence?: number | null
          training_effect_aerobic?: number | null
          training_effect_anaerobic?: number | null
          raw_payload?: any
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "universal_telemetry_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "user_workouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "universal_telemetry_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      user_connected_devices: {
        Row: {
          id: string
          user_id: string
          provider: string
          access_token: string
          refresh_token: string
          expires_at: string
          scopes: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          provider: string
          access_token: string
          refresh_token: string
          expires_at: string
          scopes?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          provider?: string
          access_token?: string
          refresh_token?: string
          expires_at?: string
          scopes?: string[]
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_connected_devices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      workout_sync_logs: {
        Row: {
          id: string
          workout_id: string
          user_id: string
          provider: string
          external_workout_id: string | null
          status: string
          error_message: string | null
          attempt_count: number
          next_retry_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workout_id: string
          user_id: string
          provider: string
          external_workout_id?: string | null
          status: string
          error_message?: string | null
          attempt_count?: number
          next_retry_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workout_id?: string
          user_id?: string
          provider?: string
          external_workout_id?: string | null
          status?: string
          error_message?: string | null
          attempt_count?: number
          next_retry_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_sync_logs_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "user_workouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_sync_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
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

