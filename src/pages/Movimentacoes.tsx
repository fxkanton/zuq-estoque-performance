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
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import { fetchMovements, createMovement, updateMovement, deleteMovement, Movement } from "@/services/movementService";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchEquipment, Equipment } from "@/services/equipmentService";
import DateRangeFilter from "@/components/ui/date-range-filter";

const Movimentacoes = () => {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [filteredMovements, setFilteredMovements] = useState<Movement[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState('');
  const [movementType, setMovementType] = useState<'Entrada' | 'Saída'>('Entrada');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Form state
  const [currentMovement, setCurrentMovement] = useState<Movement | null>(null);
  const [formData, setFormData] = useState({
    equipment_id: '',
    movement_type: 'Entrada' as 'Entrada' | 'Saída',
    quantity: 0,
    movement_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const loadMovements = async () => {
    try {
      const data = await fetchMovements();
      setMovements(data);
      setFilteredMovements(data);
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

    // Subscribe to realtime updates
    const channel = supabase
      .channel('public:inventory_movements')
      .on('postgres_changes', {
        event: '*', 
        schema: 'public',
        table: 'inventory_movements'
      }, () => {
        loadMovements();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    
    if (id === 'quantity') {
      setFormData(prev => ({
        ...prev,
        [id]: value === '' ? 0 : parseInt(value)
      }));
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
      quantity: 0,
      movement_date: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setCurrentMovement(null);
  };

  const handleOpenAddDialog = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };

  const handleOpenEditDialog = (item: Movement) => {
    setCurrentMovement(item);
    setFormData({
      equipment_id: item.equipment_id,
      movement_type: item.movement_type as 'Entrada' | 'Saída',
      quantity: item.quantity,
      movement_date: item.movement_date,
      notes: item.notes || ''
    });
    setIsEditDialogOpen(true);
  };

  const handleOpenDeleteDialog = (item: Movement) => {
    setCurrentMovement(item);
    setIsDeleteDialogOpen(true);
  };

  const handleSaveMovement = async () => {
    try {
      await createMovement(formData);
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error creating movement:", error);
    }
  };

  const handleUpdateMovement = async () => {
    if (!currentMovement) return;
    
    try {
      await updateMovement(currentMovement.id, formData);
      setIsEditDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error updating movement:", error);
    }
  };

  const handleDeleteMovement = async () => {
    if (!currentMovement) return;
    
    try {
      await deleteMovement(currentMovement.id);
      setIsDeleteDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error deleting movement:", error);
    }
  };

  // Filter movements based on search term
  useEffect(() => {
    if (!searchTerm && !selectedEquipmentId && !startDate && !endDate) {
      setFilteredMovements(movements);
      return;
    }
    
    let filtered = movements;
    
    if (searchTerm) {
      filtered = filtered.filter(movement => {
        const equipment = equipmentList.find(eq => eq.id === movement.equipment_id);
        if (equipment) {
          return equipment.name.toLowerCase().includes(searchTerm.toLowerCase());
        }
        return false;
      });
    }
    
    if (selectedEquipmentId) {
      filtered = filtered.filter(movement => movement.equipment_id === selectedEquipmentId);
    }

    if (startDate && endDate) {
      filtered = filtered.filter(movement => {
        const movementDate = new Date(movement.movement_date);
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        
        return movementDate >= start && movementDate <= end;
      });
    }
    
    setFilteredMovements(filtered);
  }, [searchTerm, movements, selectedEquipmentId, equipmentList, startDate, endDate]);

  const EditDeleteButtons = ({ item }: { item: Movement }) => {
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-zuq-darkblue">Controle de Movimentações</h1>
        
        <Button className="bg-zuq-blue hover:bg-zuq-blue/80" onClick={handleOpenAddDialog}>
          <Plus className="h-4 w-4 mr-2" /> Nova Movimentação
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle>Filtrar Movimentações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="mb-4 md:mb-0">
              <SearchInput
                placeholder="Pesquisar por equipamento..."
                className="w-full"
                icon={<Search className="h-4 w-4" />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="mb-4 md:mb-0">
              <Label htmlFor="equipment" className="block text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Equipamento
              </Label>
              <Select onValueChange={setSelectedEquipmentId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione um equipamento" />
                </SelectTrigger>
                <SelectContent>
                  {equipmentList.map((equipment) => (
                    <SelectItem key={equipment.id} value={equipment.id}>{equipment.name}</SelectItem>
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
                  setSelectedEquipmentId('');
                  setStartDate('');
                  setEndDate('');
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
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onFilterApply={loadMovements}
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
                        {equipment ? equipment.name : 'N/A'}
                      </TableCell>
                      <TableCell>{item.movement_type}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{new Date(item.movement_date).toLocaleDateString()}</TableCell>
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

      {/* Add Movement Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Cadastrar Nova Movimentação</DialogTitle>
            <DialogDescription>
              Preencha os dados da movimentação para cadastro no sistema.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="equipment_id">Equipamento</Label>
                <Select onValueChange={(value) => setFormData(prev => ({ ...prev, equipment_id: value }))}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione um equipamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {equipmentList.map((equipment) => (
                      <SelectItem key={equipment.id} value={equipment.id}>{equipment.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="movement_type">Tipo de Movimentação</Label>
                <Select onValueChange={(value) => setFormData(prev => ({ ...prev, movement_type: value as 'Entrada' | 'Saída' }))}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Entrada">Entrada</SelectItem>
                    <SelectItem value="Saída">Saída</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="quantity">Quantidade</Label>
                <Input 
                  id="quantity" 
                  type="number" 
                  placeholder="0"
                  value={formData.quantity}
                  onChange={handleInputChange}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="movement_date">Data da Movimentação</Label>
                <Input 
                  id="movement_date" 
                  type="date"
                  value={formData.movement_date}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <Label htmlFor="notes">Observações</Label>
              <Input 
                id="notes" 
                placeholder="Observações adicionais"
                value={formData.notes}
                onChange={handleInputChange}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancelar</Button>
            <Button className="bg-zuq-blue hover:bg-zuq-blue/80" onClick={handleSaveMovement}>Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Movement Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Editar Movimentação</DialogTitle>
            <DialogDescription>
              Atualize as informações da movimentação.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="equipment_id">Equipamento</Label>
                  <Select 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, equipment_id: value }))}
                    defaultValue={formData.equipment_id}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione um equipamento" />
                    </SelectTrigger>
                    <SelectContent>
                      {equipmentList.map((equipment) => (
                        <SelectItem key={equipment.id} value={equipment.id}>{equipment.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="movement_type">Tipo de Movimentação</Label>
                <Select 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, movement_type: value as 'Entrada' | 'Saída' }))}
                  defaultValue={formData.movement_type}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Entrada">Entrada</SelectItem>
                    <SelectItem value="Saída">Saída</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="quantity">Quantidade</Label>
                <Input 
                  id="quantity" 
                  type="number" 
                  placeholder="0"
                  value={formData.quantity}
                  onChange={handleInputChange}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="movement_date">Data da Movimentação</Label>
                <Input 
                  id="movement_date" 
                  type="date"
                  value={formData.movement_date}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <Label htmlFor="notes">Observações</Label>
              <Input 
                id="notes" 
                placeholder="Observações adicionais"
                value={formData.notes}
                onChange={handleInputChange}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button>
            <Button className="bg-zuq-blue hover:bg-zuq-blue/80" onClick={handleUpdateMovement}>Salvar</Button>
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
                {equipmentList.find(eq => eq.id === currentMovement?.equipment_id)?.name}
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
    </MainLayout>
  );
};

export default Movimentacoes;
