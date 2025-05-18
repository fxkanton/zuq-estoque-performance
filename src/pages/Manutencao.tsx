
import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, Plus, Search } from "lucide-react";
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
import { 
  fetchMaintenanceRecords, 
  createMaintenance, 
  MaintenanceWithEquipment 
} from "@/services/maintenanceService";
import { fetchEquipment } from "@/services/equipmentService";
import { supabase } from "@/integrations/supabase/client";

const Manutencao = () => {
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceWithEquipment[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<MaintenanceWithEquipment[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    equipment_id: '',
    quantity: 1,
    send_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const loadData = async () => {
    try {
      const records = await fetchMaintenanceRecords();
      setMaintenanceRecords(records);
      setFilteredRecords(records);
      
      const equipmentData = await fetchEquipment();
      setEquipment(equipmentData);
    } catch (error) {
      console.error("Error loading maintenance data:", error);
    }
  };

  useEffect(() => {
    loadData();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('public:maintenance_records')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'maintenance_records'
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
      send_date: new Date().toISOString().split('T')[0],
      notes: ''
    });
  };

  const handleOpenAddDialog = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      await createMaintenance(formData);
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error registering maintenance:", error);
    }
  };

  // Filter maintenance records based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredRecords(maintenanceRecords);
      return;
    }
    
    const filtered = maintenanceRecords.filter(record => 
      record.equipment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.notes && record.notes.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    setFilteredRecords(filtered);
  }, [searchTerm, maintenanceRecords]);

  return (
    <MainLayout title="Controle de Manutenção">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-zuq-darkblue">Controle de Manutenção</h1>
        <Button 
          className="bg-zuq-blue hover:bg-zuq-blue/80"
          onClick={handleOpenAddDialog}
        >
          <Plus className="h-4 w-4 mr-2" /> Registrar Manutenção
        </Button>
      </div>
      
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle>Filtrar Registros de Manutenção</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <SearchInput
                placeholder="Pesquisar por equipamento ou notas..."
                className="w-full"
                icon={<Search className="h-4 w-4" />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setSearchTerm('')}
              >
                Limpar
              </Button>
              <Button variant="outline" className="flex-1">Visualizar Histórico</Button>
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
                <TableHead className="text-center">Quantidade</TableHead>
                <TableHead>Data de Envio</TableHead>
                <TableHead>Notas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                    Nenhum registro de manutenção encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="bg-zuq-gray/30 p-2 rounded-md">
                          <Settings className="h-4 w-4 text-zuq-blue" />
                        </div>
                        {record.equipment.name} {record.equipment.model}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{record.quantity}</TableCell>
                    <TableCell>{new Date(record.send_date).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell>
                      {record.notes || <span className="text-muted-foreground">Sem observações</span>}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Maintenance Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Registrar Manutenção</DialogTitle>
            <DialogDescription>
              Informe os detalhes do equipamento enviado para manutenção
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
                <Label htmlFor="send_date">Data de Envio</Label>
                <Input 
                  id="send_date" 
                  type="date"
                  value={formData.send_date}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea 
                id="notes" 
                placeholder="Detalhes da manutenção..." 
                value={formData.notes}
                onChange={handleInputChange}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancelar</Button>
            <Button className="bg-zuq-blue hover:bg-zuq-blue/80" onClick={handleSubmit}>Registrar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default Manutencao;
