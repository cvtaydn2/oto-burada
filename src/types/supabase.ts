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
          executed_at: string | null;
          id: number;
          name: string;
        };
        Insert: {
          executed_at?: string | null;
          id?: number;
          name: string;
        };
        Update: {
          executed_at?: string | null;
          id?: number;
          name?: string;
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
          target_id: string;
          target_type: Database["public"]["Enums"]["moderation_target_type"];
        };
        Insert: {
          action: Database["public"]["Enums"]["moderation_action"];
          admin_user_id: string;
          created_at?: string;
          id?: string;
          note?: string | null;
          target_id: string;
          target_type: Database["public"]["Enums"]["moderation_target_type"];
        };
        Update: {
          action?: Database["public"]["Enums"]["moderation_action"];
          admin_user_id?: string;
          created_at?: string;
          id?: string;
          note?: string | null;
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
      brands: {
        Row: {
          id: string;
          is_active: boolean;
          name: string;
          slug: string;
          sort_order: number;
        };
        Insert: {
          id?: string;
          is_active?: boolean;
          name: string;
          slug: string;
          sort_order?: number;
        };
        Update: {
          id?: string;
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
          buyer_id: string;
          created_at: string;
          id: string;
          last_message_at: string | null;
          listing_id: string;
          seller_id: string;
        };
        Insert: {
          buyer_id: string;
          created_at?: string;
          id?: string;
          last_message_at?: string | null;
          listing_id: string;
          seller_id: string;
        };
        Update: {
          buyer_id?: string;
          created_at?: string;
          id?: string;
          last_message_at?: string | null;
          listing_id?: string;
          seller_id?: string;
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
        ];
      };
      fulfillment_jobs: {
        Row: {
          attempts: number;
          created_at: string;
          error_details: Json | null;
          id: string;
          job_type: string;
          last_error: string | null;
          max_attempts: number;
          metadata: Json | null;
          payment_id: string;
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
          job_type: string;
          last_error?: string | null;
          max_attempts?: number;
          metadata?: Json | null;
          payment_id: string;
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
          job_type?: string;
          last_error?: string | null;
          max_attempts?: number;
          metadata?: Json | null;
          payment_id?: string;
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
            foreignKeyName: "gallery_views_viewer_id_fkey";
            columns: ["viewer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
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
        ];
      };
      listings: {
        Row: {
          brand: string;
          bumped_at: string | null;
          car_trim: string | null;
          category: string;
          category_showcase_until: string | null;
          city: string;
          created_at: string;
          damage_status_json: Json | null;
          deletion_deadline: string | null;
          description: string;
          display_id: number | null;
          district: string;
          expert_inspection: Json | null;
          featured: boolean;
          featured_until: string | null;
          fraud_reason: string | null;
          fraud_score: number;
          fuel_type: Database["public"]["Enums"]["fuel_type"];
          highlighted_until: string | null;
          homepage_showcase_until: string | null;
          id: string;
          is_featured: boolean | null;
          is_urgent: boolean | null;
          frame_color: string | null;
          license_plate: string | null;
          locked_by: string | null;
          locked_until: string | null;
          market_price_index: number | null;
          mileage: number;
          model: string;
          price: number;
          published_at: string | null;
          search_vector: unknown;
          seller_id: string;
          slug: string;
          status: Database["public"]["Enums"]["listing_status"];
          status_updated_at: string | null;
          title: string;
          small_photo_until: string | null;
          top_rank_until: string | null;
          detailed_search_showcase_until: string | null;
          tramer_amount: number | null;
          transmission: Database["public"]["Enums"]["transmission_type"];
          updated_at: string;
          urgent_until: string | null;
          version: number;
          view_count: number;
          vin: string | null;
          whatsapp_phone: string;
          year: number;
        };
        Insert: {
          brand: string;
          bumped_at?: string | null;
          car_trim?: string | null;
          category?: string;
          category_showcase_until?: string | null;
          city: string;
          created_at?: string;
          damage_status_json?: Json | null;
          deletion_deadline?: string | null;
          description: string;
          display_id?: number | null;
          district: string;
          expert_inspection?: Json | null;
          featured?: boolean;
          featured_until?: string | null;
          fraud_reason?: string | null;
          fraud_score?: number;
          fuel_type: Database["public"]["Enums"]["fuel_type"];
          highlighted_until?: string | null;
          homepage_showcase_until?: string | null;
          id?: string;
          is_featured?: boolean | null;
          is_urgent?: boolean | null;
          frame_color?: string | null;
          license_plate?: string | null;
          locked_by?: string | null;
          locked_until?: string | null;
          market_price_index?: number | null;
          mileage: number;
          model: string;
          price: number;
          published_at?: string | null;
          search_vector?: unknown;
          seller_id: string;
          slug: string;
          status?: Database["public"]["Enums"]["listing_status"];
          status_updated_at?: string | null;
          title: string;
          small_photo_until?: string | null;
          top_rank_until?: string | null;
          detailed_search_showcase_until?: string | null;
          tramer_amount?: number | null;
          transmission: Database["public"]["Enums"]["transmission_type"];
          updated_at?: string;
          urgent_until?: string | null;
          version?: number;
          view_count?: number;
          vin?: string | null;
          whatsapp_phone: string;
          year: number;
        };
        Update: {
          brand?: string;
          bumped_at?: string | null;
          car_trim?: string | null;
          category?: string;
          category_showcase_until?: string | null;
          city?: string;
          created_at?: string;
          damage_status_json?: Json | null;
          deletion_deadline?: string | null;
          description?: string;
          display_id?: number | null;
          district?: string;
          expert_inspection?: Json | null;
          featured?: boolean;
          featured_until?: string | null;
          fraud_reason?: string | null;
          fraud_score?: number;
          fuel_type?: Database["public"]["Enums"]["fuel_type"];
          highlighted_until?: string | null;
          homepage_showcase_until?: string | null;
          id?: string;
          is_featured?: boolean | null;
          is_urgent?: boolean | null;
          frame_color?: string | null;
          license_plate?: string | null;
          locked_by?: string | null;
          locked_until?: string | null;
          market_price_index?: number | null;
          mileage?: number;
          model?: string;
          price?: number;
          published_at?: string | null;
          search_vector?: unknown;
          seller_id?: string;
          slug?: string;
          status?: Database["public"]["Enums"]["listing_status"];
          status_updated_at?: string | null;
          title?: string;
          small_photo_until?: string | null;
          top_rank_until?: string | null;
          detailed_search_showcase_until?: string | null;
          tramer_amount?: number | null;
          transmission?: Database["public"]["Enums"]["transmission_type"];
          updated_at?: string;
          urgent_until?: string | null;
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
          id: string;
          is_read: boolean;
          sender_id: string;
        };
        Insert: {
          chat_id: string;
          content: string;
          created_at?: string;
          id?: string;
          is_read?: boolean;
          sender_id: string;
        };
        Update: {
          chat_id?: string;
          content?: string;
          created_at?: string;
          id?: string;
          is_read?: boolean;
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
        ];
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
          name: string;
          price: number;
        };
        Insert: {
          credits: number;
          features?: Json | null;
          id?: string;
          is_active?: boolean;
          name: string;
          price: number;
        };
        Update: {
          credits?: number;
          features?: Json | null;
          id?: string;
          is_active?: boolean;
          name?: string;
          price?: number;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          balance_credits: number;
          ban_reason: string | null;
          business_address: string | null;
          business_description: string | null;
          business_logo_url: string | null;
          business_name: string | null;
          business_slug: string | null;
          city: string;
          created_at: string;
          full_name: string;
          id: string;
          identity_number: string | null;
          is_banned: boolean;
          is_verified: boolean;
          is_wallet_verified: boolean | null;
          phone: string;
          role: Database["public"]["Enums"]["user_role"];
          storage_usage_bytes: number | null;
          subscription_synced_at: string | null;
          tax_id: string | null;
          tax_office: string | null;
          trust_score: number | null;
          updated_at: string;
          user_type: Database["public"]["Enums"]["user_type"];
          verification_status: Database["public"]["Enums"]["verification_status"];
          verified_business: boolean;
          website_url: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          balance_credits?: number;
          ban_reason?: string | null;
          business_address?: string | null;
          business_description?: string | null;
          business_logo_url?: string | null;
          business_name?: string | null;
          business_slug?: string | null;
          city?: string;
          created_at?: string;
          full_name?: string;
          id: string;
          identity_number?: string | null;
          is_banned?: boolean;
          is_verified?: boolean;
          is_wallet_verified?: boolean | null;
          phone?: string;
          role?: Database["public"]["Enums"]["user_role"];
          storage_usage_bytes?: number | null;
          subscription_synced_at?: string | null;
          tax_id?: string | null;
          tax_office?: string | null;
          trust_score?: number | null;
          updated_at?: string;
          user_type?: Database["public"]["Enums"]["user_type"];
          verification_status?: Database["public"]["Enums"]["verification_status"];
          verified_business?: boolean;
          website_url?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          balance_credits?: number;
          ban_reason?: string | null;
          business_address?: string | null;
          business_description?: string | null;
          business_logo_url?: string | null;
          business_name?: string | null;
          business_slug?: string | null;
          city?: string;
          created_at?: string;
          full_name?: string;
          id?: string;
          identity_number?: string | null;
          is_banned?: boolean;
          is_verified?: boolean;
          is_wallet_verified?: boolean | null;
          phone?: string;
          role?: Database["public"]["Enums"]["user_role"];
          storage_usage_bytes?: number | null;
          subscription_synced_at?: string | null;
          tax_id?: string | null;
          tax_office?: string | null;
          trust_score?: number | null;
          updated_at?: string;
          user_type?: Database["public"]["Enums"]["user_type"];
          verification_status?: Database["public"]["Enums"]["verification_status"];
          verified_business?: boolean;
          website_url?: string | null;
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
            foreignKeyName: "seller_reviews_seller_id_fkey";
            columns: ["seller_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
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
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
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
      activate_doping: {
        Args: {
          p_listing_id: string;
          p_package_id: string;
          p_payment_id: string;
          p_user_id: string;
        };
        Returns: Json;
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
      create_fulfillment_job: {
        Args: { p_job_type: string; p_metadata?: Json; p_payment_id: string };
        Returns: string;
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
      get_active_brand_city_combinations: {
        Args: never;
        Returns: {
          brand_slug: string;
          city_slug: string;
        }[];
      };
      get_active_dopings_for_listing: {
        Args: { p_listing_id: string };
        Returns: Json;
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
      increment_listing_view: {
        Args: {
          target_listing_id: string;
          target_viewer_id?: string;
          target_viewer_ip?: string;
        };
        Returns: undefined;
      };
      increment_webhook_attempts: {
        Args: { p_token: string };
        Returns: undefined;
      };
      increment_user_credits: {
        Args: { p_credits: number; p_user_id: string };
        Returns: number;
      };
      is_admin: { Args: never; Returns: boolean };
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
      process_payment_success: {
        Args: { p_iyzico_payment_id?: string; p_payment_id: string };
        Returns: Json;
      };
      process_payment_webhook: {
        Args: {
          p_iyzico_payment_id?: string;
          p_iyzico_token: string;
          p_status: string;
        };
        Returns: Json;
      };
      recalibrate_all_market_stats: { Args: never; Returns: undefined };
      retry_dead_letter_job: { Args: { p_job_id: string }; Returns: boolean };
      run_expire_old_listings: { Args: never; Returns: undefined };
      update_listing_price_indices: {
        Args: {
          p_avg_price: number;
          p_brand: string;
          p_model: string;
          p_year: number;
        };
        Returns: undefined;
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
      listing_status: "draft" | "pending" | "approved" | "rejected" | "archived";
      moderation_action:
        | "approve"
        | "reject"
        | "review"
        | "resolve"
        | "dismiss"
        | "archive"
        | "edit";
      moderation_target_type: "listing" | "report" | "user";
      notification_type: "favorite" | "moderation" | "report" | "system";
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
      user_type: "individual" | "professional" | "staff";
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
      listing_status: ["draft", "pending", "approved", "rejected", "archived"],
      moderation_action: ["approve", "reject", "review", "resolve", "dismiss", "archive", "edit"],
      moderation_target_type: ["listing", "report", "user"],
      notification_type: ["favorite", "moderation", "report", "system"],
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
      user_type: ["individual", "professional", "staff"],
      verification_status: ["none", "pending", "approved", "rejected"],
    },
  },
} as const;
