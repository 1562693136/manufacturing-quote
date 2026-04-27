import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: string
          created_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: string
          created_at?: string
        }
      }
      quotations: {
        Row: {
          id: string
          user_id: string
          quote_no: string
          product_code: string
          product_name: string
          customer: string | null
          volume: number
          unit_cost: number
          quote_price: number
          margin_rate: number
          data_snapshot: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          quote_no: string
          product_code: string
          product_name: string
          customer?: string | null
          volume: number
          unit_cost: number
          quote_price: number
          margin_rate: number
          data_snapshot?: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          quote_no?: string
          product_code?: string
          product_name?: string
          customer?: string | null
          volume?: number
          unit_cost?: number
          quote_price?: number
          margin_rate?: number
          data_snapshot?: Json
          created_at?: string
        }
      }
      bom_items: {
        Row: {
          id: string
          user_id: string
          code: string
          name: string
          spec: string | null
          type: 'semi' | 'raw'
          source_type: 'purchase' | 'selfmade'
          unit_price: number
          process_fee: number | null
          loss_rate: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          code: string
          name: string
          spec?: string | null
          type: 'semi' | 'raw'
          source_type: 'purchase' | 'selfmade'
          unit_price: number
          process_fee?: number | null
          loss_rate?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          code?: string
          name?: string
          spec?: string | null
          type?: 'semi' | 'raw'
          source_type?: 'purchase' | 'selfmade'
          unit_price?: number
          process_fee?: number | null
          loss_rate?: number
          created_at?: string
        }
      }
      bom_relations: {
        Row: {
          id: string
          user_id: string
          parent_code: string
          child_code: string
          qty: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          parent_code: string
          child_code: string
          qty: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          parent_code?: string
          child_code?: string
          qty?: number
          created_at?: string
        }
      }
      roles: {
        Row: {
          id: string
          name: string
          perm_quote_create: boolean
          perm_quote_edit: boolean
          perm_bom: boolean
          perm_settings: boolean
          perm_sop: boolean
          perm_user_manage: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          perm_quote_create?: boolean
          perm_quote_edit?: boolean
          perm_bom?: boolean
          perm_settings?: boolean
          perm_sop?: boolean
          perm_user_manage?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          perm_quote_create?: boolean
          perm_quote_edit?: boolean
          perm_bom?: boolean
          perm_settings?: boolean
          perm_sop?: boolean
          perm_user_manage?: boolean
          created_at?: string
        }
      }
    }
  }
}
