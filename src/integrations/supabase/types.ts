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
          created_by: string | null
          id: string
          image_url: string | null
          initial_stock: number | null
          min_stock: number | null
          model: string
          quality_status: string | null
          supplier_id: string | null
          updated_at: string | null
        }
        Insert: {
          average_price?: number | null
          brand: string
          category: Database["public"]["Enums"]["equipment_category"]
          created_at?: string | null
          created_by?: string | null
          id?: string
          image_url?: string | null
          initial_stock?: number | null
          min_stock?: number | null
          model: string
          quality_status?: string | null
          supplier_id?: string | null
          updated_at?: string | null
        }
        Update: {
          average_price?: number | null
          brand?: string
          category?: Database["public"]["Enums"]["equipment_category"]
          created_at?: string | null
          created_by?: string | null
          id?: string
          image_url?: string | null
          initial_stock?: number | null
          min_stock?: number | null
          model?: string
          quality_status?: string | null
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
      import_history: {
        Row: {
          completed_at: string | null
          created_at: string
          data_type: string
          error_details: Json | null
          failed_records: number
          id: string
          original_filename: string
          processed_records: number
          status: string
          total_records: number
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          data_type: string
          error_details?: Json | null
          failed_records?: number
          id?: string
          original_filename: string
          processed_records?: number
          status?: string
          total_records?: number
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          data_type?: string
          error_details?: Json | null
          failed_records?: number
          id?: string
          original_filename?: string
          processed_records?: number
          status?: string
          total_records?: number
          user_id?: string
        }
        Relationships: []
      }
      inventory_movements: {
        Row: {
          created_at: string | null
          created_by: string | null
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
          created_by?: string | null
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
          created_by?: string | null
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
          created_by: string | null
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
          created_by?: string | null
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
          created_by?: string | null
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
          created_by: string | null
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
          created_by?: string | null
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
          created_by?: string | null
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
          created_by: string | null
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
          created_by?: string | null
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
          created_by?: string | null
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
      orphaned_records_claims: {
        Row: {
          claimed_at: string
          claimed_by: string
          id: string
          record_id: string
          status: string | null
          table_name: string
        }
        Insert: {
          claimed_at?: string
          claimed_by: string
          id?: string
          record_id: string
          status?: string | null
          table_name: string
        }
        Update: {
          claimed_at?: string
          claimed_by?: string
          id?: string
          record_id?: string
          status?: string | null
          table_name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      readers: {
        Row: {
          acquisition_date: string | null
          code: string
          condition: Database["public"]["Enums"]["equipment_condition"] | null
          created_at: string | null
          created_by: string | null
          equipment_id: string
          id: string
          status: Database["public"]["Enums"]["equipment_status"] | null
          updated_at: string | null
        }
        Insert: {
          acquisition_date?: string | null
          code: string
          condition?: Database["public"]["Enums"]["equipment_condition"] | null
          created_at?: string | null
          created_by?: string | null
          equipment_id: string
          id?: string
          status?: Database["public"]["Enums"]["equipment_status"] | null
          updated_at?: string | null
        }
        Update: {
          acquisition_date?: string | null
          code?: string
          condition?: Database["public"]["Enums"]["equipment_condition"] | null
          created_at?: string | null
          created_by?: string | null
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
      report_configs: {
        Row: {
          created_at: string
          id: string
          kpis: Json
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kpis?: Json
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kpis?: Json
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      report_history: {
        Row: {
          completed_at: string | null
          created_at: string
          file_url: string | null
          id: string
          kpis_included: Json
          period_end: string
          period_start: string
          report_name: string
          status: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          file_url?: string | null
          id?: string
          kpis_included?: Json
          period_end: string
          period_start: string
          report_name: string
          status?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          file_url?: string | null
          id?: string
          kpis_included?: Json
          period_end?: string
          period_start?: string
          report_name?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          address: string | null
          average_delivery_days: number | null
          cnpj: string
          contact_name: string | null
          created_at: string | null
          created_by: string | null
          email: string | null
          id: string
          image_url: string | null
          name: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          average_delivery_days?: number | null
          cnpj: string
          contact_name?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          id?: string
          image_url?: string | null
          name: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          average_delivery_days?: number | null
          cnpj?: string
          contact_name?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          id?: string
          image_url?: string | null
          name?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      task_attachments: {
        Row: {
          created_at: string
          file_name: string
          file_size: number | null
          file_type: string
          file_url: string
          id: string
          task_id: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size?: number | null
          file_type: string
          file_url: string
          id?: string
          task_id: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_type?: string
          file_url?: string
          id?: string
          task_id?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assignee: string | null
          category: string | null
          checklist: Json | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          links: Json | null
          priority: Database["public"]["Enums"]["task_priority"]
          status: Database["public"]["Enums"]["task_status"]
          title: string
        }
        Insert: {
          assignee?: string | null
          category?: string | null
          checklist?: Json | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          links?: Json | null
          priority?: Database["public"]["Enums"]["task_priority"]
          status?: Database["public"]["Enums"]["task_status"]
          title: string
        }
        Update: {
          assignee?: string | null
          category?: string | null
          checklist?: Json | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          links?: Json | null
          priority?: Database["public"]["Enums"]["task_priority"]
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_creator_name: {
        Args: { creator_id: string }
        Returns: string
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["user_role"]
        }
        Returns: boolean
      }
      is_manager: {
        Args: { _user_id: string }
        Returns: boolean
      }
      is_member: {
        Args: { _user_id: string }
        Returns: boolean
      }
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
      task_priority: "Baixa" | "Média" | "Alta" | "Urgente"
      task_status:
        | "Vencidos"
        | "Vence hoje"
        | "Esta semana"
        | "Próxima semana"
        | "Sem prazo"
        | "Concluídos"
      user_role: "intruso" | "membro" | "gerente"
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
      task_priority: ["Baixa", "Média", "Alta", "Urgente"],
      task_status: [
        "Vencidos",
        "Vence hoje",
        "Esta semana",
        "Próxima semana",
        "Sem prazo",
        "Concluídos",
      ],
      user_role: ["intruso", "membro", "gerente"],
    },
  },
} as const
