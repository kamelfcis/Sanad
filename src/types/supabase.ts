export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          role: 'customer' | 'technician' | 'admin';
          phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: 'customer' | 'technician' | 'admin';
          phone?: string | null;
        };
        Update: {
          full_name?: string | null;
          avatar_url?: string | null;
          role?: 'customer' | 'technician' | 'admin';
          phone?: string | null;
          updated_at?: string;
        };
      };
      service_categories: {
        Row: {
          id: string;
          name_ar: string;
          name_en: string;
          slug: string;
          description: string | null;
          icon: string | null;
          icon_type: 'preset' | 'upload';
          image_url: string | null;
          sort_order: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          name_ar: string;
          name_en: string;
          slug: string;
          description?: string | null;
          icon?: string | null;
          icon_type?: 'preset' | 'upload';
          image_url?: string | null;
          sort_order?: number;
          is_active?: boolean;
        };
        Update: {
          name_ar?: string;
          name_en?: string;
          slug?: string;
          description?: string | null;
          icon?: string | null;
          icon_type?: 'preset' | 'upload';
          image_url?: string | null;
          sort_order?: number;
          is_active?: boolean;
        };
      };
      services: {
        Row: {
          id: string;
          category_id: string;
          name_ar: string;
          name_en: string;
          slug: string;
          description: string | null;
          price: number | null;
          price_type: 'fixed' | 'hourly' | 'estimate';
          is_active: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          category_id: string;
          name_ar: string;
          name_en: string;
          slug: string;
          description?: string | null;
          price?: number | null;
          price_type?: 'fixed' | 'hourly' | 'estimate';
          is_active?: boolean;
          sort_order?: number;
        };
        Update: {
          category_id?: string;
          name_ar?: string;
          name_en?: string;
          slug?: string;
          description?: string | null;
          price?: number | null;
          price_type?: 'fixed' | 'hourly' | 'estimate';
          is_active?: boolean;
          sort_order?: number;
        };
      };
      bookings: {
        Row: {
          id: string;
          customer_id: string;
          service_id: string;
          technician_id: string | null;
          status: 'pending' | 'matched' | 'accepted' | 'in_progress' | 'completed' | 'cancelled' | 'disputed';
          description: string | null;
          location_address: string | null;
          location_lat: number | null;
          location_lng: number | null;
          preferred_time: string | null;
          price_quote: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          customer_id: string;
          service_id: string;
          technician_id?: string | null;
          status?: 'pending' | 'matched' | 'accepted' | 'in_progress' | 'completed' | 'cancelled' | 'disputed';
          description?: string | null;
          location_address?: string | null;
          location_lat?: number | null;
          location_lng?: number | null;
          preferred_time?: string | null;
          price_quote?: number | null;
        };
        Update: {
          technician_id?: string | null;
          status?: 'pending' | 'matched' | 'accepted' | 'in_progress' | 'completed' | 'cancelled' | 'disputed';
          description?: string | null;
          location_address?: string | null;
          location_lat?: number | null;
          location_lng?: number | null;
          preferred_time?: string | null;
          price_quote?: number | null;
          updated_at?: string;
        };
      };
      booking_images: {
        Row: {
          id: string;
          booking_id: string;
          image_url: string;
          image_type: 'customer' | 'technician' | 'review';
          created_at: string;
        };
        Insert: {
          booking_id: string;
          image_url: string;
          image_type?: 'customer' | 'technician' | 'review';
        };
        Update: {
          image_type?: 'customer' | 'technician' | 'review';
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
