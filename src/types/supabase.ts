export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      _migrations: {
        Row: {
          checksum: string;
          executed_at: string | null;
          execution_time_ms: number | null;
          id: number;
          name: string;
          rollback_sql: string | null;
        };
        Insert: {
          checksum: string;
          executed_at?: string | null;
          execution_time_ms?: number | null;
          id?: number;
          name: string;
          rollback_sql?: string | null;
        };
        Update: {
          checksum?: string;
          executed_at?: string | null;
          execution_time_ms?: number | null;
          id?: number;
          name?: string;
          rollback_sql?: string | null;
        };
        Relationships: [];
      };
      admin_actions: {
        Row: {
          action: Database["public"]["Enums"]["moderation_action"];
          admin_user_id: string;
          created_at: string;
          id: string;
          note: string | null;
          reason_code: string | null;
          target_id: string;
          target_type: Database["public"]["Enums"]["moderation_target_type"];
        };
        Insert: {
          action: Database["public"]["Enums"]["moderation_action"];
          admin_user_id: string;
          created_at?: string;
          id?: string;
          note?: string | null;
          reason_code?: string | null;
          target_id: string;
          target_type: Database["public"]["Enums"]["moderation_target_type"];
        };
        Update: {
          action?: Database["public"]["Enums"]["moderation_action"];
          admin_user_id?: string;
          created_at?: string;
          id?: string;
          note?: string | null;
          reason_code?: string | null;
          target_id?: string;
          target_type?: Database["public"]["Enums"]["moderation_target_type"];
        };
        Relationships: [
          {
            foreignKeyName: "admin_actions_admin_user_id_fkey";
            columns: ["admin_user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "admin_actions_admin_user_id_fkey";
            columns: ["admin_user_id"];
            isOneToOne: false;
            referencedRelation: "public_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      analytics_events: {
        Row: {
          created_at: string;
          event_name: string;
          event_properties: Json | null;
          id: string;
          ip_address: unknown;
          listing_id: string | null;
          page_url: string;
          referrer_url: string | null;
          seller_id: string | null;
          session_id: string;
          user_agent: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          event_name: string;
          event_properties?: Json | null;
          id?: string;
          ip_address?: unknown;
          listing_id?: string | null;
          page_url: string;
          referrer_url?: string | null;
          seller_id?: string | null;
          session_id: string;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          event_name?: string;
          event_properties?: Json | null;
          id?: string;
          ip_address?: unknown;
          listing_id?: string | null;
          page_url?: string;
          referrer_url?: string | null;
          seller_id?: string | null;
          session_id?: string;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "analytics_events_listing_id_fkey";
            columns: ["listing_id"];
            isOneToOne: false;
            referencedRelation: "listings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "analytics_events_seller_id_fkey";
            columns: ["seller_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "analytics_events_seller_id_fkey";
            columns: ["seller_id"];
            isOneToOne: false;
            referencedRelation: "public_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      api_rate_limits: {
        Row: {
          count: number;
          key: string;
          reset_at: string;
        };
        Insert: {
          count?: number;
          key: string;
          reset_at: string;
        };
        Update: {
          count?: number;
          key?: string;
          reset_at?: string;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          action: string;
          created_at: string;
          id: string;
          ip_address: string | null;
          metadata: Json | null;
          resource_id: string | null;
          resource_type: string;
          user_agent: string | null;
          user_id: string | null;
        };
        Insert: {
          action: string;
          created_at?: string;
          id?: string;
          ip_address?: string | null;
          metadata?: Json | null;
          resource_id?: string | null;
          resource_type: string;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Update: {
          action?: string;
          created_at?: string;
          id?: string;
          ip_address?: string | null;
          metadata?: Json | null;
          resource_id?: string | null;
          resource_type?: string;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "audit_logs_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "public_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      brands: {
        Row: {
          id: string;
          image_url: string | null;
          is_active: boolean;
          name: string;
          slug: string;
          sort_order: number;
        };
        Insert: {
          id?: string;
          image_url?: string | null;
          is_active?: boolean;
          name: string;
          slug: string;
          sort_order?: number;
        };
        Update: {
          id?: string;
          image_url?: string | null;
          is_active?: boolean;
          name?: string;
          slug?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      canonical_search_cache: {
        Row: {
          last_checked_at: string | null;
          query_hash: string;
          query_string: string;
          results_count: number | null;
        };
        Insert: {
          last_checked_at?: string | null;
          query_hash: string;
          query_string: string;
          results_count?: number | null;
        };
        Update: {
          last_checked_at?: string | null;
          query_hash?: string;
          query_string?: string;
          results_count?: number | null;
        };
        Relationships: [];
      };
      car_trims: {
        Row: {
          created_at: string | null;
          id: string;
          is_active: boolean | null;
          model_id: string;
          name: string;
          slug: string;
          sort_order: number | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          model_id: string;
          name: string;
          slug: string;
          sort_order?: number | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          model_id?: string;
          name?: string;
          slug?: string;
          sort_order?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "car_trims_model_id_fkey";
            columns: ["model_id"];
            isOneToOne: false;
            referencedRelation: "models";
            referencedColumns: ["id"];
          },
        ];
      };
      chats: {
        Row: {
          buyer_archived: boolean | null;
          buyer_id: string;
          created_at: string;
          id: string;
          last_message_at: string | null;
          listing_id: string | null;
          seller_archived: boolean | null;
          seller_id: string;
          status: string;
        };
        Insert: {
          buyer_archived?: boolean | null;
          buyer_id: string;
          created_at?: string;
          id?: string;
          last_message_at?: string | null;
          listing_id?: string | null;
          seller_archived?: boolean | null;
          seller_id: string;
          status?: string;
        };
        Update: {
          buyer_archived?: boolean | null;
          buyer_id?: string;
          created_at?: string;
          id?: string;
          last_message_at?: string | null;
          listing_id?: string | null;
          seller_archived?: boolean | null;
          seller_id?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "chats_buyer_id_fkey";
            columns: ["buyer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chats_buyer_id_fkey";
            columns: ["buyer_id"];
            isOneToOne: false;
            referencedRelation: "public_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chats_listing_id_fkey";
            columns: ["listing_id"];
            isOneToOne: false;
            referencedRelation: "listings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chats_seller_id_fkey";
            columns: ["seller_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chats_seller_id_fkey";
            columns: ["seller_id"];
            isOneToOne: false;
            referencedRelation: "public_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      cities: {
        Row: {
          id: string;
          is_active: boolean;
          name: string;
          plate_code: number;
          slug: string;
        };
        Insert: {
          id?: string;
          is_active?: boolean;
          name: string;
          plate_code: number;
          slug: string;
        };
        Update: {
          id?: string;
          is_active?: boolean;
          name?: string;
          plate_code?: number;
          slug?: string;
        };
        Relationships: [];
      };
      compensating_actions: {
        Row: {
          action_type: string;
          created_at: string | null;
          hard_deadline: string | null;
          id: string;
          is_poison_pill: boolean | null;
          last_error: string | null;
          max_retries: number | null;
          next_attempt_at: string | null;
          payload: Json;
          processed_at: string | null;
          retry_count: number | null;
          status: string;
          transaction_id: string;
        };
        Insert: {
          action_type: string;
          created_at?: string | null;
          hard_deadline?: string | null;
          id?: string;
          is_poison_pill?: boolean | null;
          last_error?: string | null;
          max_retries?: number | null;
          next_attempt_at?: string | null;
          payload: Json;
          processed_at?: string | null;
          retry_count?: number | null;
          status?: string;
          transaction_id: string;
        };
        Update: {
          action_type?: string;
          created_at?: string | null;
          hard_deadline?: string | null;
          id?: string;
          is_poison_pill?: boolean | null;
          last_error?: string | null;
          max_retries?: number | null;
          next_attempt_at?: string | null;
          payload?: Json;
          processed_at?: string | null;
          retry_count?: number | null;
          status?: string;
          transaction_id?: string;
        };
        Relationships: [];
      };
      contact_abuse_log: {
        Row: {
          created_at: string;
          email: string;
          id: string;
          ip_address: string;
          metadata: Json | null;
          reason: string;
          user_agent: string | null;
        };
        Insert: {
          created_at?: string;
          email: string;
          id?: string;
          ip_address: string;
          metadata?: Json | null;
          reason: string;
          user_agent?: string | null;
        };
        Update: {
          created_at?: string;
          email?: string;
          id?: string;
          ip_address?: string;
          metadata?: Json | null;
          reason?: string;
          user_agent?: string | null;
        };
        Relationships: [];
      };
      credit_transactions: {
        Row: {
          amount: number;
          created_at: string;
          description: string | null;
          id: string;
          metadata: Json | null;
          reference_id: string | null;
          transaction_type: string;
          user_id: string;
        };
        Insert: {
          amount: number;
          created_at?: string;
          description?: string | null;
          id?: string;
          metadata?: Json | null;
          reference_id?: string | null;
          transaction_type: string;
          user_id: string;
        };
        Update: {
          amount?: number;
          created_at?: string;
          description?: string | null;
          id?: string;
          metadata?: Json | null;
          reference_id?: string | null;
          transaction_type?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "credit_transactions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "credit_transactions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "public_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      cron_job_logs: {
        Row: {
          details: Json | null;
          error_message: string | null;
          finished_at: string | null;
          id: string;
          job_name: string;
          rows_affected: number | null;
          started_at: string;
          status: string;
        };
        Insert: {
          details?: Json | null;
          error_message?: string | null;
          finished_at?: string | null;
          id?: string;
          job_name: string;
          rows_affected?: number | null;
          started_at?: string;
          status?: string;
        };
        Update: {
          details?: Json | null;
          error_message?: string | null;
          finished_at?: string | null;
          id?: string;
          job_name?: string;
          rows_affected?: number | null;
          started_at?: string;
          status?: string;
        };
        Relationships: [];
      };
      custom_roles: {
        Row: {
          created_at: string;
          created_by: string | null;
          description: string | null;
          id: string;
          is_system: boolean;
          name: string;
          permissions: string[];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          is_system?: boolean;
          name: string;
          permissions?: string[];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          is_system?: boolean;
          name?: string;
          permissions?: string[];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "custom_roles_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "custom_roles_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "public_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      districts: {
        Row: {
          city_id: string;
          id: string;
          is_active: boolean;
          name: string;
          slug: string;
        };
        Insert: {
          city_id: string;
          id?: string;
          is_active?: boolean;
          name: string;
          slug: string;
        };
        Update: {
          city_id?: string;
          id?: string;
          is_active?: boolean;
          name?: string;
          slug?: string;
        };
        Relationships: [
          {
            foreignKeyName: "districts_city_id_fkey";
            columns: ["city_id"];
            isOneToOne: false;
            referencedRelation: "cities";
            referencedColumns: ["id"];
          },
        ];
      };
      doping_applications: {
        Row: {
          created_at: string;
          doping_type: string;
          duration_days: number;
          expires_at: string;
          id: string;
          listing_id: string;
          metadata: Json | null;
          payment_id: string | null;
          started_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          doping_type: string;
          duration_days: number;
          expires_at: string;
          id?: string;
          listing_id: string;
          metadata?: Json | null;
          payment_id?: string | null;
          started_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          doping_type?: string;
          duration_days?: number;
          expires_at?: string;
          id?: string;
          listing_id?: string;
          metadata?: Json | null;
          payment_id?: string | null;
          started_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "doping_applications_listing_id_fkey";
            columns: ["listing_id"];
            isOneToOne: false;
            referencedRelation: "listings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "doping_applications_payment_id_fkey";
            columns: ["payment_id"];
            isOneToOne: false;
            referencedRelation: "payments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "doping_applications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "doping_applications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "public_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      doping_packages: {
        Row: {
          duration_days: number;
          features: Json;
          id: string;
          is_active: boolean;
          name: string;
          price: number;
          slug: string;
          sort_order: number;
          type: string;
        };
        Insert: {
          duration_days: number;
          features?: Json;
          id?: string;
          is_active?: boolean;
          name: string;
          price: number;
          slug: string;
          sort_order?: number;
          type: string;
        };
        Update: {
          duration_days?: number;
          features?: Json;
          id?: string;
          is_active?: boolean;
          name?: string;
          price?: number;
          slug?: string;
          sort_order?: number;
          type?: string;
        };
        Relationships: [];
      };
      doping_purchases: {
        Row: {
          created_at: string;
          expires_at: string | null;
          expiry_warning_sent: boolean | null;
          id: string;
          listing_id: string;
          package_id: string;
          payment_id: string | null;
          starts_at: string;
          status: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          expires_at?: string | null;
          expiry_warning_sent?: boolean | null;
          id?: string;
          listing_id: string;
          package_id: string;
          payment_id?: string | null;
          starts_at?: string;
          status?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          expires_at?: string | null;
          expiry_warning_sent?: boolean | null;
          id?: string;
          listing_id?: string;
          package_id?: string;
          payment_id?: string | null;
          starts_at?: string;
          status?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "doping_purchases_listing_id_fkey";
            columns: ["listing_id"];
            isOneToOne: false;
            referencedRelation: "listings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "doping_purchases_package_id_fkey";
            columns: ["package_id"];
            isOneToOne: false;
            referencedRelation: "doping_packages";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "doping_purchases_payment_id_fkey";
            columns: ["payment_id"];
            isOneToOne: false;
            referencedRelation: "payments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "doping_purchases_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "doping_purchases_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "public_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      favorites: {
        Row: {
          created_at: string;
          listing_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          listing_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          listing_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "favorites_listing_id_fkey";
            columns: ["listing_id"];
            isOneToOne: false;
            referencedRelation: "listings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "favorites_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "favorites_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "public_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      fulfillment_jobs: {
        Row: {
          attempts: number;
          created_at: string;
          error_details: Json | null;
          id: string;
          idempotency_key: string | null;
          job_type: string;
          last_error: string | null;
          max_attempts: number;
          metadata: Json | null;
          payment_id: string | null;
          processed_at: string | null;
          scheduled_at: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          attempts?: number;
          created_at?: string;
          error_details?: Json | null;
          id?: string;
          idempotency_key?: string | null;
          job_type: string;
          last_error?: string | null;
          max_attempts?: number;
          metadata?: Json | null;
          payment_id?: string | null;
          processed_at?: string | null;
          scheduled_at?: string;
          status?: string;
          updated_at?: string;
        };
        Update: {
          attempts?: number;
          created_at?: string;
          error_details?: Json | null;
          id?: string;
          idempotency_key?: string | null;
          job_type?: string;
          last_error?: string | null;
          max_attempts?: number;
          metadata?: Json | null;
          payment_id?: string | null;
          processed_at?: string | null;
          scheduled_at?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fulfillment_jobs_payment_id_fkey";
            columns: ["payment_id"];
            isOneToOne: false;
            referencedRelation: "payments";
            referencedColumns: ["id"];
          },
        ];
      };
      gallery_views: {
        Row: {
          created_at: string;
          id: string;
          seller_id: string;
          viewed_on: string;
          viewer_id: string | null;
          viewer_ip: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          seller_id: string;
          viewed_on?: string;
          viewer_id?: string | null;
          viewer_ip?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          seller_id?: string;
          viewed_on?: string;
          viewer_id?: string | null;
          viewer_ip?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "gallery_views_seller_id_fkey";
            columns: ["seller_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "gallery_views_seller_id_fkey";
            columns: ["seller_id"];
            isOneToOne: false;
            referencedRelation: "public_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "gallery_views_viewer_id_fkey";
            columns: ["viewer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "gallery_views_viewer_id_fkey";
            columns: ["viewer_id"];
            isOneToOne: false;
            referencedRelation: "public_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      ip_banlist: {
        Row: {
          banned_at: string;
          banned_by: string | null;
          expires_at: string | null;
          id: string;
          ip_address: string;
          metadata: Json | null;
          reason: string;
        };
        Insert: {
          banned_at?: string;
          banned_by?: string | null;
          expires_at?: string | null;
          id?: string;
          ip_address: string;
          metadata?: Json | null;
          reason: string;
        };
        Update: {
          banned_at?: string;
          banned_by?: string | null;
          expires_at?: string | null;
          id?: string;
          ip_address?: string;
          metadata?: Json | null;
          reason?: string;
        };
        Relationships: [];
      };
      listing_contact_leads: {
        Row: {
          buyer_id: string | null;
          contact_message: string | null;
          contact_name: string;
          contact_phone: string;
          created_at: string;
          id: string;
          listing_id: string;
          seller_id: string;
          source: string;
        };
        Insert: {
          buyer_id?: string | null;
          contact_message?: string | null;
          contact_name: string;
          contact_phone: string;
          created_at?: string;
          id?: string;
          listing_id: string;
          seller_id: string;
          source?: string;
        };
        Update: {
          buyer_id?: string | null;
          contact_message?: string | null;
          contact_name?: string;
          contact_phone?: string;
          created_at?: string;
          id?: string;
          listing_id?: string;
          seller_id?: string;
          source?: string;
        };
        Relationships: [
          {
            foreignKeyName: "listing_contact_leads_buyer_id_fkey";
            columns: ["buyer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "listing_contact_leads_buyer_id_fkey";
            columns: ["buyer_id"];
            isOneToOne: false;
            referencedRelation: "public_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "listing_contact_leads_listing_id_fkey";
            columns: ["listing_id"];
            isOneToOne: false;
            referencedRelation: "listings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "listing_contact_leads_seller_id_fkey";
            columns: ["seller_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "listing_contact_leads_seller_id_fkey";
            columns: ["seller_id"];
            isOneToOne: false;
            referencedRelation: "public_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      listing_dopings: {
        Row: {
          created_at: string;
          doping_type: string;
          expires_at: string;
          id: string;
          is_active: boolean;
          listing_id: string;
          started_at: string;
        };
        Insert: {
          created_at?: string;
          doping_type: string;
          expires_at: string;
          id?: string;
          is_active?: boolean;
          listing_id: string;
          started_at?: string;
        };
        Update: {
          created_at?: string;
          doping_type?: string;
          expires_at?: string;
          id?: string;
          is_active?: boolean;
          listing_id?: string;
          started_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "listing_dopings_listing_id_fkey";
            columns: ["listing_id"];
            isOneToOne: false;
            referencedRelation: "listings";
            referencedColumns: ["id"];
          },
        ];
      };
      listing_images: {
        Row: {
          created_at: string;
          id: string;
          is_cover: boolean;
          listing_id: string;
          placeholder_blur: string | null;
          public_url: string;
          sort_order: number;
          storage_path: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_cover?: boolean;
          listing_id: string;
          placeholder_blur?: string | null;
          public_url: string;
          sort_order?: number;
          storage_path: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_cover?: boolean;
          listing_id?: string;
          placeholder_blur?: string | null;
          public_url?: string;
          sort_order?: number;
          storage_path?: string;
        };
        Relationships: [
          {
            foreignKeyName: "listing_images_listing_id_fkey";
            columns: ["listing_id"];
            isOneToOne: false;
            referencedRelation: "listings";
            referencedColumns: ["id"];
          },
        ];
      };
      listing_price_history: {
        Row: {
          created_at: string;
          id: string;
          listing_id: string;
          price: number;
        };
        Insert: {
          created_at?: string;
          id?: string;
          listing_id: string;
          price: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          listing_id?: string;
          price?: number;
        };
        Relationships: [
          {
            foreignKeyName: "listing_price_history_listing_id_fkey";
            columns: ["listing_id"];
            isOneToOne: false;
            referencedRelation: "listings";
            referencedColumns: ["id"];
          },
        ];
      };
      listing_questions: {
        Row: {
          answer: string | null;
          created_at: string;
          id: string;
          is_public: boolean;
          listing_id: string;
          question: string;
          status: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          answer?: string | null;
          created_at?: string;
          id?: string;
          is_public?: boolean;
          listing_id: string;
          question: string;
          status?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          answer?: string | null;
          created_at?: string;
          id?: string;
          is_public?: boolean;
          listing_id?: string;
          question?: string;
          status?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "listing_questions_listing_id_fkey";
            columns: ["listing_id"];
            isOneToOne: false;
            referencedRelation: "listings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "listing_questions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "listing_questions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "public_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      listing_views: {
        Row: {
          created_at: string;
          id: string;
          listing_id: string;
          viewed_on: string;
          viewer_id: string | null;
          viewer_ip: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          listing_id: string;
          viewed_on?: string;
          viewer_id?: string | null;
          viewer_ip?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          listing_id?: string;
          viewed_on?: string;
          viewer_id?: string | null;
          viewer_ip?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "listing_views_listing_id_fkey";
            columns: ["listing_id"];
            isOneToOne: false;
            referencedRelation: "listings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "listing_views_viewer_id_fkey";
            columns: ["viewer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "listing_views_viewer_id_fkey";
            columns: ["viewer_id"];
            isOneToOne: false;
            referencedRelation: "public_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      listings: {
        Row: {
          bold_frame_until: string | null;
          brand: string;
          bumped_at: string | null;
          car_trim: string | null;
          category: Database["public"]["Enums"]["vehicle_category"] | null;
          category_showcase_until: string | null;
          city: string;
          contact_count: number | null;
          created_at: string;
          damage_status_json: Json | null;
          deletion_deadline: string | null;
          description: string;
          detailed_search_showcase_until: string | null;
          display_id: number | null;
          district: string;
          expert_inspection: Json | null;
          featured: boolean;
          featured_until: string | null;
          frame_color: string | null;
          fraud_reason: string | null;
          fraud_score: number;
          fuel_type: Database["public"]["Enums"]["fuel_type"];
          gallery_priority: number | null;
          highlighted_until: string | null;
          homepage_showcase_until: string | null;
          id: string;
          is_featured: boolean | null;
          is_urgent: boolean | null;
          last_inspection_date: string | null;
          license_plate: string | null;
          locked_by: string | null;
          locked_until: string | null;
          market_price_index: number | null;
          mileage: number;
          model: string;
          ogis_report_url: string | null;
          price: number;
          published_at: string | null;
          search_vector: unknown;
          seller_id: string;
          slug: string;
          small_photo_until: string | null;
          status: Database["public"]["Enums"]["listing_status"];
          status_updated_at: string | null;
          title: string;
          top_rank_until: string | null;
          tramer_amount: number | null;
          tramer_last_query: string | null;
          tramer_score: number | null;
          transmission: Database["public"]["Enums"]["transmission_type"];
          updated_at: string;
          urgent_until: string | null;
          vehicle_history: Json | null;
          version: number;
          view_count: number;
          vin: string | null;
          whatsapp_phone: string;
          year: number;
        };
        Insert: {
          bold_frame_until?: string | null;
          brand: string;
          bumped_at?: string | null;
          car_trim?: string | null;
          category?: Database["public"]["Enums"]["vehicle_category"] | null;
          category_showcase_until?: string | null;
          city: string;
          contact_count?: number | null;
          created_at?: string;
          damage_status_json?: Json | null;
          deletion_deadline?: string | null;
          description: string;
          detailed_search_showcase_until?: string | null;
          display_id?: number | null;
          district: string;
          expert_inspection?: Json | null;
          featured?: boolean;
          featured_until?: string | null;
          frame_color?: string | null;
          fraud_reason?: string | null;
          fraud_score?: number;
          fuel_type: Database["public"]["Enums"]["fuel_type"];
          gallery_priority?: number | null;
          highlighted_until?: string | null;
          homepage_showcase_until?: string | null;
          id?: string;
          is_featured?: boolean | null;
          is_urgent?: boolean | null;
          last_inspection_date?: string | null;
          license_plate?: string | null;
          locked_by?: string | null;
          locked_until?: string | null;
          market_price_index?: number | null;
          mileage: number;
          model: string;
          ogis_report_url?: string | null;
          price: number;
          published_at?: string | null;
          search_vector?: unknown;
          seller_id: string;
          slug: string;
          small_photo_until?: string | null;
          status?: Database["public"]["Enums"]["listing_status"];
          status_updated_at?: string | null;
          title: string;
          top_rank_until?: string | null;
          tramer_amount?: number | null;
          tramer_last_query?: string | null;
          tramer_score?: number | null;
          transmission: Database["public"]["Enums"]["transmission_type"];
          updated_at?: string;
          urgent_until?: string | null;
          vehicle_history?: Json | null;
          version?: number;
          view_count?: number;
          vin?: string | null;
          whatsapp_phone: string;
          year: number;
        };
        Update: {
          bold_frame_until?: string | null;
          brand?: string;
          bumped_at?: string | null;
          car_trim?: string | null;
          category?: Database["public"]["Enums"]["vehicle_category"] | null;
          category_showcase_until?: string | null;
          city?: string;
          contact_count?: number | null;
          created_at?: string;
          damage_status_json?: Json | null;
          deletion_deadline?: string | null;
          description?: string;
          detailed_search_showcase_until?: string | null;
          display_id?: number | null;
          district?: string;
          expert_inspection?: Json | null;
          featured?: boolean;
          featured_until?: string | null;
          frame_color?: string | null;
          fraud_reason?: string | null;
          fraud_score?: number;
          fuel_type?: Database["public"]["Enums"]["fuel_type"];
          gallery_priority?: number | null;
          highlighted_until?: string | null;
          homepage_showcase_until?: string | null;
          id?: string;
          is_featured?: boolean | null;
          is_urgent?: boolean | null;
          last_inspection_date?: string | null;
          license_plate?: string | null;
          locked_by?: string | null;
          locked_until?: string | null;
          market_price_index?: number | null;
          mileage?: number;
          model?: string;
          ogis_report_url?: string | null;
          price?: number;
          published_at?: string | null;
          search_vector?: unknown;
          seller_id?: string;
          slug?: string;
          small_photo_until?: string | null;
          status?: Database["public"]["Enums"]["listing_status"];
          status_updated_at?: string | null;
          title?: string;
          top_rank_until?: string | null;
          tramer_amount?: number | null;
          tramer_last_query?: string | null;
          tramer_score?: number | null;
          transmission?: Database["public"]["Enums"]["transmission_type"];
          updated_at?: string;
          urgent_until?: string | null;
          vehicle_history?: Json | null;
          version?: number;
          view_count?: number;
          vin?: string | null;
          whatsapp_phone?: string;
          year?: number;
        };
        Relationships: [
          {
            foreignKeyName: "listings_seller_id_fkey";
            columns: ["seller_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "listings_seller_id_fkey";
            columns: ["seller_id"];
            isOneToOne: false;
            referencedRelation: "public_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      market_stats: {
        Row: {
          avg_price: number;
          brand: string;
          calculated_at: string;
          car_trim: string | null;
          id: string;
          listing_count: number;
          max_price: number | null;
          min_price: number | null;
          model: string;
          year: number;
        };
        Insert: {
          avg_price: number;
          brand: string;
          calculated_at?: string;
          car_trim?: string | null;
          id?: string;
          listing_count: number;
          max_price?: number | null;
          min_price?: number | null;
          model: string;
          year: number;
        };
        Update: {
          avg_price?: number;
          brand?: string;
          calculated_at?: string;
          car_trim?: string | null;
          id?: string;
          listing_count?: number;
          max_price?: number | null;
          min_price?: number | null;
          model?: string;
          year?: number;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          chat_id: string;
          content: string;
          created_at: string;
          deleted_at: string | null;
          id: string;
          is_read: boolean;
          message_type: string;
          sender_id: string;
        };
        Insert: {
          chat_id: string;
          content: string;
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          is_read?: boolean;
          message_type?: string;
          sender_id: string;
        };
        Update: {
          chat_id?: string;
          content?: string;
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          is_read?: boolean;
          message_type?: string;
          sender_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "messages_chat_id_fkey";
            columns: ["chat_id"];
            isOneToOne: false;
            referencedRelation: "chats";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messages_sender_id_fkey";
            columns: ["sender_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messages_sender_id_fkey";
            columns: ["sender_id"];
            isOneToOne: false;
            referencedRelation: "public_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      missing_resource_logs: {
        Row: {
          hit_count: number | null;
          id: number;
          last_requested_at: string | null;
          resource_key: string;
          resource_type: string;
        };
        Insert: {
          hit_count?: number | null;
          id?: number;
          last_requested_at?: string | null;
          resource_key: string;
          resource_type: string;
        };
        Update: {
          hit_count?: number | null;
          id?: number;
          last_requested_at?: string | null;
          resource_key?: string;
          resource_type?: string;
        };
        Relationships: [];
      };
      models: {
        Row: {
          brand_id: string;
          id: string;
          is_active: boolean;
          name: string;
          slug: string;
          sort_order: number;
        };
        Insert: {
          brand_id: string;
          id?: string;
          is_active?: boolean;
          name: string;
          slug: string;
          sort_order?: number;
        };
        Update: {
          brand_id?: string;
          id?: string;
          is_active?: boolean;
          name?: string;
          slug?: string;
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: "models_brand_id_fkey";
            columns: ["brand_id"];
            isOneToOne: false;
            referencedRelation: "brands";
            referencedColumns: ["id"];
          },
        ];
      };
      notification_preferences: {
        Row: {
          email_expiry_warning: boolean;
          email_moderation: boolean;
          email_saved_search: boolean;
          notify_favorite: boolean;
          notify_message: boolean;
          notify_moderation: boolean;
          notify_price_drop: boolean;
          notify_saved_search: boolean;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          email_expiry_warning?: boolean;
          email_moderation?: boolean;
          email_saved_search?: boolean;
          notify_favorite?: boolean;
          notify_message?: boolean;
          notify_moderation?: boolean;
          notify_price_drop?: boolean;
          notify_saved_search?: boolean;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          email_expiry_warning?: boolean;
          email_moderation?: boolean;
          email_saved_search?: boolean;
          notify_favorite?: boolean;
          notify_message?: boolean;
          notify_moderation?: boolean;
          notify_price_drop?: boolean;
          notify_saved_search?: boolean;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notification_preferences_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "public_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          created_at: string;
          href: string | null;
          id: string;
          message: string;
          read: boolean;
          title: string;
          type: Database["public"]["Enums"]["notification_type"];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          href?: string | null;
          id?: string;
          message: string;
          read?: boolean;
          title: string;
          type: Database["public"]["Enums"]["notification_type"];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          href?: string | null;
          id?: string;
          message?: string;
          read?: boolean;
          title?: string;
          type?: Database["public"]["Enums"]["notification_type"];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "public_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      offers: {
        Row: {
          buyer_id: string;
          counter_message: string | null;
          counter_price: number | null;
          created_at: string;
          expires_at: string | null;
          id: string;
          listing_id: string;
          message: string | null;
          offered_price: number;
          status: Database["public"]["Enums"]["offer_status"];
          updated_at: string;
        };
        Insert: {
          buyer_id: string;
          counter_message?: string | null;
          counter_price?: number | null;
          created_at?: string;
          expires_at?: string | null;
          id?: string;
          listing_id: string;
          message?: string | null;
          offered_price: number;
          status?: Database["public"]["Enums"]["offer_status"];
          updated_at?: string;
        };
        Update: {
          buyer_id?: string;
          counter_message?: string | null;
          counter_price?: number | null;
          created_at?: string;
          expires_at?: string | null;
          id?: string;
          listing_id?: string;
          message?: string | null;
          offered_price?: number;
          status?: Database["public"]["Enums"]["offer_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "offers_buyer_id_fkey";
            columns: ["buyer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "offers_buyer_id_fkey";
            columns: ["buyer_id"];
            isOneToOne: false;
            referencedRelation: "public_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "offers_listing_id_fkey";
            columns: ["listing_id"];
            isOneToOne: false;
            referencedRelation: "listings";
            referencedColumns: ["id"];
          },
        ];
      };
      payment_webhook_logs: {
        Row: {
          created_at: string;
          error_message: string | null;
          headers: Json;
          id: string;
          ip_address: string | null;
          payload: Json;
          processing_ms: number | null;
          provider: string;
          status: string;
          token: string | null;
        };
        Insert: {
          created_at?: string;
          error_message?: string | null;
          headers: Json;
          id?: string;
          ip_address?: string | null;
          payload: Json;
          processing_ms?: number | null;
          provider?: string;
          status: string;
          token?: string | null;
        };
        Update: {
          created_at?: string;
          error_message?: string | null;
          headers?: Json;
          id?: string;
          ip_address?: string | null;
          payload?: Json;
          processing_ms?: number | null;
          provider?: string;
          status?: string;
          token?: string | null;
        };
        Relationships: [];
      };
      payments: {
        Row: {
          amount: number;
          created_at: string;
          currency: string;
          description: string | null;
          fulfilled_at: string | null;
          id: string;
          idempotency_key: string | null;
          iyzico_payment_id: string | null;
          iyzico_token: string | null;
          listing_id: string | null;
          metadata: Json | null;
          notified_at: string | null;
          package_id: string | null;
          plan_id: string | null;
          plan_name: string | null;
          processed_at: string | null;
          provider: string;
          status: string;
          updated_at: string;
          user_id: string | null;
          webhook_attempts: number | null;
          webhook_processed_at: string | null;
        };
        Insert: {
          amount: number;
          created_at?: string;
          currency?: string;
          description?: string | null;
          fulfilled_at?: string | null;
          id?: string;
          idempotency_key?: string | null;
          iyzico_payment_id?: string | null;
          iyzico_token?: string | null;
          listing_id?: string | null;
          metadata?: Json | null;
          notified_at?: string | null;
          package_id?: string | null;
          plan_id?: string | null;
          plan_name?: string | null;
          processed_at?: string | null;
          provider: string;
          status: string;
          updated_at?: string;
          user_id?: string | null;
          webhook_attempts?: number | null;
          webhook_processed_at?: string | null;
        };
        Update: {
          amount?: number;
          created_at?: string;
          currency?: string;
          description?: string | null;
          fulfilled_at?: string | null;
          id?: string;
          idempotency_key?: string | null;
          iyzico_payment_id?: string | null;
          iyzico_token?: string | null;
          listing_id?: string | null;
          metadata?: Json | null;
          notified_at?: string | null;
          package_id?: string | null;
          plan_id?: string | null;
          plan_name?: string | null;
          processed_at?: string | null;
          provider?: string;
          status?: string;
          updated_at?: string;
          user_id?: string | null;
          webhook_attempts?: number | null;
          webhook_processed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "payments_listing_id_fkey";
            columns: ["listing_id"];
            isOneToOne: false;
            referencedRelation: "listings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payments_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "pricing_plans";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payments_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payments_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "public_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      phone_reveal_logs: {
        Row: {
          id: string;
          listing_id: string;
          revealed_at: string;
          user_id: string | null;
          viewer_ip: string | null;
        };
        Insert: {
          id?: string;
          listing_id: string;
          revealed_at?: string;
          user_id?: string | null;
          viewer_ip?: string | null;
        };
        Update: {
          id?: string;
          listing_id?: string;
          revealed_at?: string;
          user_id?: string | null;
          viewer_ip?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "phone_reveal_logs_listing_id_fkey";
            columns: ["listing_id"];
            isOneToOne: false;
            referencedRelation: "listings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "phone_reveal_logs_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "phone_reveal_logs_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "public_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      phone_verifications: {
        Row: {
          attempts: number;
          code: string;
          created_at: string;
          expires_at: string;
          id: string;
          phone: string;
          updated_at: string;
          user_id: string;
          verified_at: string | null;
        };
        Insert: {
          attempts?: number;
          code: string;
          created_at?: string;
          expires_at: string;
          id?: string;
          phone: string;
          updated_at?: string;
          user_id: string;
          verified_at?: string | null;
        };
        Update: {
          attempts?: number;
          code?: string;
          created_at?: string;
          expires_at?: string;
          id?: string;
          phone?: string;
          updated_at?: string;
          user_id?: string;
          verified_at?: string | null;
        };
        Relationships: [];
      };
      platform_settings: {
        Row: {
          key: string;
          updated_at: string;
          value: Json;
        };
        Insert: {
          key: string;
          updated_at?: string;
          value: Json;
        };
        Update: {
          key?: string;
          updated_at?: string;
          value?: Json;
        };
        Relationships: [];
      };
      pricing_plans: {
        Row: {
          credits: number;
          features: Json | null;
          id: string;
          is_active: boolean;
          listing_quota: number;
          name: string;
          price: number;
        };
        Insert: {
          credits: number;
          features?: Json | null;
          id?: string;
          is_active?: boolean;
          listing_quota?: number;
          name: string;
          price: number;
        };
        Update: {
          credits?: number;
          features?: Json | null;
          id?: string;
          is_active?: boolean;
          listing_quota?: number;
          name?: string;
          price?: number;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          anonymized_at: string | null;
          avatar_url: string | null;
          avg_conversion_rate: number | null;
          balance_credits: number;
          ban_reason: string | null;
          business_address: string | null;
          business_cover_url: string | null;
          business_description: string | null;
          business_employees: number | null;
          business_galery_photos: string[] | null;
          business_hours: Json | null;
          business_logo_url: string | null;
          business_name: string | null;
          business_slug: string | null;
          city: string;
          created_at: string;
          email_verified: boolean;
          full_name: string;
          id: string;
          identity_number: string | null;
          is_banned: boolean;
          is_deleted: boolean;
          is_phone_verified: boolean;
          is_verified: boolean;
          is_wallet_verified: boolean | null;
          last_analytics_update: string | null;
          phone: string;
          phone_verified_at: string | null;
          role: Database["public"]["Enums"]["user_role"];
          storage_usage_bytes: number | null;
          subscription_synced_at: string | null;
          tax_id: string | null;
          tax_office: string | null;
          total_contact_clicks: number | null;
          total_listing_views: number | null;
          total_listings_count: number;
          total_sold_count: number;
          trust_score: number | null;
          updated_at: string;
          user_type: Database["public"]["Enums"]["user_type"];
          verification_requested_at: string | null;
          verification_reviewed_at: string | null;
          verification_reviewed_by: string | null;
          verification_status: Database["public"]["Enums"]["verification_status"];
          verified_business: boolean;
          website_url: string | null;
        };
        Insert: {
          anonymized_at?: string | null;
          avatar_url?: string | null;
          avg_conversion_rate?: number | null;
          balance_credits?: number;
          ban_reason?: string | null;
          business_address?: string | null;
          business_cover_url?: string | null;
          business_description?: string | null;
          business_employees?: number | null;
          business_galery_photos?: string[] | null;
          business_hours?: Json | null;
          business_logo_url?: string | null;
          business_name?: string | null;
          business_slug?: string | null;
          city?: string;
          created_at?: string;
          email_verified?: boolean;
          full_name?: string;
          id: string;
          identity_number?: string | null;
          is_banned?: boolean;
          is_deleted?: boolean;
          is_phone_verified?: boolean;
          is_verified?: boolean;
          is_wallet_verified?: boolean | null;
          last_analytics_update?: string | null;
          phone?: string;
          phone_verified_at?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
          storage_usage_bytes?: number | null;
          subscription_synced_at?: string | null;
          tax_id?: string | null;
          tax_office?: string | null;
          total_contact_clicks?: number | null;
          total_listing_views?: number | null;
          total_listings_count?: number;
          total_sold_count?: number;
          trust_score?: number | null;
          updated_at?: string;
          user_type?: Database["public"]["Enums"]["user_type"];
          verification_requested_at?: string | null;
          verification_reviewed_at?: string | null;
          verification_reviewed_by?: string | null;
          verification_status?: Database["public"]["Enums"]["verification_status"];
          verified_business?: boolean;
          website_url?: string | null;
        };
        Update: {
          anonymized_at?: string | null;
          avatar_url?: string | null;
          avg_conversion_rate?: number | null;
          balance_credits?: number;
          ban_reason?: string | null;
          business_address?: string | null;
          business_cover_url?: string | null;
          business_description?: string | null;
          business_employees?: number | null;
          business_galery_photos?: string[] | null;
          business_hours?: Json | null;
          business_logo_url?: string | null;
          business_name?: string | null;
          business_slug?: string | null;
          city?: string;
          created_at?: string;
          email_verified?: boolean;
          full_name?: string;
          id?: string;
          identity_number?: string | null;
          is_banned?: boolean;
          is_deleted?: boolean;
          is_phone_verified?: boolean;
          is_verified?: boolean;
          is_wallet_verified?: boolean | null;
          last_analytics_update?: string | null;
          phone?: string;
          phone_verified_at?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
          storage_usage_bytes?: number | null;
          subscription_synced_at?: string | null;
          tax_id?: string | null;
          tax_office?: string | null;
          total_contact_clicks?: number | null;
          total_listing_views?: number | null;
          total_listings_count?: number;
          total_sold_count?: number;
          trust_score?: number | null;
          updated_at?: string;
          user_type?: Database["public"]["Enums"]["user_type"];
          verification_requested_at?: string | null;
          verification_reviewed_at?: string | null;
          verification_reviewed_by?: string | null;
          verification_status?: Database["public"]["Enums"]["verification_status"];
          verified_business?: boolean;
          website_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_verification_reviewed_by_fkey";
            columns: ["verification_reviewed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "profiles_verification_reviewed_by_fkey";
            columns: ["verification_reviewed_by"];
            isOneToOne: false;
            referencedRelation: "public_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      push_subscriptions: {
        Row: {
          auth_token: string;
          created_at: string;
          endpoint: string;
          id: string;
          p256dh: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          auth_token: string;
          created_at?: string;
          endpoint: string;
          id?: string;
          p256dh: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          auth_token?: string;
          created_at?: string;
          endpoint?: string;
          id?: string;
          p256dh?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      realized_sales: {
        Row: {
          brand: string;
          category_id: string;
          id: string;
          listing_id: string | null;
          model: string;
          sale_price: number;
          sold_at: string | null;
          year: number;
        };
        Insert: {
          brand: string;
          category_id: string;
          id?: string;
          listing_id?: string | null;
          model: string;
          sale_price: number;
          sold_at?: string | null;
          year: number;
        };
        Update: {
          brand?: string;
          category_id?: string;
          id?: string;
          listing_id?: string | null;
          model?: string;
          sale_price?: number;
          sold_at?: string | null;
          year?: number;
        };
        Relationships: [
          {
            foreignKeyName: "realized_sales_listing_id_fkey";
            columns: ["listing_id"];
            isOneToOne: false;
            referencedRelation: "listings";
            referencedColumns: ["id"];
          },
        ];
      };
      reports: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          listing_id: string;
          reason: Database["public"]["Enums"]["report_reason"];
          reporter_id: string;
          status: Database["public"]["Enums"]["report_status"];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          listing_id: string;
          reason: Database["public"]["Enums"]["report_reason"];
          reporter_id: string;
          status?: Database["public"]["Enums"]["report_status"];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          listing_id?: string;
          reason?: Database["public"]["Enums"]["report_reason"];
          reporter_id?: string;
          status?: Database["public"]["Enums"]["report_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reports_listing_id_fkey";
            columns: ["listing_id"];
            isOneToOne: false;
            referencedRelation: "listings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reports_reporter_id_fkey";
            columns: ["reporter_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reports_reporter_id_fkey";
            columns: ["reporter_id"];
            isOneToOne: false;
            referencedRelation: "public_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      roles: {
        Row: {
          created_at: string | null;
          description: string | null;
          id: string;
          name: string;
          permissions: string[] | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          name: string;
          permissions?: string[] | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          name?: string;
          permissions?: string[] | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      saved_searches: {
        Row: {
          created_at: string;
          filters: Json;
          id: string;
          notifications_enabled: boolean;
          title: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          filters?: Json;
          id?: string;
          notifications_enabled?: boolean;
          title: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          filters?: Json;
          id?: string;
          notifications_enabled?: boolean;
          title?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "saved_searches_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "saved_searches_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "public_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      security_blacklist_patterns: {
        Row: {
          action: string | null;
          created_at: string | null;
          id: string;
          pattern_name: string;
          regex_pattern: string;
        };
        Insert: {
          action?: string | null;
          created_at?: string | null;
          id?: string;
          pattern_name: string;
          regex_pattern: string;
        };
        Update: {
          action?: string | null;
          created_at?: string | null;
          id?: string;
          pattern_name?: string;
          regex_pattern?: string;
        };
        Relationships: [];
      };
      seller_reviews: {
        Row: {
          comment: string | null;
          created_at: string;
          id: string;
          listing_id: string | null;
          rating: number;
          reviewer_id: string;
          seller_id: string;
          updated_at: string;
        };
        Insert: {
          comment?: string | null;
          created_at?: string;
          id?: string;
          listing_id?: string | null;
          rating: number;
          reviewer_id: string;
          seller_id: string;
          updated_at?: string;
        };
        Update: {
          comment?: string | null;
          created_at?: string;
          id?: string;
          listing_id?: string | null;
          rating?: number;
          reviewer_id?: string;
          seller_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "seller_reviews_listing_id_fkey";
            columns: ["listing_id"];
            isOneToOne: false;
            referencedRelation: "listings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "seller_reviews_reviewer_id_fkey";
            columns: ["reviewer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "seller_reviews_reviewer_id_fkey";
            columns: ["reviewer_id"];
            isOneToOne: false;
            referencedRelation: "public_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "seller_reviews_seller_id_fkey";
            columns: ["seller_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "seller_reviews_seller_id_fkey";
            columns: ["seller_id"];
            isOneToOne: false;
            referencedRelation: "public_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      storage_cleanup_queue: {
        Row: {
          attempts: number;
          bucket_name: string;
          created_at: string;
          file_path: string;
          id: string;
          last_error: string | null;
          processed_at: string | null;
          status: string;
        };
        Insert: {
          attempts?: number;
          bucket_name: string;
          created_at?: string;
          file_path: string;
          id?: string;
          last_error?: string | null;
          processed_at?: string | null;
          status?: string;
        };
        Update: {
          attempts?: number;
          bucket_name?: string;
          created_at?: string;
          file_path?: string;
          id?: string;
          last_error?: string | null;
          processed_at?: string | null;
          status?: string;
        };
        Relationships: [];
      };
      storage_objects_registry: {
        Row: {
          bucket_id: string;
          created_at: string;
          file_name: string | null;
          file_size: number | null;
          id: string;
          lifecycle_tier: string | null;
          mime_type: string | null;
          owner_id: string;
          source_entity_id: string | null;
          source_entity_type: string | null;
          storage_path: string;
          tier_moved_at: string | null;
        };
        Insert: {
          bucket_id: string;
          created_at?: string;
          file_name?: string | null;
          file_size?: number | null;
          id?: string;
          lifecycle_tier?: string | null;
          mime_type?: string | null;
          owner_id: string;
          source_entity_id?: string | null;
          source_entity_type?: string | null;
          storage_path: string;
          tier_moved_at?: string | null;
        };
        Update: {
          bucket_id?: string;
          created_at?: string;
          file_name?: string | null;
          file_size?: number | null;
          id?: string;
          lifecycle_tier?: string | null;
          mime_type?: string | null;
          owner_id?: string;
          source_entity_id?: string | null;
          source_entity_type?: string | null;
          storage_path?: string;
          tier_moved_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "storage_objects_registry_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "storage_objects_registry_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "public_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      tickets: {
        Row: {
          admin_response: string | null;
          category: string | null;
          created_at: string | null;
          description: string;
          id: string;
          listing_id: string | null;
          priority: Database["public"]["Enums"]["ticket_priority"] | null;
          resolved_at: string | null;
          status: Database["public"]["Enums"]["ticket_status"] | null;
          subject: string;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          admin_response?: string | null;
          category?: string | null;
          created_at?: string | null;
          description: string;
          id?: string;
          listing_id?: string | null;
          priority?: Database["public"]["Enums"]["ticket_priority"] | null;
          resolved_at?: string | null;
          status?: Database["public"]["Enums"]["ticket_status"] | null;
          subject: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          admin_response?: string | null;
          category?: string | null;
          created_at?: string | null;
          description?: string;
          id?: string;
          listing_id?: string | null;
          priority?: Database["public"]["Enums"]["ticket_priority"] | null;
          resolved_at?: string | null;
          status?: Database["public"]["Enums"]["ticket_status"] | null;
          subject?: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "support_tickets_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "support_tickets_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "public_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tickets_listing_id_fkey";
            columns: ["listing_id"];
            isOneToOne: false;
            referencedRelation: "listings";
            referencedColumns: ["id"];
          },
        ];
      };
      transaction_outbox: {
        Row: {
          created_at: string;
          error_message: string | null;
          event_type: string;
          hard_deadline: string | null;
          id: string;
          idempotency_key: string | null;
          is_poison_pill: boolean | null;
          next_attempt_at: string | null;
          payload: Json;
          processed_at: string | null;
          retry_count: number | null;
          status: string;
        };
        Insert: {
          created_at?: string;
          error_message?: string | null;
          event_type: string;
          hard_deadline?: string | null;
          id?: string;
          idempotency_key?: string | null;
          is_poison_pill?: boolean | null;
          next_attempt_at?: string | null;
          payload: Json;
          processed_at?: string | null;
          retry_count?: number | null;
          status?: string;
        };
        Update: {
          created_at?: string;
          error_message?: string | null;
          event_type?: string;
          hard_deadline?: string | null;
          id?: string;
          idempotency_key?: string | null;
          is_poison_pill?: boolean | null;
          next_attempt_at?: string | null;
          payload?: Json;
          processed_at?: string | null;
          retry_count?: number | null;
          status?: string;
        };
        Relationships: [];
      };
      user_encryption_keys: {
        Row: {
          algorithm: string | null;
          created_at: string | null;
          encryption_key: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          algorithm?: string | null;
          created_at?: string | null;
          encryption_key: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          algorithm?: string | null;
          created_at?: string | null;
          encryption_key?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      user_quotas: {
        Row: {
          listing_credits: number | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          listing_credits?: number | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          listing_credits?: number | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      user_read_writes_tracker: {
        Row: {
          last_write_at: string | null;
          user_id: string;
        };
        Insert: {
          last_write_at?: string | null;
          user_id: string;
        };
        Update: {
          last_write_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      vehicle_history: {
        Row: {
          accident_count: number | null;
          id: string;
          last_km: number | null;
          listing_id: string | null;
          ownership_count: number | null;
          queried_at: string;
          query_result: Json;
          tramer_details: Json | null;
          vin: string;
        };
        Insert: {
          accident_count?: number | null;
          id?: string;
          last_km?: number | null;
          listing_id?: string | null;
          ownership_count?: number | null;
          queried_at?: string;
          query_result: Json;
          tramer_details?: Json | null;
          vin: string;
        };
        Update: {
          accident_count?: number | null;
          id?: string;
          last_km?: number | null;
          listing_id?: string | null;
          ownership_count?: number | null;
          queried_at?: string;
          query_result?: Json;
          tramer_details?: Json | null;
          vin?: string;
        };
        Relationships: [
          {
            foreignKeyName: "vehicle_history_listing_id_fkey";
            columns: ["listing_id"];
            isOneToOne: false;
            referencedRelation: "listings";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      public_profiles: {
        Row: {
          avatar_url: string | null;
          ban_reason: string | null;
          business_logo_url: string | null;
          business_name: string | null;
          business_slug: string | null;
          city: string | null;
          created_at: string | null;
          full_name: string | null;
          id: string | null;
          is_banned: boolean | null;
          is_verified: boolean | null;
          role: Database["public"]["Enums"]["user_role"] | null;
          trust_score: number | null;
          updated_at: string | null;
          user_type: Database["public"]["Enums"]["user_type"] | null;
          verification_status: Database["public"]["Enums"]["verification_status"] | null;
          verified_business: boolean | null;
        };
        Insert: {
          avatar_url?: string | null;
          ban_reason?: string | null;
          business_logo_url?: string | null;
          business_name?: string | null;
          business_slug?: string | null;
          city?: string | null;
          created_at?: string | null;
          full_name?: string | null;
          id?: string | null;
          is_banned?: boolean | null;
          is_verified?: boolean | null;
          role?: Database["public"]["Enums"]["user_role"] | null;
          trust_score?: number | null;
          updated_at?: string | null;
          user_type?: Database["public"]["Enums"]["user_type"] | null;
          verification_status?: Database["public"]["Enums"]["verification_status"] | null;
          verified_business?: boolean | null;
        };
        Update: {
          avatar_url?: string | null;
          ban_reason?: string | null;
          business_logo_url?: string | null;
          business_name?: string | null;
          business_slug?: string | null;
          city?: string | null;
          created_at?: string | null;
          full_name?: string | null;
          id?: string | null;
          is_banned?: boolean | null;
          is_verified?: boolean | null;
          role?: Database["public"]["Enums"]["user_role"] | null;
          trust_score?: number | null;
          updated_at?: string | null;
          user_type?: Database["public"]["Enums"]["user_type"] | null;
          verification_status?: Database["public"]["Enums"]["verification_status"] | null;
          verified_business?: boolean | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      activate_doping: {
        Args: {
          p_listing_id: string;
          p_package_id: string;
          p_payment_id: string;
          p_user_id: string;
        };
        Returns: Json;
      };
      activate_free_pricing_plan: {
        Args: {
          p_credits: number;
          p_plan_id: string;
          p_plan_name: string;
          p_user_id: string;
        };
        Returns: Json;
      };
      adjust_user_credits_atomic:
        | {
            Args: {
              p_amount: number;
              p_description?: string;
              p_metadata?: Json;
              p_reference_id?: string;
              p_type: string;
              p_user_id: string;
            };
            Returns: Json;
          }
        | {
            Args: {
              p_amount: number;
              p_description?: string;
              p_metadata?: Json;
              p_reference_id?: string;
              p_type: string;
              p_user_id: string;
            };
            Returns: Json;
          };
      admin_update_ticket: {
        Args: {
          p_admin_response?: string;
          p_status: string;
          p_ticket_id: string;
        };
        Returns: Json;
      };
      aggregate_listing_metrics: {
        Args: { p_listing_id: string };
        Returns: undefined;
      };
      aggregate_seller_metrics: {
        Args: { p_seller_id: string };
        Returns: undefined;
      };
      apply_listing_doping: {
        Args: {
          p_doping_types: string[];
          p_duration_days?: number;
          p_listing_id: string;
          p_payment_id?: string;
          p_user_id: string;
        };
        Returns: Json;
      };
      atomic_moderate_listing:
        | {
            Args: {
              p_admin_id: string;
              p_listing_id: string;
              p_note: string;
              p_notification_payload: Json;
              p_outbox_payload: Json;
              p_status: string;
            };
            Returns: Json;
          }
        | {
            Args: {
              p_admin_id: string;
              p_listing_id: string;
              p_note: string;
              p_notification_payload?: Json;
              p_outbox_payload?: Json;
              p_reason_code?: string;
              p_status: string;
            };
            Returns: Json;
          };
      ban_user_atomic: {
        Args: {
          p_preserve_metadata?: boolean;
          p_reason: string;
          p_user_id: string;
        };
        Returns: Json;
      };
      check_and_reserve_listing_quota: {
        Args: { p_user_id: string };
        Returns: boolean;
      };
      check_api_rate_limit: {
        Args: { p_key: string; p_limit: number; p_window_ms: number };
        Returns: Json;
      };
      check_contact_abuse: {
        Args: { p_email: string; p_ip: string };
        Returns: Json;
      };
      check_listing_quota_atomic: {
        Args: {
          p_monthly_limit?: number;
          p_user_id: string;
          p_yearly_limit?: number;
        };
        Returns: Json;
      };
      cleanup_expired_rate_limits: { Args: never; Returns: undefined };
      confirm_payment_success: {
        Args: {
          p_iyzico_payment_id: string;
          p_iyzico_token: string;
          p_user_id: string;
        };
        Returns: Json;
      };
      create_chat_atomic: {
        Args: {
          p_buyer_id: string;
          p_listing_id: string;
          p_seller_id: string;
          p_system_message?: string;
        };
        Returns: string;
      };
      create_fulfillment_job: {
        Args: { p_job_type: string; p_metadata?: Json; p_payment_id: string };
        Returns: string;
      };
      create_listing_contact_lead: {
        Args: {
          p_contact_message: string;
          p_contact_name: string;
          p_contact_phone: string;
          p_listing_id: string;
          p_source?: string;
        };
        Returns: string;
      };
      create_listing_with_images: {
        Args: { p_images_to_upsert: Json[]; p_listing_data: Json };
        Returns: Json;
      };
      create_public_ticket: {
        Args: {
          p_category: string;
          p_description: string;
          p_listing_id?: string;
          p_priority?: string;
          p_subject: string;
        };
        Returns: Json;
      };
      create_user_ticket: {
        Args: {
          p_category: string;
          p_description: string;
          p_listing_id?: string;
          p_priority?: string;
          p_subject: string;
        };
        Returns: Json;
      };
      expire_dopings_atomic: { Args: never; Returns: Json };
      get_active_brand_city_combinations: {
        Args: never;
        Returns: {
          brand_slug: string;
          city_slug: string;
        }[];
      };
      get_active_dopings_for_listing: {
        Args: { p_listing_id: string };
        Returns: {
          doping_type: string;
          expires_at: string;
          package_name: string;
        }[];
      };
      get_daily_listing_trend: {
        Args: { p_days: number };
        Returns: {
          count: number;
          day: string;
        }[];
      };
      get_dead_letter_jobs: {
        Args: { p_limit?: number };
        Returns: {
          attempts: number;
          created_at: string;
          error_details: Json;
          id: string;
          job_type: string;
          last_error: string;
          payment_data: Json;
          payment_id: string;
          updated_at: string;
        }[];
      };
      get_listings_by_brand_count: {
        Args: { p_status?: string };
        Returns: {
          brand: string;
          count: number;
        }[];
      };
      get_listings_by_city_count: {
        Args: { p_status?: string };
        Returns: {
          city: string;
          count: number;
        }[];
      };
      get_listings_by_status_count: {
        Args: never;
        Returns: {
          count: number;
          status: string;
        }[];
      };
      get_ready_fulfillment_jobs: {
        Args: { p_limit?: number };
        Returns: {
          attempts: number;
          id: string;
          job_type: string;
          max_attempts: number;
          metadata: Json;
          payment_data: Json;
          payment_id: string;
        }[];
      };
      get_revenue_stats: {
        Args: { p_end_date: string; p_start_date: string };
        Returns: {
          total_amount: number;
        }[];
      };
      get_seller_daily_activity: {
        Args: { p_days?: number; p_seller_id: string };
        Returns: {
          activity_date: string;
          contacts: number;
          views: number;
        }[];
      };
      get_user_listing_stats: {
        Args: {
          p_start_of_month: string;
          p_start_of_year: string;
          p_user_id: string;
        };
        Returns: Json;
      };
      increment_compensating_retry: {
        Args: { p_error: string; p_id: string };
        Returns: undefined;
      };
      increment_listing_view: {
        Args: {
          target_listing_id: string;
          target_viewer_id?: string;
          target_viewer_ip?: string;
        };
        Returns: undefined;
      };
      increment_listing_view_buffered: {
        Args: { p_listing_id: string };
        Returns: undefined;
      };
      increment_outbox_retry: {
        Args: { p_error: string; p_id: string };
        Returns: undefined;
      };
      increment_user_credits: {
        Args: { p_credits: number; p_user_id: string };
        Returns: number;
      };
      increment_webhook_attempts: {
        Args: { p_token: string };
        Returns: undefined;
      };
      is_admin: { Args: never; Returns: boolean };
      is_user_banned: { Args: { p_user_id: string }; Returns: boolean };
      is_valid_damage_status_json: { Args: { data: Json }; Returns: boolean };
      log_contact_abuse: {
        Args: {
          p_email: string;
          p_ip: string;
          p_metadata?: Json;
          p_reason: string;
          p_user_agent?: string;
        };
        Returns: string;
      };
      mark_job_failed: {
        Args: {
          p_error_details?: Json;
          p_error_message: string;
          p_job_id: string;
        };
        Returns: Json;
      };
      mark_job_processing: { Args: { p_job_id: string }; Returns: boolean };
      mark_job_success: { Args: { p_job_id: string }; Returns: boolean };
      mark_jobs_processing: { Args: { p_job_ids: string[] }; Returns: boolean };
      pg_advisory_xact_lock: { Args: { key: number }; Returns: undefined };
      process_compensating_actions_events: {
        Args: { batch_size: number };
        Returns: {
          action_type: string;
          id: string;
          payload: Json;
        }[];
      };
      process_outbox_events: {
        Args: { batch_size: number };
        Returns: {
          event_type: string;
          id: string;
          payload: Json;
        }[];
      };
      process_payment_success: {
        Args: { p_iyzico_payment_id?: string; p_payment_id: string };
        Returns: Json;
      };
      process_payment_webhook: {
        Args: { p_iyzico_payment_id: string; p_status: string; p_token: string };
        Returns: Json;
      };
      recalibrate_all_market_stats: { Args: never; Returns: undefined };
      retry_dead_letter_job: { Args: { p_job_id: string }; Returns: boolean };
      run_expire_old_listings: { Args: never; Returns: undefined };
      soft_delete_message: {
        Args: { p_message_id: string; p_user_id: string };
        Returns: boolean;
      };
      soft_delete_profile: { Args: { p_user_id: string }; Returns: undefined };
      sync_listing_views_buffer: { Args: never; Returns: number };
      toggle_chat_archive: {
        Args: { p_archive: boolean; p_chat_id: string; p_user_id: string };
        Returns: undefined;
      };
      update_listing_price_indices: {
        Args: {
          p_avg_price: number;
          p_brand: string;
          p_model: string;
          p_year: number;
        };
        Returns: undefined;
      };
      upsert_listing_with_images: {
        Args: {
          p_images_to_delete: string[];
          p_images_to_upsert: Json[];
          p_listing_data: Json;
        };
        Returns: Json;
      };
      upsert_market_stats: {
        Args: {
          p_avg_price: number;
          p_brand: string;
          p_listing_count: number;
          p_model: string;
          p_year: number;
        };
        Returns: undefined;
      };
    };
    Enums: {
      fuel_type: "benzin" | "dizel" | "lpg" | "hibrit" | "elektrik";
      listing_status:
        | "draft"
        | "pending"
        | "approved"
        | "rejected"
        | "archived"
        | "pending_ai_review"
        | "flagged";
      moderation_action:
        | "approve"
        | "reject"
        | "review"
        | "resolve"
        | "dismiss"
        | "archive"
        | "edit"
        | "ban"
        | "unban"
        | "promote"
        | "demote"
        | "delete_user"
        | "credit_grant"
        | "doping_grant";
      moderation_target_type: "listing" | "report" | "user";
      notification_type: "favorite" | "moderation" | "report" | "system" | "question";
      offer_status: "pending" | "accepted" | "rejected" | "counter_offer" | "expired" | "completed";
      report_reason:
        | "fake_listing"
        | "wrong_info"
        | "spam"
        | "other"
        | "price_manipulation"
        | "invalid_verification";
      report_status: "open" | "reviewing" | "resolved" | "dismissed";
      ticket_priority: "low" | "medium" | "high" | "urgent";
      ticket_status: "open" | "in_progress" | "resolved" | "closed";
      transmission_type: "manuel" | "otomatik" | "yari_otomatik";
      user_role: "user" | "admin";
      user_type: "individual" | "professional" | "staff" | "corporate";
      vehicle_category:
        | "otomobil"
        | "suv"
        | "minivan"
        | "ticari"
        | "motosiklet"
        | "kiralik"
        | "hasarli"
        | "klasik"
        | "karavan"
        | "deniz"
        | "hava"
        | "atv";
      verification_status: "none" | "pending" | "approved" | "rejected";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      fuel_type: ["benzin", "dizel", "lpg", "hibrit", "elektrik"],
      listing_status: [
        "draft",
        "pending",
        "approved",
        "rejected",
        "archived",
        "pending_ai_review",
        "flagged",
      ],
      moderation_action: [
        "approve",
        "reject",
        "review",
        "resolve",
        "dismiss",
        "archive",
        "edit",
        "ban",
        "unban",
        "promote",
        "demote",
        "delete_user",
        "credit_grant",
        "doping_grant",
      ],
      moderation_target_type: ["listing", "report", "user"],
      notification_type: ["favorite", "moderation", "report", "system", "question"],
      offer_status: ["pending", "accepted", "rejected", "counter_offer", "expired", "completed"],
      report_reason: [
        "fake_listing",
        "wrong_info",
        "spam",
        "other",
        "price_manipulation",
        "invalid_verification",
      ],
      report_status: ["open", "reviewing", "resolved", "dismissed"],
      ticket_priority: ["low", "medium", "high", "urgent"],
      ticket_status: ["open", "in_progress", "resolved", "closed"],
      transmission_type: ["manuel", "otomatik", "yari_otomatik"],
      user_role: ["user", "admin"],
      user_type: ["individual", "professional", "staff", "corporate"],
      vehicle_category: [
        "otomobil",
        "suv",
        "minivan",
        "ticari",
        "motosiklet",
        "kiralik",
        "hasarli",
        "klasik",
        "karavan",
        "deniz",
        "hava",
        "atv",
      ],
      verification_status: ["none", "pending", "approved", "rejected"],
    },
  },
} as const;
