import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";

export type EquipmentCategory = "Leitora" | "Sensor" | "Rastreador" | "Acessório";

export interface Equipment {
  id: string;
  brand: string;
  model: string;
  category: EquipmentCategory;
  average_price?: number;
  min_stock?: number;
  initial_stock?: number;
  supplier_id?: string;
  image_url?: string;
  quality_status?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
}

export const fetchEquipment = async (): Promise<Equipment[]> => {
  console.log("Fetching equipment...");
  const { data, error } = await supabase
    .from('equipment')
    .select('*')
    .order('brand');

  if (error) {
    console.error("Error fetching equipment:", error);
    toast.error('Erro ao carregar equipamentos', {
      description: error.message
    });
    return [];
  }

  console.log("Equipment fetched:", data);
  return data || [];
};

export const getEquipmentById = async (id: string): Promise<Equipment | null> => {
  const { data, error } = await supabase
    .from('equipment')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    toast.error('Erro ao carregar dados do equipamento', {
      description: error.message
    });
    return null;
  }

  return data;
};

export const createEquipment = async (equipment: Omit<Equipment, 'id' | 'created_at' | 'updated_at'>): Promise<Equipment | null> => {
  console.log("Creating equipment with data:", equipment);
  
  // Validate that required fields are present
  if (!equipment.brand || !equipment.model) {
    console.error("Missing required fields: brand or model");
    toast.error('Marca e modelo são obrigatórios');
    return null;
  }
  
  const { data, error } = await supabase
    .from('equipment')
    .insert(equipment)
    .select()
    .single();

  if (error) {
    console.error("Error creating equipment:", error);
    toast.error('Erro ao criar equipamento', {
      description: error.message
    });
    return null;
  }

  console.log("Equipment created successfully:", data);
  return data;
};

export const updateEquipment = async (id: string, equipment: Partial<Equipment>): Promise<Equipment | null> => {
  console.log("Updating equipment ID:", id, "with data:", equipment);
  
  // Remove undefined values to avoid overwriting with null
  const cleanedEquipment = Object.fromEntries(
    Object.entries(equipment).filter(([_, value]) => value !== undefined)
  );
  
  console.log("Cleaned equipment data for update:", cleanedEquipment);
  
  const { data, error } = await supabase
    .from('equipment')
    .update(cleanedEquipment)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error("Error updating equipment:", error);
    toast.error('Erro ao atualizar equipamento', {
      description: error.message
    });
    return null;
  }

  console.log("Equipment updated successfully:", data);
  return data;
};

export const deleteEquipment = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('equipment')
    .delete()
    .eq('id', id);

  if (error) {
    toast.error('Erro ao excluir equipamento', {
      description: error.message
    });
    return false;
  }

  toast.success('Equipamento excluído com sucesso');
  return true;
};

export const getEquipmentStock = async (): Promise<Array<{ equipment_id: string, total: number }>> => {
  const { data: movements, error: movementsError } = await supabase
    .from('inventory_movements')
    .select('equipment_id, movement_type, quantity');

  if (movementsError) {
    toast.error('Erro ao carregar estoque', {
      description: movementsError.message
    });
    return [];
  }

  const stockByEquipment = movements.reduce((acc: Record<string, number>, movement) => {
    const currentStock = acc[movement.equipment_id] || 0;
    if (movement.movement_type === 'Entrada') {
      acc[movement.equipment_id] = currentStock + movement.quantity;
    } else {
      acc[movement.equipment_id] = currentStock - movement.quantity;
    }
    return acc;
  }, {});

  return Object.entries(stockByEquipment).map(([equipment_id, total]) => ({
    equipment_id,
    total
  }));
};

export const getEquipmentWithStock = async (): Promise<Array<Equipment & { stock: number }>> => {
  const equipment = await fetchEquipment();
  const stockData = await getEquipmentStock();
  
  const stockMap = stockData.reduce((acc: Record<string, number>, item) => {
    acc[item.equipment_id] = item.total;
    return acc;
  }, {});
  
  return equipment.map(item => ({
    ...item,
    // Calculate stock as: initial_stock + movements
    stock: (item.initial_stock || 0) + (stockMap[item.id] || 0)
  }));
};

// Enable realtime updates for equipment table
export const enableEquipmentRealtime = () => {
  return supabase
    .channel('equipment-changes')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'equipment'
    }, () => {
      // This callback will be empty since we'll handle the refresh in the component
    })
    .subscribe();
};

// Upload equipment image to Supabase storage
export const uploadEquipmentImage = async (file: File): Promise<string | null> => {
  try {
    console.log("Starting image upload for file:", file.name, "Size:", file.size);
    
    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      console.error("File too large:", file.size);
      toast.error('Arquivo muito grande. Máximo 5MB permitido.');
      return null;
    }
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      console.error("Invalid file type:", file.type);
      toast.error('Tipo de arquivo não permitido. Use JPEG, PNG ou WebP.');
      return null;
    }
    
    // Create a unique filename
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `equipment/${fileName}`;
    
    console.log("Uploading file to path:", filePath);
    
    const { data, error } = await supabase.storage
      .from('equipment')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      console.error("Storage upload error:", error);
      toast.error('Erro ao fazer upload da imagem', {
        description: error.message
      });
      return null;
    }
    
    console.log("File uploaded successfully:", data.path);
    
    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('equipment')
      .getPublicUrl(filePath);
    
    const publicUrl = publicUrlData.publicUrl;
    console.log("Generated public URL:", publicUrl);
    
    // Verify the URL is accessible
    if (!publicUrl || !publicUrl.includes('supabase')) {
      console.error("Invalid public URL generated:", publicUrl);
      toast.error('Erro ao gerar URL pública da imagem');
      return null;
    }
    
    toast.success('Imagem enviada com sucesso!');
    return publicUrl;
    
  } catch (error: any) {
    console.error("Unexpected error during image upload:", error);
    toast.error('Erro inesperado ao fazer upload da imagem', {
      description: error.message
    });
    return null;
  }
};
