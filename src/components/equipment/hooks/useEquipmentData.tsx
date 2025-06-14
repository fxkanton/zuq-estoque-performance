
import { useState, useEffect } from "react";
import { Equipment, getEquipmentWithStock } from "@/services/equipmentService";
import { fetchSuppliers, Supplier } from "@/services/supplierService";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { useAuth } from "@/contexts/AuthContext";
import { isMemberOrManager } from "@/utils/permissions";

export const useEquipmentData = () => {
  const { profile } = useAuth();
  const [equipamentos, setEquipamentos] = useState<Array<Equipment & { stock?: number; creatorName?: string }>>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    if (!isMemberOrManager(profile?.role)) {
      console.log("User doesn't have access, skipping data load");
      setIsLoading(false);
      return;
    }

    try {
      console.log("Loading equipment data...");
      const equipmentData = await getEquipmentWithStock();
      console.log("Equipment data loaded:", equipmentData);
      
      // Add creator names to equipment data
      const equipmentWithCreatorNames = await Promise.all(
        equipmentData.map(async (item) => {
          let creatorName = undefined;
          if (item.created_by) {
            try {
              const { data } = await supabase.rpc('get_creator_name', {
                creator_id: item.created_by
              });
              creatorName = data || 'Usuário Desconhecido';
            } catch (error) {
              console.error('Error fetching creator name:', error);
              creatorName = 'Erro ao carregar';
            }
          }
          return {
            ...item,
            creatorName
          };
        })
      );
      
      setEquipamentos(equipmentWithCreatorNames);

      const suppliersData = await fetchSuppliers();
      setSuppliers(suppliersData);
    } catch (error) {
      console.error("Error loading equipment data:", error);
      toast.error("Erro ao carregar dados dos equipamentos");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Subscribe to realtime updates
    const equipmentChannel = supabase
      .channel('public:equipment')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'equipment'
      }, () => {
        console.log("Equipment table changed, reloading data...");
        loadData();
      })
      .subscribe();

    const movementsChannel = supabase
      .channel('public:inventory_movements')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'inventory_movements'
      }, () => {
        console.log("Inventory movements changed, reloading data...");
        loadData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(equipmentChannel);
      supabase.removeChannel(movementsChannel);
    };
  }, [profile]);

  return {
    equipamentos,
    suppliers,
    isLoading,
    loadData
  };
};
