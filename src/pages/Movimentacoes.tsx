import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SearchInput } from "@/components/ui/search-input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Search, Edit, Trash2, Package, ArrowUp, ArrowDown, Download } from "lucide-react";
import { fetchMovements, createMovement, updateMovement, deleteMovement, MovementWithEquipment } from "@/services/movementService";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchEquipment, Equipment } from "@/services/equipmentService";
import DateRangeFilter from "@/components/ui/date-range-filter";
import { Textarea } from "@/components/ui/textarea";
import { MovementExportDialog } from "@/components/export/MovementExportDialog";

const Movimentacoes = () => {
  const [movements, setMovements] = useState<MovementWithEquipment[]>([]);
  const [filteredMovements, setFilteredMovements] = useState<MovementWithEquipment[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState('all');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [availableModels, setAvailableModels] = useState<Equipment[]>([]);

  // Form state
  const [currentMovement, setCurrentMovement] = useState<MovementWithEquipment | null>(null);
  const [formData, setFormData] = useState({
    equipment_id: '',
    movement_type: 'Entrada' as 'Entrada' | 'Saída',
    quantity: '',
    movement_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const loadMovements = async () => {
    try {
      const data = await fetchMovements();
      setMovements(data);
    } catch (error) {
      console.error("Error loading movements:", error);
    }
  };

  const loadEquipment = async () => {
    try {
      const data = await fetchEquipment();
      setEquipmentList(data);
    } catch (error) {
      console.error("Error loading equipment:", error);
    }
  };

  useEffect(() => {
    loadMovements();
    loadEquipment();

    // Subscribe to realtime updates for other users' changes
    const channel = supabase
      .channel('inventory-movements-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inventory_movements',
        },
        async (payload) => {
          console.log('Realtime change received on inventory_movements:', payload);
          // Only reload if the change wasn't made by current user (to avoid double updates)
          try {
            const { data: { user } } = await supabase.auth.getUser();
            const payloadData = payload.new as any;
            if (payloadData && payloadData.created_by !== user?.id) {
              loadMovements();
            }
          } catch (error) {
            console.error('Error checking user in realtime update:', error);
            // If we can't check the user, just reload to be safe
            loadMovements();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Get unique brands
  const getUniqueBrands = () => {
    const brands = equipmentList.map(eq => eq.brand).filter(brand => brand);
    return [...new Set(brands)].sort();
  };

  // Filter models by selected brand
  useEffect(() => {
    if (selectedBrand) {
      const models = equipmentList.filter(eq => eq.brand === selectedBrand);
      setAvailableModels(models);
    } else {
      setAvailableModels([]);
    }
    setSelectedModel('');
  }, [selectedBrand, equipmentList]);

  // Get selected equipment ID
  const getSelectedEquipmentId = () => {
    const equipment = equipmentList.find(eq => 
      eq.brand === selectedBrand && eq.model === selectedModel
    );
    return equipment?.id || '';
  };

  const handleDateRangeChange = (newStartDate: Date, newEndDate: Date) => {
    setStartDate(newStartDate);
    setEndDate(newEndDate);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    
    if (id === 'quantity') {
      const numericValue = value.replace(/[^0-9]/g, '');
      if (numericValue === '') {
        setFormData(prev => ({ ...prev, quantity: '' }));
      } else {
        setFormData(prev => ({ ...prev, quantity: parseInt(numericValue, 10).toString() }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [id]: value
      }));
    }
  };

  const resetForm = () => {
    setFormData({
      equipment_id: '',
      movement_type: 'Entrada',
      quantity: '',
      movement_date: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setSelectedBrand('');
    setSelectedModel('');
    setCurrentMovement(null);
  };

  const handleOpenAddDialog = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };

  const handleOpenEditDialog = (item: MovementWithEquipment) => {
    setCurrentMovement(item);
    const equipment = equipmentList.find(eq => eq.id === item.equipment_id);
    if (equipment) {
      setSelectedBrand(equipment.brand);
      setSelectedModel(equipment.model);
    }
    setFormData({
      equipment_id: item.equipment_id,
      movement_type: item.movement_type as 'Entrada' | 'Saída',
      quantity: item.quantity.toString(),
      movement_date: item.movement_date,
      notes: item.notes || ''
    });
    setIsEditDialogOpen(true);
  };

  const handleOpenDeleteDialog = (item: MovementWithEquipment) => {
    setCurrentMovement(item);
    setIsDeleteDialogOpen(true);
  };

  const handleSaveMovement = async () => {
    try {
      const equipmentId = getSelectedEquipmentId();
      if (!equipmentId) {
        console.error("No equipment selected");
        return;
      }
      
      const newMovement = await createMovement({
        ...formData,
        equipment_id: equipmentId,
        quantity: parseInt(formData.quantity, 10) || 0
      });
      
      if (newMovement) {
        // Add the new movement to the beginning of the list for smooth update
        setMovements(prev => [newMovement, ...prev]);
      }
      
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error creating movement:", error);
    }
  };

  const handleUpdateMovement = async () => {
    if (!currentMovement) return;
    
    try {
      const equipmentId = getSelectedEquipmentId();
      if (!equipmentId) {
        console.error("No equipment selected");
        return;
      }
      
      const updatedMovement = await updateMovement(currentMovement.id, {
        ...formData,
        equipment_id: equipmentId,
        quantity: parseInt(formData.quantity, 10) || 0,
      });
      
      if (updatedMovement) {
        // Update the movement in the list for smooth update
        setMovements(prev => prev.map(movement => 
          movement.id === currentMovement.id ? updatedMovement : movement
        ));
      }
      
      setIsEditDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error updating movement:", error);
    }
  };

  const handleDeleteMovement = async () => {
    if (!currentMovement) return;
    
    try {
      const success = await deleteMovement(currentMovement.id);
      if (success) {
        // Remove the movement from the list for smooth update
        setMovements(prev => prev.filter(movement => movement.id !== currentMovement.id));
      }
      setIsDeleteDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error deleting movement:", error);
    }
  };

  // Filter movements based on search term
  useEffect(() => {
    if (!searchTerm && selectedEquipmentId === 'all' && !startDate && !endDate) {
      setFilteredMovements(movements);
      return;
    }
    
    let filtered = movements;
    
    if (searchTerm) {
      filtered = filtered.filter(movement => {
        const equipment = equipmentList.find(eq => eq.id === movement.equipment_id);
        if (equipment) {
          return equipment.brand.toLowerCase().includes(searchTerm.toLowerCase());
        }
        return false;
      });
    }
    
    if (selectedEquipmentId && selectedEquipmentId !== 'all') {
      filtered = filtered.filter(movement => movement.equipment_id === selectedEquipmentId);
    }

    if (startDate && endDate) {
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      filtered = filtered.filter(movement => {
        const movementDate = new Date(movement.movement_date);
        const start = new Date(startDateStr);
        const end = new Date(endDateStr);
        
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        
        return movementDate >= start && movementDate <= end;
      });
    }
    
    setFilteredMovements(filtered);
  }, [searchTerm, movements, selectedEquipmentId, equipmentList, startDate, endDate]);

  const EditDeleteButtons = ({ item }: { item: MovementWithEquipment }) => {
    return (
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleOpenEditDialog(item)}
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button 
          variant="outline"
          size="sm" 
          className="text-red-500"
          onClick={() => handleOpenDeleteDialog(item)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  return (
    <MainLayout title="Movimentações">
      <div className="space-y-4 md:space-y-6">
        <div className="space-y-4">
          <h1 className="text-xl md:text-2xl font-bold text-zuq-darkblue">Controle de Movimentações</h1>
          
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Button className="bg-zuq-blue hover:bg-zuq-blue/80 flex-1 sm:flex-none" onClick={handleOpenAddDialog}>
              <Plus className="h-4 w-4 mr-2" /> Nova Movimentação
            </Button>
            <Button 
              variant="outline" 
              className="flex-1 sm:flex-none"
              onClick={() => setIsExportDialogOpen(true)}
            >
              <Download className="h-4 w-4 mr-2" /> Exportar
            </Button>
          </div>
        </div>

        <Card className="mb-4 md:mb-6">
          <CardHeader className="pb-3 px-4 md:px-6">
            <CardTitle className="text-base md:text-lg">Filtrar Movimentações</CardTitle>
          </CardHeader>
          <CardContent className="px-4 md:px-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              <div className="sm:col-span-2 lg:col-span-1">
                <SearchInput
                  placeholder="Pesquisar por equipamento..."
                  className="w-full"
                  icon={<Search className="h-4 w-4" />}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div>
                <Select onValueChange={setSelectedEquipmentId} value={selectedEquipmentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Equipamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os equipamentos</SelectItem>
                    {equipmentList.map((equipment) => (
                      <SelectItem key={equipment.id} value={equipment.id}>{equipment.brand} {equipment.model}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedEquipmentId('all');
                    setStartDate(new Date());
                    setEndDate(new Date());
                    loadMovements();
                  }}
                >
                  Limpar
                </Button>
                <Button 
                  className="bg-zuq-blue hover:bg-zuq-blue/80 flex-1"
                  onClick={() => {}}
                >
                  Aplicar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <DateRangeFilter 
          startDate={startDate}
          endDate={endDate}
          onChange={handleDateRangeChange}
        />

        <Card>
          <CardContent className="p-0 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Equipamento</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMovements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                      Nenhuma movimentação encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMovements.map((item) => {
                    const equipment = equipmentList.find(eq => eq.id === item.equipment_id);
                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          {item.equipment ? `${item.equipment.brand} ${item.equipment.model}` : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {item.movement_type === 'Entrada' ? (
                              <ArrowDown className="h-4 w-4 text-green-500" />
                            ) : (
                              <ArrowUp className="h-4 w-4 text-red-500" />
                            )}
                            {item.movement_type}
                          </div>
                        </TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{new Date(item.movement_date).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell>
                          <EditDeleteButtons item={item} />
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Add Movement Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Cadastrar Nova Movimentação
            </DialogTitle>
            <DialogDescription>
              Preencha os dados da movimentação para cadastro no sistema.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="brand" className="text-sm font-medium">Marca *</Label>
                <Select onValueChange={setSelectedBrand} value={selectedBrand}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione a marca" />
                  </SelectTrigger>
                  <SelectContent>
                    {getUniqueBrands().filter(brand => brand.trim() !== '').map((brand) => (
                      <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex flex-col gap-2">
                <Label htmlFor="model" className="text-sm font-medium">Modelo *</Label>
                <Select 
                  onValueChange={setSelectedModel} 
                  value={selectedModel}
                  disabled={!selectedBrand}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o modelo" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableModels.filter(eq => eq.model && eq.model.trim() !== '').map((equipment) => (
                      <SelectItem key={equipment.id} value={equipment.model}>
                        {equipment.model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex flex-col gap-2">
                <Label htmlFor="movement_type" className="text-sm font-medium">Tipo *</Label>
                <Select onValueChange={(value) => setFormData(prev => ({ ...prev, movement_type: value as 'Entrada' | 'Saída' }))} value={formData.movement_type}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Tipo de movimento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Entrada">
                      <div className="flex items-center gap-2">
                        <ArrowDown className="h-4 w-4 text-green-500" />
                        Entrada
                      </div>
                    </SelectItem>
                    <SelectItem value="Saída">
                      <div className="flex items-center gap-2">
                        <ArrowUp className="h-4 w-4 text-red-500" />
                        Saída
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="quantity" className="text-sm font-medium">Quantidade *</Label>
                <Input 
                  id="quantity" 
                  type="text" 
                  inputMode="numeric"
                  placeholder="Digite a quantidade"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  className="text-center"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="movement_date" className="text-sm font-medium">Data da Movimentação *</Label>
                <Input 
                  id="movement_date" 
                  type="date"
                  value={formData.movement_date}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <Label htmlFor="notes" className="text-sm font-medium">Observações</Label>
              <Textarea 
                id="notes" 
                placeholder="Observações adicionais sobre a movimentação..."
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              className="bg-zuq-blue hover:bg-zuq-blue/80" 
              onClick={handleSaveMovement}
              disabled={!selectedBrand || !selectedModel || !formData.movement_type || !formData.quantity || parseInt(formData.quantity) <= 0}
            >
              Salvar Movimentação
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Movement Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Editar Movimentação
            </DialogTitle>
            <DialogDescription>
              Atualize as informações da movimentação.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="brand" className="text-sm font-medium">Marca *</Label>
                <Select onValueChange={setSelectedBrand} value={selectedBrand}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione a marca" />
                  </SelectTrigger>
                  <SelectContent>
                    {getUniqueBrands().filter(brand => brand.trim() !== '').map((brand) => (
                      <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex flex-col gap-2">
                <Label htmlFor="model" className="text-sm font-medium">Modelo *</Label>
                <Select 
                  onValueChange={setSelectedModel} 
                  value={selectedModel}
                  disabled={!selectedBrand}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o modelo" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableModels.filter(eq => eq.model && eq.model.trim() !== '').map((equipment) => (
                      <SelectItem key={equipment.id} value={equipment.model}>
                        {equipment.model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex flex-col gap-2">
                <Label htmlFor="movement_type" className="text-sm font-medium">Tipo *</Label>
                <Select 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, movement_type: value as 'Entrada' | 'Saída' }))}
                  value={formData.movement_type}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Tipo de movimento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Entrada">
                      <div className="flex items-center gap-2">
                        <ArrowDown className="h-4 w-4 text-green-500" />
                        Entrada
                      </div>
                    </SelectItem>
                    <SelectItem value="Saída">
                      <div className="flex items-center gap-2">
                        <ArrowUp className="h-4 w-4 text-red-500" />
                        Saída
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="quantity" className="text-sm font-medium">Quantidade *</Label>
                <Input 
                  id="quantity" 
                  type="text" 
                  inputMode="numeric"
                  placeholder="Digite a quantidade"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  className="text-center"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="movement_date" className="text-sm font-medium">Data da Movimentação *</Label>
                <Input 
                  id="movement_date" 
                  type="date"
                  value={formData.movement_date}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <Label htmlFor="notes" className="text-sm font-medium">Observações</Label>
              <Textarea 
                id="notes" 
                placeholder="Observações adicionais sobre a movimentação..."
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              className="bg-zuq-blue hover:bg-zuq-blue/80" 
              onClick={handleUpdateMovement}
              disabled={!selectedBrand || !selectedModel || !formData.movement_type || !formData.quantity || parseInt(formData.quantity) <= 0}
            >
              Atualizar Movimentação
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta movimentação? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {currentMovement && (
              <div className="border-l-4 border-red-500 pl-4">
                {equipmentList.find(eq => eq.id === currentMovement?.equipment_id)?.brand}
                <p className="text-sm text-muted-foreground">Quantidade: {currentMovement.quantity}</p>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDeleteMovement}>Excluir</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Movement Export Dialog */}
      <MovementExportDialog 
        open={isExportDialogOpen}
        onOpenChange={setIsExportDialogOpen}
      />
    </MainLayout>
  );
};

export default Movimentacoes;
