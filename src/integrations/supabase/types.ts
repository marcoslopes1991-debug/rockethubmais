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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          category: string
          condition_type: string
          condition_value: number
          created_at: string
          description: string
          icon_emoji: string
          id: string
          key: string
          name: string
        }
        Insert: {
          category?: string
          condition_type: string
          condition_value?: number
          created_at?: string
          description?: string
          icon_emoji?: string
          id?: string
          key: string
          name: string
        }
        Update: {
          category?: string
          condition_type?: string
          condition_value?: number
          created_at?: string
          description?: string
          icon_emoji?: string
          id?: string
          key?: string
          name?: string
        }
        Relationships: []
      }
      ad_events: {
        Row: {
          ad_id: string
          created_at: string
          event_type: string
          id: string
          user_id: string | null
        }
        Insert: {
          ad_id: string
          created_at?: string
          event_type: string
          id?: string
          user_id?: string | null
        }
        Update: {
          ad_id?: string
          created_at?: string
          event_type?: string
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_events_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
        ]
      }
      ads: {
        Row: {
          created_at: string
          cta_text: string | null
          description: string
          end_date: string | null
          frequency: number
          id: string
          image_url: string | null
          image_url_mobile: string | null
          is_active: boolean
          link_url: string | null
          max_impressions_per_user: number | null
          max_impressions_total: number | null
          priority: string
          start_date: string
          title: string
          updated_at: string
          video_url: string | null
          video_url_mobile: string | null
        }
        Insert: {
          created_at?: string
          cta_text?: string | null
          description?: string
          end_date?: string | null
          frequency?: number
          id?: string
          image_url?: string | null
          image_url_mobile?: string | null
          is_active?: boolean
          link_url?: string | null
          max_impressions_per_user?: number | null
          max_impressions_total?: number | null
          priority?: string
          start_date?: string
          title: string
          updated_at?: string
          video_url?: string | null
          video_url_mobile?: string | null
        }
        Update: {
          created_at?: string
          cta_text?: string | null
          description?: string
          end_date?: string | null
          frequency?: number
          id?: string
          image_url?: string | null
          image_url_mobile?: string | null
          is_active?: boolean
          link_url?: string | null
          max_impressions_per_user?: number | null
          max_impressions_total?: number | null
          priority?: string
          start_date?: string
          title?: string
          updated_at?: string
          video_url?: string | null
          video_url_mobile?: string | null
        }
        Relationships: []
      }
      ai_config: {
        Row: {
          ai_name: string
          app_name: string
          button_image_url: string | null
          favicon_url: string | null
          id: string
          logo_url: string | null
          updated_at: string
          welcome_message: string
        }
        Insert: {
          ai_name?: string
          app_name?: string
          button_image_url?: string | null
          favicon_url?: string | null
          id?: string
          logo_url?: string | null
          updated_at?: string
          welcome_message?: string
        }
        Update: {
          ai_name?: string
          app_name?: string
          button_image_url?: string | null
          favicon_url?: string | null
          id?: string
          logo_url?: string | null
          updated_at?: string
          welcome_message?: string
        }
        Relationships: []
      }
      answers: {
        Row: {
          answered_at: string
          id: string
          is_correct: boolean
          question_id: string
          selected_option: string
          user_id: string
        }
        Insert: {
          answered_at?: string
          id?: string
          is_correct: boolean
          question_id: string
          selected_option: string
          user_id: string
        }
        Update: {
          answered_at?: string
          id?: string
          is_correct?: boolean
          question_id?: string
          selected_option?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      items: {
        Row: {
          category: string
          created_at: string
          description: string
          icon_emoji: string
          id: string
          name: string
          required_level: number
          required_xp: number
        }
        Insert: {
          category: string
          created_at?: string
          description?: string
          icon_emoji?: string
          id?: string
          name: string
          required_level?: number
          required_xp?: number
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          icon_emoji?: string
          id?: string
          name?: string
          required_level?: number
          required_xp?: number
        }
        Relationships: []
      }
      levels: {
        Row: {
          avatar_female_url: string | null
          avatar_male_url: string | null
          created_at: string
          description: string
          id: string
          level_number: number
          min_xp: number
          name: string
        }
        Insert: {
          avatar_female_url?: string | null
          avatar_male_url?: string | null
          created_at?: string
          description?: string
          id?: string
          level_number: number
          min_xp?: number
          name: string
        }
        Update: {
          avatar_female_url?: string | null
          avatar_male_url?: string | null
          created_at?: string
          description?: string
          id?: string
          level_number?: number
          min_xp?: number
          name?: string
        }
        Relationships: []
      }
      mission_config: {
        Row: {
          daily_question_count: number
          extra_question_count: number | null
          id: string
          special_question_count: number | null
          updated_at: string
        }
        Insert: {
          daily_question_count?: number
          extra_question_count?: number | null
          id?: string
          special_question_count?: number | null
          updated_at?: string
        }
        Update: {
          daily_question_count?: number
          extra_question_count?: number | null
          id?: string
          special_question_count?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string
          id: string
          message: string
          read: boolean
          reference_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          id?: string
          message: string
          read?: boolean
          reference_id?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          reference_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      onboarding_courses: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      onboarding_modules: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          content: string
          created_at: string
          file_name: string | null
          file_url: string | null
          id: string
          image_url: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string
          created_at?: string
          file_name?: string | null
          file_url?: string | null
          id?: string
          image_url?: string | null
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          file_name?: string | null
          file_url?: string | null
          id?: string
          image_url?: string | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          blocked: boolean
          created_at: string
          cursos_rockethub: string[] | null
          display_name: string
          gender: string | null
          hide_followers: boolean
          id: string
          is_premium: boolean
          is_public: boolean
          last_activity_date: string | null
          modulos_interesse: string[] | null
          notifications_enabled: boolean
          perfil_sap: string | null
          status: string
          streak_count: number
          tempo_experiencia_sap: string | null
          trabalha_com_sap: boolean | null
          updated_at: string
          user_id: string
          username: string | null
          xp: number
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          blocked?: boolean
          created_at?: string
          cursos_rockethub?: string[] | null
          display_name?: string
          gender?: string | null
          hide_followers?: boolean
          id?: string
          is_premium?: boolean
          is_public?: boolean
          last_activity_date?: string | null
          modulos_interesse?: string[] | null
          notifications_enabled?: boolean
          perfil_sap?: string | null
          status?: string
          streak_count?: number
          tempo_experiencia_sap?: string | null
          trabalha_com_sap?: boolean | null
          updated_at?: string
          user_id: string
          username?: string | null
          xp?: number
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          blocked?: boolean
          created_at?: string
          cursos_rockethub?: string[] | null
          display_name?: string
          gender?: string | null
          hide_followers?: boolean
          id?: string
          is_premium?: boolean
          is_public?: boolean
          last_activity_date?: string | null
          modulos_interesse?: string[] | null
          notifications_enabled?: boolean
          perfil_sap?: string | null
          status?: string
          streak_count?: number
          tempo_experiencia_sap?: string | null
          trabalha_com_sap?: boolean | null
          updated_at?: string
          user_id?: string
          username?: string | null
          xp?: number
        }
        Relationships: []
      }
      questions: {
        Row: {
          available_from: string | null
          available_until: string | null
          category: string
          correct_option: string
          created_at: string
          difficulty: string
          explanation: string
          id: string
          is_active: boolean
          mission_type: string
          nivel: string
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          question: string
          xp_reward: number
        }
        Insert: {
          available_from?: string | null
          available_until?: string | null
          category?: string
          correct_option: string
          created_at?: string
          difficulty?: string
          explanation?: string
          id?: string
          is_active?: boolean
          mission_type?: string
          nivel?: string
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          question: string
          xp_reward?: number
        }
        Update: {
          available_from?: string | null
          available_until?: string | null
          category?: string
          correct_option?: string
          created_at?: string
          difficulty?: string
          explanation?: string
          id?: string
          is_active?: boolean
          mission_type?: string
          nivel?: string
          option_a?: string
          option_b?: string
          option_c?: string
          option_d?: string
          question?: string
          xp_reward?: number
        }
        Relationships: []
      }
      reserved_usernames: {
        Row: {
          ativo: boolean
          created_at: string
          descricao: string | null
          id: string
          username: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          username: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          username?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          id?: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_items: {
        Row: {
          equipped: boolean
          id: string
          item_id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          equipped?: boolean
          id?: string
          item_id: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          equipped?: boolean
          id?: string
          item_id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      admin_delete_user: {
        Args: { target_user_id: string }
        Returns: undefined
      }
      check_username_available: {
        Args: { p_username: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      post_contains_link: { Args: { _content: string }; Returns: boolean }
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
