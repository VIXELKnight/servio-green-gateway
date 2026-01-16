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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          activity_type: string
          created_at: string
          description: string | null
          id: string
          metadata: Json | null
          title: string
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          title: string
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      bot_channels: {
        Row: {
          bot_id: string
          channel_type: string
          config: Json | null
          created_at: string
          embed_key: string | null
          id: string
          is_active: boolean
          oauth_expires_at: string | null
          oauth_state: string | null
          token_expires_at: string | null
          token_refreshed_at: string | null
          updated_at: string
        }
        Insert: {
          bot_id: string
          channel_type: string
          config?: Json | null
          created_at?: string
          embed_key?: string | null
          id?: string
          is_active?: boolean
          oauth_expires_at?: string | null
          oauth_state?: string | null
          token_expires_at?: string | null
          token_refreshed_at?: string | null
          updated_at?: string
        }
        Update: {
          bot_id?: string
          channel_type?: string
          config?: Json | null
          created_at?: string
          embed_key?: string | null
          id?: string
          is_active?: boolean
          oauth_expires_at?: string | null
          oauth_state?: string | null
          token_expires_at?: string | null
          token_refreshed_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bot_channels_bot_id_fkey"
            columns: ["bot_id"]
            isOneToOne: false
            referencedRelation: "bots"
            referencedColumns: ["id"]
          },
        ]
      }
      bot_conversations: {
        Row: {
          bot_id: string
          channel_type: string
          created_at: string
          escalation_reason: string | null
          id: string
          status: string
          updated_at: string
          visitor_email: string | null
          visitor_id: string
          visitor_name: string | null
        }
        Insert: {
          bot_id: string
          channel_type: string
          created_at?: string
          escalation_reason?: string | null
          id?: string
          status?: string
          updated_at?: string
          visitor_email?: string | null
          visitor_id: string
          visitor_name?: string | null
        }
        Update: {
          bot_id?: string
          channel_type?: string
          created_at?: string
          escalation_reason?: string | null
          id?: string
          status?: string
          updated_at?: string
          visitor_email?: string | null
          visitor_id?: string
          visitor_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bot_conversations_bot_id_fkey"
            columns: ["bot_id"]
            isOneToOne: false
            referencedRelation: "bots"
            referencedColumns: ["id"]
          },
        ]
      }
      bot_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          metadata: Json | null
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "bot_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "bot_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      bot_shopify_integrations: {
        Row: {
          access_token: string
          bot_id: string
          created_at: string
          id: string
          is_active: boolean
          store_domain: string
          updated_at: string
        }
        Insert: {
          access_token: string
          bot_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          store_domain: string
          updated_at?: string
        }
        Update: {
          access_token?: string
          bot_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          store_domain?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bot_shopify_integrations_bot_id_fkey"
            columns: ["bot_id"]
            isOneToOne: true
            referencedRelation: "bots"
            referencedColumns: ["id"]
          },
        ]
      }
      bots: {
        Row: {
          created_at: string
          description: string | null
          id: string
          instructions: string
          is_active: boolean
          name: string
          triage_enabled: boolean
          triage_threshold: number | null
          updated_at: string
          user_id: string
          welcome_message: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          instructions?: string
          is_active?: boolean
          name: string
          triage_enabled?: boolean
          triage_threshold?: number | null
          updated_at?: string
          user_id: string
          welcome_message?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          instructions?: string
          is_active?: boolean
          name?: string
          triage_enabled?: boolean
          triage_threshold?: number | null
          updated_at?: string
          user_id?: string
          welcome_message?: string | null
        }
        Relationships: []
      }
      contact_submissions: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          reply_body: string | null
          reply_channel: string | null
          responded_at: string | null
          responded_by: string | null
          status: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          reply_body?: string | null
          reply_channel?: string | null
          responded_at?: string | null
          responded_by?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          reply_body?: string | null
          reply_channel?: string | null
          responded_at?: string | null
          responded_by?: string | null
          status?: string
        }
        Relationships: []
      }
      dashboard_stats: {
        Row: {
          avg_response_time_minutes: number
          emails_processed: number
          id: string
          resolved_tickets: number
          satisfaction_rate: number
          total_tickets: number
          updated_at: string
          user_id: string
        }
        Insert: {
          avg_response_time_minutes?: number
          emails_processed?: number
          id?: string
          resolved_tickets?: number
          satisfaction_rate?: number
          total_tickets?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          avg_response_time_minutes?: number
          emails_processed?: number
          id?: string
          resolved_tickets?: number
          satisfaction_rate?: number
          total_tickets?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      knowledge_base: {
        Row: {
          bot_id: string
          category: string | null
          content: string
          created_at: string
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          bot_id: string
          category?: string | null
          content: string
          created_at?: string
          id?: string
          title: string
          updated_at?: string
        }
        Update: {
          bot_id?: string
          category?: string | null
          content?: string
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_base_bot_id_fkey"
            columns: ["bot_id"]
            isOneToOne: false
            referencedRelation: "bots"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          created_at: string
          description: string | null
          id: string
          priority: string
          resolved_at: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          priority?: string
          resolved_at?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          priority?: string
          resolved_at?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      bot_channels_public: {
        Row: {
          bot_id: string | null
          channel_type: string | null
          config: Json | null
          created_at: string | null
          embed_key: string | null
          id: string | null
          is_active: boolean | null
          updated_at: string | null
        }
        Insert: {
          bot_id?: string | null
          channel_type?: string | null
          config?: never
          created_at?: string | null
          embed_key?: string | null
          id?: string | null
          is_active?: boolean | null
          updated_at?: string | null
        }
        Update: {
          bot_id?: string | null
          channel_type?: string | null
          config?: never
          created_at?: string | null
          embed_key?: string | null
          id?: string | null
          is_active?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bot_channels_bot_id_fkey"
            columns: ["bot_id"]
            isOneToOne: false
            referencedRelation: "bots"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
