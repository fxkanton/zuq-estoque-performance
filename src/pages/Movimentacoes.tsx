
import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowDownUp, ArrowDown, ArrowUp, Search } from "lucide-react";
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
import { fetchMovements, createMovement, MovementWithEquipment } from "@/services/movementService";
import { fetchEquipment, Equipment } from "@/services/equipmentService";
import { supabase } from "@/integrations/supabase/client";

const Movimentacoes = () => {
  const [movements, setMovements] = useState<MovementWithEquipment[]>([]);
  const [filteredMovements, setFilteredMovements] = useState<MovementWithEquipment[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [isEntryDialogOpen, setIsEntryDialogOpen] = useState(false);
  const [isExitDialogOpen, setIsExitDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [movementType, setMovementType] = useState<string>('');
  
  const [formData, setFormData] = useState({
    equipment_id: '',
    quantity: 1,
    notes: '',
    movement_date: new Date().toISOString().split('T')[0]
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
    const channel = supabase
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
      supabase.removeChannel(channel);
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
      quantity: 1,
      notes: '',
      movement_date: new Date().toISOString().split('T')[0]
    });
  };

  const handleRegisterEntry = async () => {
    try {
      await createMovement({
        equipment_id: formData.equipment_id,
        movement_type: 'Entrada',
        quantity: formData.quantity,
        movement_date: formData.movement_date,
        notes: formData.notes || undefined
      });
      
      setIsEntryDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error registering entry:", error);
    }
  };

  const handleRegisterExit = async () => {
    try {
      await createMovement({
        equipment_id: formData.equipment_id,
        movement_type: 'Saída',
        quantity: formData.quantity,
        movement_date: formData.movement_date,
        notes: formData.notes || undefined
      });
      
      setIsExitDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error registering exit:", error);
    }
  };

  // Filter movements based on search term and type
  useEffect(() => {
    let filtered = movements;
    
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.equipment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.notes && item.notes.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    if (movementType) {
      filtered = filtered.filter(item => item.movement_type === movementType);
    }
    
    setFilteredMovements(filtered);
  }, [searchTerm, movementType, movements]);

  return (
    <MainLayout title="Entradas e Saídas">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-zuq-darkblue">Controle de Entradas e Saídas</h1>
      </div>
      
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle>Filtrar Movimentações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <SearchInput
                placeholder="Pesquisar equipamento ou nota..."
                className="w-full"
                icon={<Search className="h-4 w-4" />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Select value={movementType} onValueChange={setMovementType}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de Movimento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="Entrada">Entradas</SelectItem>
                  <SelectItem value="Saída">Saídas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => { 
                  setSearchTerm(''); 
                  setMovementType(''); 
                }}
              >
                Limpar
              </Button>
              <Button className="bg-green-600 hover:bg-green-700 flex-1" onClick={() => setIsEntryDialogOpen(true)}>
                <ArrowDown className="h-4 w-4 mr-2" /> Registrar Entrada
              </Button>
              <Button className="bg-amber-600 hover:bg-amber-700 flex-1" onClick={() => setIsExitDialogOpen(true)}>
                <ArrowUp className="h-4 w-4 mr-2" /> Registrar Saída
              </Button>
            </div>
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
                filteredMovements.map((movement) => (
                  <TableRow key={movement.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="bg-zuq-gray/30 p-2 rounded-md">
                          <ArrowDownUp className="h-4 w-4 text-zuq-blue" />
                        </div>
                        {movement.equipment.name} {movement.equipment.model}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        movement.movement_type === "Entrada" 
                        ? "bg-green-100 text-green-800" 
                        : "bg-amber-100 text-amber-800"
                      }`}>
                        {movement.movement_type}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">{movement.quantity}</TableCell>
                    <TableCell>{new Date(movement.movement_date).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell>
                      {movement.notes || <span className="text-muted-foreground">Sem observações</span>}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Entry Dialog */}
      <Dialog open={isEntryDialogOpen} onOpenChange={setIsEntryDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Registrar Entrada</DialogTitle>
            <DialogDescription>
              Informe os detalhes da entrada de equipamentos no estoque
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="equipment">Equipamento</Label>
              <Select 
                value={formData.equipment_id} 
                onValueChange={(value) => handleSelectChange('equipment_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um equipamento" />
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
                <Label htmlFor="quantity">Quantidade</Label>
                <Input 
                  id="quantity" 
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={handleInputChange}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="movement_date">Data</Label>
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
              <Textarea 
                id="notes" 
                placeholder="Detalhes sobre esta entrada..." 
                value={formData.notes}
                onChange={handleInputChange}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEntryDialogOpen(false)}>Cancelar</Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={handleRegisterEntry}>Registrar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Exit Dialog */}
      <Dialog open={isExitDialogOpen} onOpenChange={setIsExitDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Registrar Saída</DialogTitle>
            <DialogDescription>
              Informe os detalhes da saída de equipamentos do estoque
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="equipment">Equipamento</Label>
              <Select 
                value={formData.equipment_id} 
                onValueChange={(value) => handleSelectChange('equipment_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um equipamento" />
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
                <Label htmlFor="quantity">Quantidade</Label>
                <Input 
                  id="quantity" 
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={handleInputChange}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="movement_date">Data</Label>
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
              <Textarea 
                id="notes" 
                placeholder="Detalhes sobre esta saída..." 
                value={formData.notes}
                onChange={handleInputChange}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsExitDialogOpen(false)}>Cancelar</Button>
            <Button className="bg-amber-600 hover:bg-amber-700" onClick={handleRegisterExit}>Registrar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default Movimentacoes;
