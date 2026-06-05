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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      app_admins: {
        Row: {
          created_at: string
          role: Database["public"]["Enums"]["admin_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          role?: Database["public"]["Enums"]["admin_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          role?: Database["public"]["Enums"]["admin_role"]
          user_id?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          organization_id: string
          resource_id: string | null
          resource_type: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          organization_id: string
          resource_id?: string | null
          resource_type?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          organization_id?: string
          resource_id?: string | null
          resource_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          organization_id: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          organization_id: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          organization_id?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string
          google_drive_folder_id: string | null
          id: string
          identifications: Json | null
          nationality: string | null
          notes: string | null
          organization_id: string
          phone: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name: string
          google_drive_folder_id?: string | null
          id?: string
          identifications?: Json | null
          nationality?: string | null
          notes?: string | null
          organization_id: string
          phone?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string
          google_drive_folder_id?: string | null
          id?: string
          identifications?: Json | null
          nationality?: string | null
          notes?: string | null
          organization_id?: string
          phone?: string | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          category: string | null
          client_id: string | null
          created_at: string | null
          id: string
          mime_type: string | null
          name: string
          organization_id: string
          procedure_id: string | null
          size: number | null
          storage_path: string
          url: string
        }
        Insert: {
          category?: string | null
          client_id?: string | null
          created_at?: string | null
          id?: string
          mime_type?: string | null
          name: string
          organization_id: string
          procedure_id?: string | null
          size?: number | null
          storage_path: string
          url: string
        }
        Update: {
          category?: string | null
          client_id?: string | null
          created_at?: string | null
          id?: string
          mime_type?: string | null
          name?: string
          organization_id?: string
          procedure_id?: string | null
          size?: number | null
          storage_path?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_procedure_id_fkey"
            columns: ["procedure_id"]
            isOneToOne: false
            referencedRelation: "procedures"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          created_at: string | null
          id: string
          name: string
          organization_id: string
          phone: string
          service_interest: string | null
          status: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          organization_id: string
          phone: string
          service_interest?: string | null
          status?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          organization_id?: string
          phone?: string
          service_interest?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          link: string | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message: string
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          city: string | null
          country: string | null
          created_at: string | null
          created_by: string
          id: string
          logo_url: string | null
          name: string
          page_views: number | null
          plan: string
          plan_code: string | null
          plan_tier: Database["public"]["Enums"]["plan_tier"]
          public_settings: Json | null
          slug: string | null
          status: Database["public"]["Enums"]["subscription_status"]
          subscription_ends_at: string | null
          trial_ends_at: string | null
          updated_at: string | null
          whatsapp: string | null
          whatsapp_contact: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string | null
          created_by: string
          id?: string
          logo_url?: string | null
          name: string
          page_views?: number | null
          plan?: string
          plan_code?: string | null
          plan_tier?: Database["public"]["Enums"]["plan_tier"]
          public_settings?: Json | null
          slug?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          subscription_ends_at?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
          whatsapp?: string | null
          whatsapp_contact?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string
          id?: string
          logo_url?: string | null
          name?: string
          page_views?: number | null
          plan?: string
          plan_code?: string | null
          plan_tier?: Database["public"]["Enums"]["plan_tier"]
          public_settings?: Json | null
          slug?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          subscription_ends_at?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
          whatsapp?: string | null
          whatsapp_contact?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizations_plan_code_fkey"
            columns: ["plan_code"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["code"]
          },
        ]
      }
      payment_reports: {
        Row: {
          admin_note: string | null
          amount: number
          created_at: string | null
          currency: Database["public"]["Enums"]["payment_currency"]
          id: string
          operation_number: string
          organization_id: string
          payment_method_id: string
          proof_url: string
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string | null
        }
        Insert: {
          admin_note?: string | null
          amount: number
          created_at?: string | null
          currency?: Database["public"]["Enums"]["payment_currency"]
          id?: string
          operation_number: string
          organization_id: string
          payment_method_id: string
          proof_url: string
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string | null
        }
        Update: {
          admin_note?: string | null
          amount?: number
          created_at?: string | null
          currency?: Database["public"]["Enums"]["payment_currency"]
          id?: string
          operation_number?: string
          organization_id?: string
          payment_method_id?: string
          proof_url?: string
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_reports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      procedure_documents: {
        Row: {
          created_at: string | null
          document_id: string
          procedure_id: string
        }
        Insert: {
          created_at?: string | null
          document_id: string
          procedure_id: string
        }
        Update: {
          created_at?: string | null
          document_id?: string
          procedure_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "procedure_documents_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "procedure_documents_procedure_id_fkey"
            columns: ["procedure_id"]
            isOneToOne: false
            referencedRelation: "procedures"
            referencedColumns: ["id"]
          },
        ]
      }
      procedure_notes: {
        Row: {
          content: string
          created_at: string | null
          created_by: string | null
          id: string
          procedure_id: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          procedure_id: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          procedure_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "procedure_notes_procedure_id_fkey"
            columns: ["procedure_id"]
            isOneToOne: false
            referencedRelation: "procedures"
            referencedColumns: ["id"]
          },
        ]
      }
      procedure_statuses: {
        Row: {
          color: string
          created_at: string
          id: string
          is_final: boolean
          name: string
          order_index: number
          organization_id: string
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          is_final?: boolean
          name: string
          order_index?: number
          organization_id: string
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          is_final?: boolean
          name?: string
          order_index?: number
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "procedure_statuses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      procedure_templates: {
        Row: {
          category: string | null
          created_at: string | null
          created_by: string
          currency: string | null
          description: string | null
          duration_resolution: number | null
          duration_work: number | null
          fees: number | null
          fees_official: number | null
          fees_professional: number | null
          government_fee: number | null
          id: string
          is_active: boolean | null
          is_archived: boolean
          is_custom_category: boolean | null
          is_publicly_visible: boolean | null
          name: string
          organization_id: string
          payment_terms: string | null
          public_settings: Json | null
          renewal_frequency: number | null
          requirements: Json | null
          requires_renewal: boolean | null
          share_token: string | null
          share_url: string | null
          source_ip_country: string | null
          source_template_id: string | null
          steps: Json | null
          updated_at: string | null
          visibility: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          created_by: string
          currency?: string | null
          description?: string | null
          duration_resolution?: number | null
          duration_work?: number | null
          fees?: number | null
          fees_official?: number | null
          fees_professional?: number | null
          government_fee?: number | null
          id?: string
          is_active?: boolean | null
          is_archived?: boolean
          is_custom_category?: boolean | null
          is_publicly_visible?: boolean | null
          name: string
          organization_id: string
          payment_terms?: string | null
          public_settings?: Json | null
          renewal_frequency?: number | null
          requirements?: Json | null
          requires_renewal?: boolean | null
          share_token?: string | null
          share_url?: string | null
          source_ip_country?: string | null
          source_template_id?: string | null
          steps?: Json | null
          updated_at?: string | null
          visibility?: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          created_by?: string
          currency?: string | null
          description?: string | null
          duration_resolution?: number | null
          duration_work?: number | null
          fees?: number | null
          fees_official?: number | null
          fees_professional?: number | null
          government_fee?: number | null
          id?: string
          is_active?: boolean | null
          is_archived?: boolean
          is_custom_category?: boolean | null
          is_publicly_visible?: boolean | null
          name?: string
          organization_id?: string
          payment_terms?: string | null
          public_settings?: Json | null
          renewal_frequency?: number | null
          requirements?: Json | null
          requires_renewal?: boolean | null
          share_token?: string | null
          share_url?: string | null
          source_ip_country?: string | null
          source_template_id?: string | null
          steps?: Json | null
          updated_at?: string | null
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "procedure_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "procedure_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "procedure_templates_source_template_id_fkey"
            columns: ["source_template_id"]
            isOneToOne: false
            referencedRelation: "procedure_templates"
            referencedColumns: ["id"]
          },
        ]
      }
procedures: {
  Row: {
    checklist_progress: Json | null
    client_id: string
    created_at: string | null
    created_by: string | null
    current_step: number | null
    current_step_index: number | null
    description: string | null
    due_date: string | null
    expiration_date: string | null
    google_drive_link: string | null
    id: string
    organization_id: string
    payment_status: string | null
    requirements_snapshot: Json | null
    start_date: string | null
    status: string | null
    status_id: string | null
    steps_progress: Json | null
    template_id: string | null
    title: string
    tracking_id: string | null
    updated_at: string | null
  }
Insert: {
    checklist_progress?: Json | null
    client_id: string
    created_at?: string | null
    created_by?: string | null
    current_step?: number | null
    current_step_index?: number | null
    description?: string | null
    due_date?: string | null
    expiration_date?: string | null
    google_drive_link?: string | null
    id?: string
    organization_id: string
    payment_status?: string | null
    requirements_snapshot?: Json | null
    start_date?: string | null
    status?: string | null
    status_id?: string | null
    steps_progress?: Json | null
    template_id?: string | null
    title?: string
    tracking_id?: string | null
    updated_at?: string | null
  }
  Update: {
    checklist_progress?: Json | null
    client_id?: string
    created_at?: string | null
    created_by?: string | null
    current_step?: number | null
    current_step_index?: number | null
    description?: string | null
    due_date?: string | null
    expiration_date?: string | null
    google_drive_link?: string | null
    id?: string
    organization_id?: string
    payment_status?: string | null
    requirements_snapshot?: Json | null
    start_date?: string | null
    status?: string | null
    status_id?: string | null
    steps_progress?: Json | null
    template_id?: string | null
    title?: string
    tracking_id?: string | null
    updated_at?: string | null
  }
        Relationships: [
          {
            foreignKeyName: "procedures_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "procedures_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "procedures_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "procedure_statuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "procedures_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "procedure_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email_verified: boolean | null
          full_name: string | null
          id: string
          last_ip: string | null
          last_seen_at: string | null
          organization_id: string | null
          phone: string | null
          registration_ip: string | null
          role: string | null
          updated_at: string | null
          verification_code: string | null
          verification_code_expires_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email_verified?: boolean | null
          full_name?: string | null
          id: string
          last_ip?: string | null
          last_seen_at?: string | null
          organization_id?: string | null
          phone?: string | null
          registration_ip?: string | null
          role?: string | null
          updated_at?: string | null
          verification_code?: string | null
          verification_code_expires_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email_verified?: boolean | null
          full_name?: string | null
          id?: string
          last_ip?: string | null
          last_seen_at?: string | null
          organization_id?: string | null
          phone?: string | null
          registration_ip?: string | null
          role?: string | null
          updated_at?: string | null
          verification_code?: string | null
          verification_code_expires_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          code: string
          created_at: string | null
          grace_allowance: number
          id: string
          is_active: boolean | null
          max_clients: number
          max_procedures: number
          max_storage_mb: number
          name: string
          price_pen: number
        }
        Insert: {
          code: string
          created_at?: string | null
          grace_allowance?: number
          id?: string
          is_active?: boolean | null
          max_clients: number
          max_procedures: number
          max_storage_mb: number
          name: string
          price_pen?: number
        }
        Update: {
          code?: string
          created_at?: string | null
          grace_allowance?: number
          id?: string
          is_active?: boolean | null
          max_clients?: number
          max_procedures?: number
          max_storage_mb?: number
          name?: string
          price_pen?: number
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      template_leads: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string
          template_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone: string
          template_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_leads_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "procedure_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      template_permissions: {
        Row: {
          created_at: string | null
          email: string
          id: string
          template_id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          template_id: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_permissions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "procedure_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      template_views: {
        Row: {
          created_at: string
          device_type: string | null
          id: number
          template_id: string
        }
        Insert: {
          created_at?: string
          device_type?: string | null
          id?: never
          template_id: string
        }
        Update: {
          created_at?: string
          device_type?: string | null
          id?: never
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_views_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "procedure_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_logs: {
        Row: {
          created_at: string
          event_name: string
          id: string
          metadata: Json | null
          organization_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_name: string
          id?: string
          metadata?: Json | null
          organization_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_name?: string
          id?: string
          metadata?: Json | null
          organization_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "usage_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_fix_missing_profile: {
        Args: { target_user_id: string }
        Returns: undefined
      }
      create_organization_with_owner: {
        Args: {
          p_logo_url?: string
          p_name: string
          p_plan?: string
          p_slug: string
        }
        Returns: string
      }
      create_user_profile: {
        Args: { user_full_name?: string; user_id: string; user_role?: string }
        Returns: string
      }
      get_admin_users: {
        Args: { search_text?: string }
        Returns: {
          admin_role: string
          avatar_url: string
          created_at: string
          email: string
          full_name: string
          id: string
          is_banned: boolean
          last_ip: string
          last_sign_in_at: string
          organization_id: string
          organization_name: string
        }[]
      }
      get_online_users: {
        Args: { threshold_minutes?: number }
        Returns: {
          avatar_url: string
          full_name: string
          id: string
          last_seen_at: string
          organization_name: string
        }[]
      }
      get_user_organizations: {
        Args: never
        Returns: {
          id: string
          logo_url: string
          name: string
          plan: string
          role: string
          slug: string
        }[]
      }
      increment_page_view: { Args: { org_id: string }; Returns: undefined }
      is_app_super_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      admin_role: "super_admin" | "support" | "analyst"
      payment_currency: "PEN" | "USD"
      payment_status: "pending" | "approved" | "rejected"
      plan_tier: "free" | "pro"
      subscription_status: "active" | "trialing" | "past_due" | "canceled"
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
  public: {
    Enums: {
      admin_role: ["super_admin", "support", "analyst"],
      payment_currency: ["PEN", "USD"],
      payment_status: ["pending", "approved", "rejected"],
      plan_tier: ["free", "pro"],
      subscription_status: ["active", "trialing", "past_due", "canceled"],
    },
  },
} as const
