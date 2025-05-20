import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ArrowDown, 
  ArrowUp, 
  Plus, 
  Search, 
  FileText, 
  Calendar,
  Edit,
  Trash2
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { SearchInput } from "@/components/ui/search-input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectTrigger, 
  SelectValue, 
  SelectContent, 
  SelectItem 
} from "@/components/ui/select";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  fetchMovements, 
  createMovement, 
  updateMovement, 
  deleteMovement,
  MovementWithEquipment, 
  MovementType 
} from "@/services/movementService";
import { fetchEquipment } from "@/services/equipmentService";
import { supabase } from "@/integrations/supabase/client";
import MovementActions from "@/components/MovementActions";

const Movimentacoes = () => {
  const [movements, setMovements] = useState<MovementWithEquipment[]>([]);
  const [filteredMovements, setFilteredMovements] = useState<MovementWithEquipment[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dateFilter, setDateFilter] = useState({
    start: '',
    end: ''
  });
  
  // Form state
  const [currentMovement, setCurrentMovement] = useState<MovementWithEquipment | null>(null);
  const [formData, setFormData] = useState({
    equipment_id: '',
    movement_type: 'Entrada' as MovementType,
    quantity: 1,
    movement_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const loadData = async () => {
    try {
      const movementsData = await fetchMovements();
      setMovements(movementsData);
      setFilteredMovements(movementsData);
      
      const equipmentData = await fetchEquipment();
      setEquipment(equipmentData);
    } catch (error) {
      console.error("Error loading movements data:", error);
    }
  };

  useEffect(() => {
    loadData();

    // Subscribe to realtime updates
    const movementsChannel = supabase
      .channel('public:inventory_movements')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'inventory_movements'
      }, () => {
        loadData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(movementsChannel);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    
    if (id === 'quantity') {
      setFormData(prev => ({
        ...prev,
        [id]: value === '' ? 1 : parseInt(value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [id]: value
      }));
    }
  };

  const handleSelectChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      equipment_id: '',
      movement_type: 'Entrada',
      quantity: 1,
      movement_date: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setCurrentMovement(null);
  };

  const handleOpenAddDialog = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };

  const handleOpenEditDialog = (movement: MovementWithEquipment) => {
    setCurrentMovement(movement);
    setFormData({
      equipment_id: movement.equipment_id,
      movement_type: movement.movement_type,
      quantity: movement.quantity,
      movement_date: movement.movement_date ? new Date(movement.movement_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      notes: movement.notes || ''
    });
    setIsEditDialogOpen(true);
  };

  const handleOpenDeleteDialog = (movement: MovementWithEquipment) => {
    setCurrentMovement(movement);
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

  const handleDateFilterChange = (field: 'start' | 'end', value: string) => {
    setDateFilter(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Filter movements based on search term, type, and date range
  useEffect(() => {
    let filtered = movements;
    
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.equipment.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item.equipment.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.notes && item.notes.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    if (typeFilter) {
      filtered = filtered.filter(item => item.movement_type === typeFilter);
    }
    
    if (dateFilter.start) {
      filtered = filtered.filter(item => 
        new Date(item.movement_date) >= new Date(dateFilter.start)
      );
    }
    
    if (dateFilter.end) {
      filtered = filtered.filter(item => 
        new Date(item.movement_date) <= new Date(dateFilter.end)
      );
    }
    
    setFilteredMovements(filtered);
  }, [searchTerm, typeFilter, dateFilter, movements]);

  return (
    <MainLayout title="Movimentações de Estoque">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-zuq-darkblue">Movimentações de Estoque</h1>
        <Button 
          className="bg-zuq-blue hover:bg-zuq-blue/80"
          onClick={handleOpenAddDialog}
        >
          <Plus className="h-4 w-4 mr-2" /> Registrar Movimentação
        </Button>
      </div>
      
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle>Filtrar Movimentações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <SearchInput
                placeholder="Pesquisar por equipamento..."
                className="w-full"
                icon={<Search className="h-4 w-4" />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de Movimento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="Entrada">Entrada</SelectItem>
                  <SelectItem value="Saída">Saída</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="start-date" className="text-xs">Data Inicial</Label>
                <Input 
                  id="start-date" 
                  type="date" 
                  value={dateFilter.start}
                  onChange={(e) => handleDateFilterChange('start', e.target.value)}
                />
              </div>
            </div>
            <div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="end-date" className="text-xs">Data Final</Label>
                <Input 
                  id="end-date" 
                  type="date" 
                  value={dateFilter.end}
                  onChange={(e) => handleDateFilterChange('end', e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Button 
              variant="outline" 
              className="mr-2"
              onClick={() => {
                setSearchTerm('');
                setTypeFilter('');
                setDateFilter({ start: '', end: '' });
              }}
            >
              Limpar Filtros
            </Button>
            <Button className="bg-zuq-blue hover:bg-zuq-blue/80">
              <FileText className="h-4 w-4 mr-2" /> Gerar Relatório
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Equipamento</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-center">Quantidade</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Observações</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMovements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    Nenhuma movimentação encontrada
                  </TableCell>
                </TableRow>
              ) : (
                filteredMovements.map((movement) => (
                  <TableRow key={movement.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="bg-zuq-gray/30 p-2 rounded-md">
                          {movement.movement_type === 'Entrada' ? (
                            <ArrowDown className="h-4 w-4 text-green-500" />
                          ) : (
                            <ArrowUp className="h-4 w-4 text-amber-500" />
                          )}
                        </div>
                        {movement.equipment.name} {movement.equipment.model}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={movement.movement_type === 'Entrada' ? 'success' : 'warning'}>
                        {movement.movement_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      {movement.quantity}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {new Date(movement.movement_date).toLocaleDateString('pt-BR')}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {movement.notes || '-'}
                    </TableCell>
                    <TableCell>
                      <MovementActions 
                        movement={movement}
                        equipment={movement.equipment}
                        allEquipment={equipment}
                        onSuccess={loadData}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Movement Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Registrar Movimentação</DialogTitle>
            <DialogDescription>
              Informe os detalhes da movimentação de estoque
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="equipment_id">Equipamento</Label>
              <Select 
                value={formData.equipment_id} 
                onValueChange={(value) => handleSelectChange('equipment_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o equipamento" />
                </SelectTrigger>
                <SelectContent>
                  {equipment.map(item => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name} {item.model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="movement_type">Tipo de Movimento</Label>
                <Select 
                  value={formData.movement_type} 
                  onValueChange={(value) => handleSelectChange('movement_type', value as MovementType)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Entrada">Entrada</SelectItem>
                    <SelectItem value="Saída">Saída</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex flex-col gap-2">
                <Label htmlFor="quantity">Quantidade</Label>
                <Input 
                  id="quantity" 
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={handleInputChange}
                />
              </div>
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
            
            <div className="flex flex-col gap-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea 
                id="notes" 
                placeholder="Detalhes adicionais da movimentação..." 
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
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Movimentação</DialogTitle>
            <DialogDescription>
              Atualize os detalhes da movimentação
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-equipment">Equipamento</Label>
              <Select 
                value={formData.equipment_id} 
                onValueChange={(value) => handleSelectChange('equipment_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o equipamento" />
                </SelectTrigger>
                <SelectContent>
                  {equipment.map(item => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name} {item.model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="movement_type">Tipo de Movimento</Label>
                <Select 
                  value={formData.movement_type} 
                  onValueChange={(value) => handleSelectChange('movement_type', value as MovementType)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Entrada">Entrada</SelectItem>
                    <SelectItem value="Saída">Saída</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex flex-col gap-2">
                <Label htmlFor="quantity">Quantidade</Label>
                <Input 
                  id="quantity" 
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={handleInputChange}
                />
              </div>
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
            
            <div className="flex flex-col gap-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea 
                id="notes" 
                placeholder="Detalhes adicionais da movimentação..." 
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
                <p className="font-medium">{currentMovement.equipment.name} {currentMovement.equipment.model}</p>
                <p className="text-sm text-muted-foreground">
                  Tipo: {currentMovement.movement_type} - Quantidade: {currentMovement.quantity}
                </p>
                <p className="text-xs text-muted-foreground">
                  Data: {new Date(currentMovement.movement_date).toLocaleDateString('pt-BR')}
                </p>
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
