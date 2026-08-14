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
      attendance_records: {
        Row: {
          attendance_date: string
          attendance_status: string
          created_at: string
          created_by: string
          id: string
          notes: string | null
          project_id: string
          worker_id: string
        }
        Insert: {
          attendance_date: string
          attendance_status: string
          created_at?: string
          created_by: string
          id?: string
          notes?: string | null
          project_id: string
          worker_id: string
        }
        Update: {
          attendance_date?: string
          attendance_status?: string
          created_at?: string
          created_by?: string
          id?: string
          notes?: string | null
          project_id?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "attendance_records_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_progress_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "attendance_records_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_workforce_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "attendance_records_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_project_id_worker_id_fkey"
            columns: ["project_id", "worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["project_id", "id"]
          },
        ]
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
            referencedRelation: "project_financial_summary"
            referencedColumns: ["project_id"]
          },
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
            referencedRelation: "project_workforce_summary"
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
      budget_categories: {
        Row: {
          archived_at: string | null
          created_at: string
          created_by: string
          id: string
          name: string
          project_id: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          created_by: string
          id?: string
          name: string
          project_id: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_categories_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "budget_categories_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_progress_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "budget_categories_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_workforce_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "budget_categories_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_lines: {
        Row: {
          approved_amount: number
          archived_at: string | null
          category_id: string
          created_at: string
          created_by: string
          description: string
          forecast_amount: number
          id: string
          original_amount: number
          phase_id: string | null
          project_id: string
          reference: string
          updated_at: string
        }
        Insert: {
          approved_amount: number
          archived_at?: string | null
          category_id: string
          created_at?: string
          created_by: string
          description: string
          forecast_amount: number
          id?: string
          original_amount: number
          phase_id?: string | null
          project_id: string
          reference: string
          updated_at?: string
        }
        Update: {
          approved_amount?: number
          archived_at?: string | null
          category_id?: string
          created_at?: string
          created_by?: string
          description?: string
          forecast_amount?: number
          id?: string
          original_amount?: number
          phase_id?: string | null
          project_id?: string
          reference?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_lines_project_id_category_id_fkey"
            columns: ["project_id", "category_id"]
            isOneToOne: false
            referencedRelation: "budget_categories"
            referencedColumns: ["project_id", "id"]
          },
          {
            foreignKeyName: "budget_lines_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "budget_lines_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_progress_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "budget_lines_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_workforce_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "budget_lines_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_lines_project_id_phase_id_fkey"
            columns: ["project_id", "phase_id"]
            isOneToOne: false
            referencedRelation: "phases"
            referencedColumns: ["project_id", "id"]
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
      daily_site_logs: {
        Row: {
          created_at: string
          created_by: string
          delays_or_issues: string | null
          id: string
          log_date: string
          project_id: string
          reference: string
          updated_at: string
          weather_notes: string | null
          work_completed: string
          workers_present: number
        }
        Insert: {
          created_at?: string
          created_by: string
          delays_or_issues?: string | null
          id?: string
          log_date: string
          project_id: string
          reference: string
          updated_at?: string
          weather_notes?: string | null
          work_completed: string
          workers_present?: number
        }
        Update: {
          created_at?: string
          created_by?: string
          delays_or_issues?: string | null
          id?: string
          log_date?: string
          project_id?: string
          reference?: string
          updated_at?: string
          weather_notes?: string | null
          work_completed?: string
          workers_present?: number
        }
        Relationships: [
          {
            foreignKeyName: "daily_site_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "daily_site_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_progress_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "daily_site_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_workforce_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "daily_site_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      data_cells: {
        Row: {
          boolean_value: boolean | null
          created_at: string
          created_by: string
          date_value: string | null
          field_id: string
          id: string
          json_value: Json | null
          number_value: number | null
          option_value: string | null
          project_id: string
          record_id: string
          table_id: string
          text_value: string | null
          updated_at: string
          updated_by: string
        }
        Insert: {
          boolean_value?: boolean | null
          created_at?: string
          created_by: string
          date_value?: string | null
          field_id: string
          id?: string
          json_value?: Json | null
          number_value?: number | null
          option_value?: string | null
          project_id: string
          record_id: string
          table_id: string
          text_value?: string | null
          updated_at?: string
          updated_by: string
        }
        Update: {
          boolean_value?: boolean | null
          created_at?: string
          created_by?: string
          date_value?: string | null
          field_id?: string
          id?: string
          json_value?: Json | null
          number_value?: number | null
          option_value?: string | null
          project_id?: string
          record_id?: string
          table_id?: string
          text_value?: string | null
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_cells_project_id_field_id_fkey"
            columns: ["project_id", "field_id"]
            isOneToOne: false
            referencedRelation: "data_fields"
            referencedColumns: ["project_id", "id"]
          },
          {
            foreignKeyName: "data_cells_project_id_table_id_fkey"
            columns: ["project_id", "table_id"]
            isOneToOne: false
            referencedRelation: "data_tables"
            referencedColumns: ["project_id", "id"]
          },
          {
            foreignKeyName: "data_cells_table_id_record_id_fkey"
            columns: ["table_id", "record_id"]
            isOneToOne: false
            referencedRelation: "data_records"
            referencedColumns: ["table_id", "id"]
          },
        ]
      }
      data_fields: {
        Row: {
          archived_at: string | null
          config: Json
          created_at: string
          created_by: string
          field_type: string
          id: string
          is_primary: boolean
          is_required: boolean
          linked_table_id: string | null
          lookup_link_field_id: string | null
          lookup_target_field_id: string | null
          name: string
          position: number
          project_id: string
          table_id: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          config?: Json
          created_at?: string
          created_by: string
          field_type: string
          id?: string
          is_primary?: boolean
          is_required?: boolean
          linked_table_id?: string | null
          lookup_link_field_id?: string | null
          lookup_target_field_id?: string | null
          name: string
          position?: number
          project_id: string
          table_id: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          config?: Json
          created_at?: string
          created_by?: string
          field_type?: string
          id?: string
          is_primary?: boolean
          is_required?: boolean
          linked_table_id?: string | null
          lookup_link_field_id?: string | null
          lookup_target_field_id?: string | null
          name?: string
          position?: number
          project_id?: string
          table_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_fields_lookup_link_field_fk"
            columns: ["lookup_link_field_id"]
            isOneToOne: false
            referencedRelation: "data_fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_fields_lookup_target_field_fk"
            columns: ["lookup_target_field_id"]
            isOneToOne: false
            referencedRelation: "data_fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_fields_project_id_linked_table_id_fkey"
            columns: ["project_id", "linked_table_id"]
            isOneToOne: false
            referencedRelation: "data_tables"
            referencedColumns: ["project_id", "id"]
          },
          {
            foreignKeyName: "data_fields_project_id_table_id_fkey"
            columns: ["project_id", "table_id"]
            isOneToOne: false
            referencedRelation: "data_tables"
            referencedColumns: ["project_id", "id"]
          },
        ]
      }
      data_form_fields: {
        Row: {
          field_id: string
          form_id: string
          help_text: string | null
          is_hidden: boolean
          is_required: boolean
          position: number
        }
        Insert: {
          field_id: string
          form_id: string
          help_text?: string | null
          is_hidden?: boolean
          is_required?: boolean
          position?: number
        }
        Update: {
          field_id?: string
          form_id?: string
          help_text?: string | null
          is_hidden?: boolean
          is_required?: boolean
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "data_form_fields_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "data_fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_form_fields_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "data_forms"
            referencedColumns: ["id"]
          },
        ]
      }
      data_forms: {
        Row: {
          archived_at: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          project_id: string
          status: string
          submit_label: string
          table_id: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          project_id: string
          status?: string
          submit_label?: string
          table_id: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          project_id?: string
          status?: string
          submit_label?: string
          table_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_forms_project_id_table_id_fkey"
            columns: ["project_id", "table_id"]
            isOneToOne: false
            referencedRelation: "data_tables"
            referencedColumns: ["project_id", "id"]
          },
        ]
      }
      data_interface_blocks: {
        Row: {
          block_type: string
          config: Json
          created_at: string
          field_id: string | null
          id: string
          interface_id: string
          name: string
          position: number
          table_id: string | null
        }
        Insert: {
          block_type: string
          config?: Json
          created_at?: string
          field_id?: string | null
          id?: string
          interface_id: string
          name: string
          position?: number
          table_id?: string | null
        }
        Update: {
          block_type?: string
          config?: Json
          created_at?: string
          field_id?: string | null
          id?: string
          interface_id?: string
          name?: string
          position?: number
          table_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "data_interface_blocks_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "data_fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_interface_blocks_interface_id_fkey"
            columns: ["interface_id"]
            isOneToOne: false
            referencedRelation: "data_interfaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_interface_blocks_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "data_tables"
            referencedColumns: ["id"]
          },
        ]
      }
      data_interfaces: {
        Row: {
          archived_at: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          project_id: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          project_id: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_interfaces_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "data_interfaces_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_progress_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "data_interfaces_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_workforce_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "data_interfaces_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      data_record_comments: {
        Row: {
          body: string
          created_at: string
          created_by: string
          id: string
          project_id: string
          record_id: string
          table_id: string
        }
        Insert: {
          body: string
          created_at?: string
          created_by: string
          id?: string
          project_id: string
          record_id: string
          table_id: string
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string
          id?: string
          project_id?: string
          record_id?: string
          table_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_record_comments_project_id_table_id_fkey"
            columns: ["project_id", "table_id"]
            isOneToOne: false
            referencedRelation: "data_tables"
            referencedColumns: ["project_id", "id"]
          },
          {
            foreignKeyName: "data_record_comments_table_id_record_id_fkey"
            columns: ["table_id", "record_id"]
            isOneToOne: false
            referencedRelation: "data_records"
            referencedColumns: ["table_id", "id"]
          },
        ]
      }
      data_record_links: {
        Row: {
          created_at: string
          created_by: string
          field_id: string
          id: string
          position: number
          project_id: string
          source_record_id: string
          target_record_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          field_id: string
          id?: string
          position?: number
          project_id: string
          source_record_id: string
          target_record_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          field_id?: string
          id?: string
          position?: number
          project_id?: string
          source_record_id?: string
          target_record_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_record_links_project_id_field_id_fkey"
            columns: ["project_id", "field_id"]
            isOneToOne: false
            referencedRelation: "data_fields"
            referencedColumns: ["project_id", "id"]
          },
          {
            foreignKeyName: "data_record_links_project_id_source_record_id_fkey"
            columns: ["project_id", "source_record_id"]
            isOneToOne: false
            referencedRelation: "data_records"
            referencedColumns: ["project_id", "id"]
          },
          {
            foreignKeyName: "data_record_links_project_id_target_record_id_fkey"
            columns: ["project_id", "target_record_id"]
            isOneToOne: false
            referencedRelation: "data_records"
            referencedColumns: ["project_id", "id"]
          },
        ]
      }
      data_records: {
        Row: {
          archived_at: string | null
          created_at: string
          created_by: string
          id: string
          position: number
          project_id: string
          record_number: number
          table_id: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          created_by: string
          id?: string
          position: number
          project_id: string
          record_number?: never
          table_id: string
          updated_at?: string
          updated_by: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          created_by?: string
          id?: string
          position?: number
          project_id?: string
          record_number?: never
          table_id?: string
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_records_project_id_table_id_fkey"
            columns: ["project_id", "table_id"]
            isOneToOne: false
            referencedRelation: "data_tables"
            referencedColumns: ["project_id", "id"]
          },
        ]
      }
      data_tables: {
        Row: {
          archived_at: string | null
          color: string
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          position: number
          project_id: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          color?: string
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          position?: number
          project_id: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          color?: string
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          position?: number
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_tables_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "data_tables_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_progress_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "data_tables_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_workforce_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "data_tables_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      data_views: {
        Row: {
          archived_at: string | null
          created_at: string
          created_by: string
          filters: Json
          hidden_field_ids: string[]
          id: string
          name: string
          position: number
          project_id: string
          sorts: Json
          table_id: string
          updated_at: string
          view_type: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          created_by: string
          filters?: Json
          hidden_field_ids?: string[]
          id?: string
          name: string
          position?: number
          project_id: string
          sorts?: Json
          table_id: string
          updated_at?: string
          view_type?: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          created_by?: string
          filters?: Json
          hidden_field_ids?: string[]
          id?: string
          name?: string
          position?: number
          project_id?: string
          sorts?: Json
          table_id?: string
          updated_at?: string
          view_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_views_project_id_table_id_fkey"
            columns: ["project_id", "table_id"]
            isOneToOne: false
            referencedRelation: "data_tables"
            referencedColumns: ["project_id", "id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          category_id: string
          created_at: string
          created_by: string
          description: string
          expense_date: string
          id: string
          payment_status: string
          phase_id: string | null
          project_id: string
          reference: string
          status: string
          supplier_id: string | null
          voided_at: string | null
          voided_by: string | null
        }
        Insert: {
          amount: number
          category_id: string
          created_at?: string
          created_by: string
          description: string
          expense_date: string
          id?: string
          payment_status?: string
          phase_id?: string | null
          project_id: string
          reference: string
          status?: string
          supplier_id?: string | null
          voided_at?: string | null
          voided_by?: string | null
        }
        Update: {
          amount?: number
          category_id?: string
          created_at?: string
          created_by?: string
          description?: string
          expense_date?: string
          id?: string
          payment_status?: string
          phase_id?: string | null
          project_id?: string
          reference?: string
          status?: string
          supplier_id?: string | null
          voided_at?: string | null
          voided_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_project_id_category_id_fkey"
            columns: ["project_id", "category_id"]
            isOneToOne: false
            referencedRelation: "budget_categories"
            referencedColumns: ["project_id", "id"]
          },
          {
            foreignKeyName: "expenses_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "expenses_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_progress_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "expenses_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_workforce_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "expenses_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_project_id_phase_id_fkey"
            columns: ["project_id", "phase_id"]
            isOneToOne: false
            referencedRelation: "phases"
            referencedColumns: ["project_id", "id"]
          },
          {
            foreignKeyName: "expenses_project_id_supplier_id_fkey"
            columns: ["project_id", "supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["project_id", "id"]
          },
        ]
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
            referencedRelation: "project_financial_summary"
            referencedColumns: ["project_id"]
          },
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
            referencedRelation: "project_workforce_summary"
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
      materials: {
        Row: {
          archived_at: string | null
          category: string | null
          created_at: string
          created_by: string
          id: string
          name: string
          project_id: string
          reference: string
          reorder_level: number
          unit_code: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          category?: string | null
          created_at?: string
          created_by: string
          id?: string
          name: string
          project_id: string
          reference: string
          reorder_level?: number
          unit_code: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          category?: string | null
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          project_id?: string
          reference?: string
          reorder_level?: number
          unit_code?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "materials_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "materials_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_progress_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "materials_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_workforce_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "materials_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materials_unit_code_fkey"
            columns: ["unit_code"]
            isOneToOne: false
            referencedRelation: "units_of_measure"
            referencedColumns: ["code"]
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
            referencedRelation: "project_financial_summary"
            referencedColumns: ["project_id"]
          },
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
            referencedRelation: "project_workforce_summary"
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
            referencedRelation: "project_financial_summary"
            referencedColumns: ["project_id"]
          },
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
            referencedRelation: "project_workforce_summary"
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
            referencedRelation: "project_financial_summary"
            referencedColumns: ["project_id"]
          },
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
            referencedRelation: "project_workforce_summary"
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
            referencedRelation: "project_financial_summary"
            referencedColumns: ["project_id"]
          },
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
            referencedRelation: "project_workforce_summary"
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
            referencedRelation: "project_financial_summary"
            referencedColumns: ["project_id"]
          },
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
            referencedRelation: "project_workforce_summary"
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
            referencedRelation: "project_financial_summary"
            referencedColumns: ["project_id"]
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
            referencedRelation: "project_workforce_summary"
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
      stock_locations: {
        Row: {
          archived_at: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          project_id: string
          reference: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          project_id: string
          reference: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          project_id?: string
          reference?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_locations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "stock_locations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_progress_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "stock_locations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_workforce_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "stock_locations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          archived_at: string | null
          contact_name: string | null
          created_at: string
          created_by: string
          email: string | null
          id: string
          name: string
          phone: string | null
          project_id: string
          reference: string
          status: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          contact_name?: string | null
          created_at?: string
          created_by: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          project_id: string
          reference: string
          status?: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          contact_name?: string | null
          created_at?: string
          created_by?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          project_id?: string
          reference?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "suppliers_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_progress_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "suppliers_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_workforce_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "suppliers_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
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
            referencedRelation: "project_financial_summary"
            referencedColumns: ["project_id"]
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
            referencedRelation: "project_workforce_summary"
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
            referencedRelation: "project_financial_summary"
            referencedColumns: ["project_id"]
          },
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
            referencedRelation: "project_workforce_summary"
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
      workers: {
        Row: {
          archived_at: string | null
          created_at: string
          created_by: string
          full_name: string
          id: string
          phone: string | null
          project_id: string
          reference: string
          status: string
          trade: string | null
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          created_by: string
          full_name: string
          id?: string
          phone?: string | null
          project_id: string
          reference: string
          status?: string
          trade?: string | null
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          created_by?: string
          full_name?: string
          id?: string
          phone?: string | null
          project_id?: string
          reference?: string
          status?: string
          trade?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workers_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "workers_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_progress_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "workers_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_workforce_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "workers_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      project_financial_summary: {
        Row: {
          actual_cost: number | null
          approved_budget: number | null
          committed_cost: number | null
          forecast_final_cost: number | null
          original_budget: number | null
          payments_made: number | null
          project_id: string | null
          remaining_budget: number | null
          unpaid_expense_count: number | null
        }
        Relationships: []
      }
      project_progress_summary: {
        Row: {
          open_task_count: number | null
          overdue_task_count: number | null
          percent_complete: number | null
          project_id: string | null
        }
        Relationships: []
      }
      project_workforce_summary: {
        Row: {
          active_worker_count: number | null
          project_id: string | null
          workers_recorded_today: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      archive_data_field: {
        Args: {
          p_field_id: string
          p_idempotency_key: string
          p_project_id: string
        }
        Returns: string
      }
      archive_data_record: {
        Args: {
          p_idempotency_key: string
          p_project_id: string
          p_record_id: string
        }
        Returns: string
      }
      archive_data_table: {
        Args: {
          p_idempotency_key: string
          p_project_id: string
          p_table_id: string
        }
        Returns: string
      }
      create_budget_item: {
        Args: {
          p_category_name: string
          p_description: string
          p_forecast_amount: number
          p_idempotency_key: string
          p_original_amount: number
          p_phase_id?: string
          p_project_id: string
        }
        Returns: string
      }
      create_daily_site_log: {
        Args: {
          p_delays_or_issues?: string
          p_idempotency_key: string
          p_log_date: string
          p_project_id: string
          p_weather_notes?: string
          p_work_completed: string
          p_workers_present: number
        }
        Returns: string
      }
      create_data_field: {
        Args: {
          p_config?: Json
          p_field_type: string
          p_idempotency_key: string
          p_is_required?: boolean
          p_linked_table_id?: string
          p_lookup_link_field_id?: string
          p_lookup_target_field_id?: string
          p_name: string
          p_project_id: string
          p_table_id: string
        }
        Returns: string
      }
      create_data_form: {
        Args: {
          p_description?: string
          p_idempotency_key: string
          p_name: string
          p_project_id: string
          p_submit_label?: string
          p_table_id: string
        }
        Returns: string
      }
      create_data_interface: {
        Args: {
          p_description?: string
          p_idempotency_key: string
          p_name: string
          p_project_id: string
          p_table_id: string
        }
        Returns: string
      }
      create_data_record_comment: {
        Args: {
          p_body: string
          p_idempotency_key: string
          p_project_id: string
          p_record_id: string
        }
        Returns: string
      }
      create_data_table: {
        Args: {
          p_color?: string
          p_description?: string
          p_idempotency_key: string
          p_name: string
          p_project_id: string
        }
        Returns: string
      }
      create_data_view: {
        Args: {
          p_idempotency_key: string
          p_name: string
          p_project_id: string
          p_table_id: string
          p_view_type: string
        }
        Returns: string
      }
      create_expense: {
        Args: {
          p_amount: number
          p_category_id: string
          p_description: string
          p_expense_date: string
          p_idempotency_key: string
          p_phase_id?: string
          p_project_id: string
          p_supplier_id?: string
        }
        Returns: string
      }
      create_material: {
        Args: {
          p_category?: string
          p_idempotency_key: string
          p_name: string
          p_project_id: string
          p_reorder_level: number
          p_unit_code: string
        }
        Returns: string
      }
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
      create_positioned_data_record: {
        Args: {
          p_anchor_record_id: string
          p_idempotency_key: string
          p_links: Json
          p_placement: string
          p_project_id: string
          p_table_id: string
          p_values: Json
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
      create_stock_location: {
        Args: {
          p_description?: string
          p_idempotency_key: string
          p_name: string
          p_project_id: string
        }
        Returns: string
      }
      create_supplier: {
        Args: {
          p_contact_name?: string
          p_email?: string
          p_idempotency_key: string
          p_name: string
          p_phone?: string
          p_project_id: string
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
      create_worker: {
        Args: {
          p_full_name: string
          p_idempotency_key: string
          p_phone?: string
          p_project_id: string
          p_trade?: string
        }
        Returns: string
      }
      duplicate_data_record: {
        Args: {
          p_idempotency_key: string
          p_project_id: string
          p_record_id: string
        }
        Returns: string
      }
      install_construction_workspace: {
        Args: { p_idempotency_key: string; p_project_id: string }
        Returns: string
      }
      record_attendance: {
        Args: {
          p_attendance_date: string
          p_attendance_status: string
          p_idempotency_key: string
          p_notes?: string
          p_project_id: string
          p_worker_id: string
        }
        Returns: string
      }
      reorder_data_fields: {
        Args: {
          p_idempotency_key: string
          p_ordered_field_ids: string[]
          p_project_id: string
          p_table_id: string
        }
        Returns: string
      }
      save_data_record: {
        Args: {
          p_idempotency_key: string
          p_links: Json
          p_project_id: string
          p_record_id?: string
          p_table_id: string
          p_values: Json
        }
        Returns: string
      }
      update_task_progress: {
        Args: {
          p_idempotency_key: string
          p_percent_complete: number
          p_project_id: string
          p_status: string
          p_summary: string
          p_task_id: string
          p_update_date: string
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
