export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      equipment: {
        Row: {
          average_price: number | null
          brand: string
          category: Database["public"]["Enums"]["equipment_category"]
          created_at: string | null
          id: string
          image_url: string | null
          min_stock: number | null
          model: string
          name: string
          supplier_id: string | null
          updated_at: string | null
        }
        Insert: {
          average_price?: number | null
          brand: string
          category: Database["public"]["Enums"]["equipment_category"]
          created_at?: string | null
          id?: string
          image_url?: string | null
          min_stock?: number | null
          model: string
          name: string
          supplier_id?: string | null
          updated_at?: string | null
        }
        Update: {
          average_price?: number | null
          brand?: string
          category?: Database["public"]["Enums"]["equipment_category"]
          created_at?: string | null
          id?: string
          image_url?: string | null
          min_stock?: number | null
          model?: string
          name?: string
          supplier_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          created_at: string | null
          equipment_id: string
          id: string
          movement_date: string | null
          movement_type: string
          notes: string | null
          quantity: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          equipment_id: string
          id?: string
          movement_date?: string | null
          movement_type: string
          notes?: string | null
          quantity: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          equipment_id?: string
          id?: string
          movement_date?: string | null
          movement_type?: string
          notes?: string | null
          quantity?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_records: {
        Row: {
          completion_date: string | null
          created_at: string | null
          equipment_id: string
          expected_completion_date: string | null
          id: string
          notes: string | null
          quantity: number
          send_date: string
          status: string
          technician_notes: string | null
          updated_at: string | null
        }
        Insert: {
          completion_date?: string | null
          created_at?: string | null
          equipment_id: string
          expected_completion_date?: string | null
          id?: string
          notes?: string | null
          quantity: number
          send_date: string
          status?: string
          technician_notes?: string | null
          updated_at?: string | null
        }
        Update: {
          completion_date?: string | null
          created_at?: string | null
          equipment_id?: string
          expected_completion_date?: string | null
          id?: string
          notes?: string | null
          quantity?: number
          send_date?: string
          status?: string
          technician_notes?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_records_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      order_batches: {
        Row: {
          created_at: string | null
          id: string
          invoice_number: string | null
          notes: string | null
          order_id: string
          received_date: string | null
          received_quantity: number
          shipping_date: string | null
          tracking_code: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          invoice_number?: string | null
          notes?: string | null
          order_id: string
          received_date?: string | null
          received_quantity: number
          shipping_date?: string | null
          tracking_code?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          invoice_number?: string | null
          notes?: string | null
          order_id?: string
          received_date?: string | null
          received_quantity?: number
          shipping_date?: string | null
          tracking_code?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_batches_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string | null
          equipment_id: string
          expected_arrival_date: string | null
          id: string
          invoice_number: string | null
          notes: string | null
          quantity: number
          status: Database["public"]["Enums"]["order_status"] | null
          supplier_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          equipment_id: string
          expected_arrival_date?: string | null
          id?: string
          invoice_number?: string | null
          notes?: string | null
          quantity: number
          status?: Database["public"]["Enums"]["order_status"] | null
          supplier_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          equipment_id?: string
          expected_arrival_date?: string | null
          id?: string
          invoice_number?: string | null
          notes?: string | null
          quantity?: number
          status?: Database["public"]["Enums"]["order_status"] | null
          supplier_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      readers: {
        Row: {
          code: string
          condition: Database["public"]["Enums"]["equipment_condition"] | null
          created_at: string | null
          equipment_id: string
          id: string
          status: Database["public"]["Enums"]["equipment_status"] | null
          updated_at: string | null
        }
        Insert: {
          code: string
          condition?: Database["public"]["Enums"]["equipment_condition"] | null
          created_at?: string | null
          equipment_id: string
          id?: string
          status?: Database["public"]["Enums"]["equipment_status"] | null
          updated_at?: string | null
        }
        Update: {
          code?: string
          condition?: Database["public"]["Enums"]["equipment_condition"] | null
          created_at?: string | null
          equipment_id?: string
          id?: string
          status?: Database["public"]["Enums"]["equipment_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "readers_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          average_delivery_days: number | null
          cnpj: string
          created_at: string | null
          id: string
          name: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          average_delivery_days?: number | null
          cnpj: string
          created_at?: string | null
          id?: string
          name: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          average_delivery_days?: number | null
          cnpj?: string
          created_at?: string | null
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      equipment_category: "Leitora" | "Sensor" | "Rastreador" | "Acessório"
      equipment_condition: "Novo" | "Recondicionado"
      equipment_status: "Disponível" | "Em Uso" | "Em Manutenção"
      order_status:
        | "Pendente"
        | "Parcialmente Recebido"
        | "Recebido"
        | "Arquivado"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      equipment_category: ["Leitora", "Sensor", "Rastreador", "Acessório"],
      equipment_condition: ["Novo", "Recondicionado"],
      equipment_status: ["Disponível", "Em Uso", "Em Manutenção"],
      order_status: [
        "Pendente",
        "Parcialmente Recebido",
        "Recebido",
        "Arquivado",
      ],
    },
  },
} as const
