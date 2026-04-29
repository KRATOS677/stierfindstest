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
  public: {
    Tables: {
      items: {
        Row: {
          category: string | null
          created_at: string
          date_reported: string | null
          description: string | null
          id: string
          image_path: string | null
          location: string | null
          name: string
          status: Database["public"]["Enums"]["item_status"]
          type: Database["public"]["Enums"]["item_type"]
          uploaded_by_name: string | null
          user_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          date_reported?: string | null
          description?: string | null
          id?: string
          image_path?: string | null
          location?: string | null
          name: string
          status?: Database["public"]["Enums"]["item_status"]
          type: Database["public"]["Enums"]["item_type"]
          uploaded_by_name?: string | null
          user_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          date_reported?: string | null
          description?: string | null
          id?: string
          image_path?: string | null
          location?: string | null
          name?: string
          status?: Database["public"]["Enums"]["item_status"]
          type?: Database["public"]["Enums"]["item_type"]
          uploaded_by_name?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          receiver_id: string | null
          receiver_type: Database["public"]["Enums"]["party_type"]
          sender_id: string | null
          sender_type: Database["public"]["Enums"]["party_type"]
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          receiver_id?: string | null
          receiver_type?: Database["public"]["Enums"]["party_type"]
          sender_id?: string | null
          sender_type?: Database["public"]["Enums"]["party_type"]
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          receiver_id?: string | null
          receiver_type?: Database["public"]["Enums"]["party_type"]
          sender_id?: string | null
          sender_type?: Database["public"]["Enums"]["party_type"]
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          from_type: Database["public"]["Enums"]["party_type"]
          from_user_id: string | null
          id: string
          is_read: boolean
          item_id: string | null
          item_name: string | null
          message: string
          to_type: Database["public"]["Enums"]["party_type"]
          to_user_id: string | null
          type: string
        }
        Insert: {
          created_at?: string
          from_type?: Database["public"]["Enums"]["party_type"]
          from_user_id?: string | null
          id?: string
          is_read?: boolean
          item_id?: string | null
          item_name?: string | null
          message: string
          to_type?: Database["public"]["Enums"]["party_type"]
          to_user_id?: string | null
          type?: string
        }
        Update: {
          created_at?: string
          from_type?: Database["public"]["Enums"]["party_type"]
          from_user_id?: string | null
          id?: string
          is_read?: boolean
          item_id?: string | null
          item_name?: string | null
          message?: string
          to_type?: Database["public"]["Enums"]["party_type"]
          to_user_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_path: string | null
          bio: string | null
          course: string | null
          created_at: string
          email: string
          id: string
          name: string
          phone: string | null
          social: string | null
          year_level: string | null
        }
        Insert: {
          avatar_path?: string | null
          bio?: string | null
          course?: string | null
          created_at?: string
          email?: string
          id: string
          name?: string
          phone?: string | null
          social?: string | null
          year_level?: string | null
        }
        Update: {
          avatar_path?: string | null
          bio?: string | null
          course?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone?: string | null
          social?: string | null
          year_level?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
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
      app_role: "admin" | "student"
      item_status: "unclaimed" | "pending" | "claimed" | "returned"
      item_type: "found" | "lost"
      party_type: "student" | "admin"
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
      app_role: ["admin", "student"],
      item_status: ["unclaimed", "pending", "claimed", "returned"],
      item_type: ["found", "lost"],
      party_type: ["student", "admin"],
    },
  },
} as const
