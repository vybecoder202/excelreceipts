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
      application_roles: {
        Row: {
          code: string
          description: string
          name: string
          privilege_rank: number
        }
        Insert: {
          code: string
          description: string
          name: string
          privilege_rank: number
        }
        Update: {
          code?: string
          description?: string
          name?: string
          privilege_rank?: number
        }
        Relationships: []
      }
      audit_events: {
        Row: {
          action: string
          actor_user_id: string | null
          after_state: Json | null
          before_state: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json
          occurred_at: string
          project_id: string | null
          request_id: string | null
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          after_state?: Json | null
          before_state?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json
          occurred_at?: string
          project_id?: string | null
          request_id?: string | null
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          after_state?: Json | null
          before_state?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json
          occurred_at?: string
          project_id?: string | null
          request_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_progress_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "audit_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      currencies: {
        Row: {
          code: string
          is_active: boolean
          minor_unit: number
          name: string
          symbol: string
        }
        Insert: {
          code: string
          is_active?: boolean
          minor_unit?: number
          name: string
          symbol: string
        }
        Update: {
          code?: string
          is_active?: boolean
          minor_unit?: number
          name?: string
          symbol?: string
        }
        Relationships: []
      }
      idempotency_keys: {
        Row: {
          actor_user_id: string
          completed_at: string | null
          created_at: string
          expires_at: string
          idempotency_key: string
          project_id: string | null
          request_hash: string
          response_data: Json | null
          scope: string
          status: string
        }
        Insert: {
          actor_user_id: string
          completed_at?: string | null
          created_at?: string
          expires_at?: string
          idempotency_key: string
          project_id?: string | null
          request_hash: string
          response_data?: Json | null
          scope: string
          status?: string
        }
        Update: {
          actor_user_id?: string
          completed_at?: string | null
          created_at?: string
          expires_at?: string
          idempotency_key?: string
          project_id?: string | null
          request_hash?: string
          response_data?: Json | null
          scope?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "idempotency_keys_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_progress_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "idempotency_keys_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      milestones: {
        Row: {
          archived_at: string | null
          completed_at: string | null
          created_at: string
          created_by: string
          description: string | null
          due_date: string
          id: string
          phase_id: string | null
          project_id: string
          reference: string
          status: string
          task_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          completed_at?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          due_date: string
          id?: string
          phase_id?: string | null
          project_id: string
          reference: string
          status?: string
          task_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string
          id?: string
          phase_id?: string | null
          project_id?: string
          reference?: string
          status?: string
          task_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_progress_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milestones_project_id_phase_id_fkey"
            columns: ["project_id", "phase_id"]
            isOneToOne: false
            referencedRelation: "phases"
            referencedColumns: ["project_id", "id"]
          },
          {
            foreignKeyName: "milestones_project_id_task_id_fkey"
            columns: ["project_id", "task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["project_id", "id"]
          },
        ]
      }
      number_sequences: {
        Row: {
          current_value: number
          entity_key: string
          prefix: string
          project_id: string
          updated_at: string
          year: number
        }
        Insert: {
          current_value?: number
          entity_key: string
          prefix: string
          project_id: string
          updated_at?: string
          year: number
        }
        Update: {
          current_value?: number
          entity_key?: string
          prefix?: string
          project_id?: string
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "number_sequences_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_progress_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "number_sequences_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      phases: {
        Row: {
          actual_end: string | null
          actual_start: string | null
          archived_at: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          planned_end: string | null
          planned_start: string | null
          project_id: string
          reference: string
          sort_order: number
          status: string
          updated_at: string
        }
        Insert: {
          actual_end?: string | null
          actual_start?: string | null
          archived_at?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          planned_end?: string | null
          planned_start?: string | null
          project_id: string
          reference: string
          sort_order: number
          status?: string
          updated_at?: string
        }
        Update: {
          actual_end?: string | null
          actual_start?: string | null
          archived_at?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          planned_end?: string | null
          planned_start?: string | null
          project_id?: string
          reference?: string
          sort_order?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "phases_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_progress_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "phases_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      progress_updates: {
        Row: {
          created_at: string
          created_by: string
          id: string
          overall_percent: number | null
          phase_id: string | null
          project_id: string
          summary: string
          task_id: string | null
          update_date: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          overall_percent?: number | null
          phase_id?: string | null
          project_id: string
          summary: string
          task_id?: string | null
          update_date?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          overall_percent?: number | null
          phase_id?: string | null
          project_id?: string
          summary?: string
          task_id?: string | null
          update_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "progress_updates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_progress_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "progress_updates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_updates_project_id_phase_id_fkey"
            columns: ["project_id", "phase_id"]
            isOneToOne: false
            referencedRelation: "phases"
            referencedColumns: ["project_id", "id"]
          },
          {
            foreignKeyName: "progress_updates_project_id_task_id_fkey"
            columns: ["project_id", "task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["project_id", "id"]
          },
        ]
      }
      project_memberships: {
        Row: {
          created_at: string
          invited_by: string | null
          joined_at: string | null
          project_id: string
          role_code: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          invited_by?: string | null
          joined_at?: string | null
          project_id: string
          role_code: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          invited_by?: string | null
          joined_at?: string | null
          project_id?: string
          role_code?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_memberships_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_progress_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_memberships_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_memberships_role_code_fkey"
            columns: ["role_code"]
            isOneToOne: false
            referencedRelation: "application_roles"
            referencedColumns: ["code"]
          },
        ]
      }
      project_settings: {
        Row: {
          created_at: string
          currency_code: string
          project_id: string
          timezone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency_code: string
          project_id: string
          timezone: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency_code?: string
          project_id?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_settings_currency_code_fkey"
            columns: ["currency_code"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "project_settings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "project_progress_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_settings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          archived_at: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          reference: string
          status: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          reference?: string
          status?: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          reference?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      task_dependencies: {
        Row: {
          created_at: string
          created_by: string
          dependency_type: string
          depends_on_task_id: string
          lag_days: number
          project_id: string
          task_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          dependency_type?: string
          depends_on_task_id: string
          lag_days?: number
          project_id: string
          task_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          dependency_type?: string
          depends_on_task_id?: string
          lag_days?: number
          project_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_dependencies_project_id_depends_on_task_id_fkey"
            columns: ["project_id", "depends_on_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["project_id", "id"]
          },
          {
            foreignKeyName: "task_dependencies_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_progress_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "task_dependencies_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_dependencies_project_id_task_id_fkey"
            columns: ["project_id", "task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["project_id", "id"]
          },
        ]
      }
      tasks: {
        Row: {
          archived_at: string | null
          completed_at: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          parent_task_id: string | null
          percent_complete: number
          phase_id: string | null
          planned_end: string | null
          planned_start: string | null
          priority: string
          progress_weight: number
          project_id: string
          reference: string
          sort_order: number
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          completed_at?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          parent_task_id?: string | null
          percent_complete?: number
          phase_id?: string | null
          planned_end?: string | null
          planned_start?: string | null
          priority?: string
          progress_weight?: number
          project_id: string
          reference: string
          sort_order: number
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          parent_task_id?: string | null
          percent_complete?: number
          phase_id?: string | null
          planned_end?: string | null
          planned_start?: string | null
          priority?: string
          progress_weight?: number
          project_id?: string
          reference?: string
          sort_order?: number
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_progress_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_parent_task_id_fkey"
            columns: ["project_id", "parent_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["project_id", "id"]
          },
          {
            foreignKeyName: "tasks_project_id_phase_id_fkey"
            columns: ["project_id", "phase_id"]
            isOneToOne: false
            referencedRelation: "phases"
            referencedColumns: ["project_id", "id"]
          },
        ]
      }
      units_of_measure: {
        Row: {
          category: string
          code: string
          decimal_scale: number
          is_active: boolean
          name: string
        }
        Insert: {
          category: string
          code: string
          decimal_scale?: number
          is_active?: boolean
          name: string
        }
        Update: {
          category?: string
          code?: string
          decimal_scale?: number
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      project_progress_summary: {
        Row: {
          open_task_count: number | null
          overdue_task_count: number | null
          percent_complete: number | null
          project_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      create_phase: {
        Args: {
          p_description?: string
          p_idempotency_key: string
          p_name: string
          p_planned_end?: string
          p_planned_start?: string
          p_project_id: string
        }
        Returns: string
      }
      create_project: {
        Args: {
          p_description?: string
          p_idempotency_key?: string
          p_name: string
        }
        Returns: string
      }
      create_task: {
        Args: {
          p_description?: string
          p_idempotency_key: string
          p_phase_id?: string
          p_planned_end?: string
          p_planned_start?: string
          p_priority?: string
          p_progress_weight?: number
          p_project_id: string
          p_title: string
        }
        Returns: string
      }
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
