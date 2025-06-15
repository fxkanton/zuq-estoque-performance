
import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Plus, FileText } from "lucide-react";
import { Equipment, updateEquipment } from "@/services/equipmentService";
import { toast } from "@/components/ui/sonner";
import { useAuth } from "@/contexts/AuthContext";
import { isMemberOrManager } from "@/utils/permissions";
import { useEquipmentData } from "@/components/equipment/hooks/useEquipmentData";
import { EquipmentFilters } from "@/components/equipment/EquipmentFilters";
import { EquipmentTable } from "@/components/equipment/EquipmentTable";
import { EquipmentFormDialog } from "@/components/equipment/EquipmentFormDialog";
import { EquipmentViewDialog } from "@/components/equipment/EquipmentViewDialog";
import { EquipmentDeleteDialog } from "@/components/equipment/EquipmentDeleteDialog";
import { DataExportDialog } from "@/components/export/DataExportDialog";

const Equipamentos = () => {
  const { profile } = useAuth();
  const { equipamentos, suppliers, isLoading, loadData } = useEquipmentData();
  
  const [filteredEquipamentos, setFilteredEquipamentos] = useState<Array<Equipment & { stock?: number; creatorName?: string }>>([]);
  const [categories] = useState<string[]>(['Leitora', 'Sensor', 'Rastreador', 'Acessório']);
  
  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [currentEquipment, setCurrentEquipment] = useState<Equipment | null>(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [qualityFilter, setQualityFilter] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');

  const handleAdoptEquipment = async (equipment: Equipment) => {
    if (!profile?.id) return;
    
    try {
      await updateEquipment(equipment.id, { 
        created_by: profile.id 
      });
      toast.success("Equipamento adotado com sucesso!");
      loadData();
    } catch (error) {
      console.error("Error adopting equipment:", error);
      toast.error("Erro ao adotar equipamento");
    }
  };

  const handleOpenAddDialog = () => {
    setCurrentEquipment(null);
    setIsAddDialogOpen(true);
  };

  const handleOpenEditDialog = (equipment: Equipment) => {
    setCurrentEquipment(equipment);
    setIsEditDialogOpen(true);
  };

  const handleOpenViewDialog = (equipment: Equipment) => {
    setCurrentEquipment(equipment);
    setIsViewDialogOpen(true);
  };

  const handleOpenDeleteDialog = (equipment: Equipment) => {
    setCurrentEquipment(equipment);
    setIsDeleteDialogOpen(true);
  };

  const applyFilters = () => {
    let filtered = equipamentos;

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.brand.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter) {
      filtered = filtered.filter(item =>
        item.category.toLowerCase() === categoryFilter.toLowerCase()
      );
    }

    if (qualityFilter) {
      filtered = filtered.filter(item =>
        item.quality_status === qualityFilter
      );
    }

    if (supplierFilter) {
      filtered = filtered.filter(item =>
        item.supplier_id === supplierFilter
      );
    }

    setFilteredEquipamentos(filtered);
  };

  useEffect(() => {
    applyFilters();
  }, [searchTerm, categoryFilter, qualityFilter, supplierFilter, equipamentos]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('');
    setQualityFilter('');
    setSupplierFilter('');
  };

  // Only render if user has access (member or manager)
  if (!isMemberOrManager(profile?.role)) {
    return (
      <MainLayout title="Cadastro de Equipamentos">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground text-sm md:text-base">Acesso restrito a membros e gerentes.</p>
        </div>
      </MainLayout>
    );
  }

  if (isLoading) {
    return (
      <MainLayout title="Cadastro de Equipamentos">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground text-sm md:text-base">Carregando equipamentos...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Cadastro de Equipamentos">
      <div className="space-y-4 md:space-y-6">
        <div className="space-y-4">
          <h1 className="text-xl md:text-2xl font-bold text-zuq-darkblue">Equipamentos</h1>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-start">
            <Button 
              className="bg-zuq-blue hover:bg-zuq-blue/80 w-full sm:w-auto"
              onClick={handleOpenAddDialog}
            >
              <Plus className="h-4 w-4 mr-2" /> Novo Equipamento
            </Button>
            <Button 
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => setIsExportDialogOpen(true)}
            >
              <FileText className="h-4 w-4 mr-2" /> Exportar Dados
            </Button>
          </div>
        </div>

        <EquipmentFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          qualityFilter={qualityFilter}
          setQualityFilter={setQualityFilter}
          supplierFilter={supplierFilter}
          setSupplierFilter={setSupplierFilter}
          categories={categories}
          suppliers={suppliers}
          onClearFilters={handleClearFilters}
        />

        <EquipmentTable
          equipamentos={filteredEquipamentos}
          onView={handleOpenViewDialog}
          onEdit={handleOpenEditDialog}
          onDelete={handleOpenDeleteDialog}
          onAdopt={handleAdoptEquipment}
        />

        <EquipmentFormDialog
          open={isAddDialogOpen || isEditDialogOpen}
          onOpenChange={(open) => {
            if (!open) {
              setIsAddDialogOpen(false);
              setIsEditDialogOpen(false);
              setCurrentEquipment(null);
            }
          }}
          equipment={currentEquipment}
          suppliers={suppliers}
          onSuccess={loadData}
        />

        <EquipmentViewDialog
          open={isViewDialogOpen}
          onOpenChange={setIsViewDialogOpen}
          equipment={currentEquipment as Equipment & { stock?: number; creatorName?: string }}
          onEdit={handleOpenEditDialog}
          onAdopt={handleAdoptEquipment}
        />

        <EquipmentDeleteDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          equipment={currentEquipment}
          onSuccess={loadData}
        />

        <DataExportDialog
          open={isExportDialogOpen}
          onOpenChange={setIsExportDialogOpen}
        />
      </div>
    </MainLayout>
  );
};

export default Equipamentos;
