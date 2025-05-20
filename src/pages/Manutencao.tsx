
import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, Plus, Search, Check, X, ArrowLeft } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
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
  updateMaintenance,
  MaintenanceRecord,
  MaintenanceStatus
} from "@/services/maintenanceService";
import { fetchEquipment } from "@/services/equipmentService";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MaintenanceActions from "@/components/MaintenanceActions";

const Manutencao = () => {
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<MaintenanceRecord[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentRecord, setCurrentRecord] = useState<MaintenanceRecord | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    equipment_id: '',
    quantity: 1,
    send_date: new Date().toISOString().split('T')[0],
    notes: '',
    status: 'Em Andamento' as MaintenanceStatus,
    technician_notes: '',
    expected_completion_date: ''
  });

  // Complete maintenance form
  const [completeData, setCompleteData] = useState({
    technician_notes: '',
    completion_date: new Date().toISOString().split('T')[0],
    status: 'Concluído' as MaintenanceStatus
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

  const handleCompleteInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setCompleteData(prev => ({
      ...prev,
      [id]: value
    }));
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
      notes: '',
      status: 'Em Andamento',
      technician_notes: '',
      expected_completion_date: ''
    });
    setCompleteData({
      technician_notes: '',
      completion_date: new Date().toISOString().split('T')[0],
      status: 'Concluído'
    });
    setCurrentRecord(null);
  };

  const handleOpenAddDialog = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };
  
  const handleOpenViewDialog = (record: MaintenanceRecord) => {
    setCurrentRecord(record);
    setIsViewDialogOpen(true);
  };
  
  const handleOpenCompleteDialog = (record: MaintenanceRecord) => {
    setCurrentRecord(record);
    setCompleteData(prev => ({
      ...prev,
      technician_notes: record.technician_notes || ''
    }));
    setIsCompleteDialogOpen(true);
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
  
  const handleComplete = async () => {
    if (!currentRecord) return;
    
    try {
      await updateMaintenance(currentRecord.id, {
        ...completeData,
        status: 'Concluído' as MaintenanceStatus
      });
      
      setIsCompleteDialogOpen(false);
      resetForm();
      toast.success("Manutenção concluída com sucesso!");
    } catch (error) {
      console.error("Error completing maintenance:", error);
      toast.error("Erro ao concluir manutenção");
    }
  };

  // Filter maintenance records based on search term and status
  useEffect(() => {
    let filtered = maintenanceRecords;
    
    if (searchTerm) {
      filtered = filtered.filter(record => 
        record.equipment?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.equipment?.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (record.notes && record.notes.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(record => record.status === statusFilter);
    }
    
    setFilteredRecords(filtered);
  }, [searchTerm, statusFilter, maintenanceRecords]);

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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <SearchInput
                placeholder="Pesquisar por equipamento ou notas..."
                className="w-full"
                icon={<Search className="h-4 w-4" />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                  <SelectItem value="Aguardando Peças">Aguardando Peças</SelectItem>
                  <SelectItem value="Concluído">Concluído</SelectItem>
                  <SelectItem value="Cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('');
                }}
              >
                Limpar
              </Button>
              <Button variant="outline" className="flex-1">Histórico</Button>
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
                <TableHead>Status</TableHead>
                <TableHead>Previsão de Conclusão</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
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
                        {record.equipment?.name} {record.equipment?.model}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{record.quantity}</TableCell>
                    <TableCell>{new Date(record.send_date).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell>
                      <Badge className={getStatusBadgeClass(record.status)}>
                        {record.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {record.expected_completion_date ? new Date(record.expected_completion_date).toLocaleDateString('pt-BR') : 'Não definida'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleOpenViewDialog(record)}
                        >
                          Detalhes
                        </Button>
                        {record.status !== 'Concluído' && record.status !== 'Cancelado' && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="bg-green-50 hover:bg-green-100 text-green-600 border-green-200"
                            onClick={() => handleOpenCompleteDialog(record)}
                          >
                            Concluir
                          </Button>
                        )}
                        <MaintenanceActions record={record} onUpdate={loadData} />
                      </div>
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
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => handleSelectChange('status', value as MaintenanceStatus)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                    <SelectItem value="Aguardando Peças">Aguardando Peças</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="expected_completion_date">Previsão de Conclusão</Label>
                <Input 
                  id="expected_completion_date" 
                  type="date"
                  value={formData.expected_completion_date}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <Label htmlFor="notes">Descrição do Problema</Label>
              <Textarea 
                id="notes" 
                placeholder="Descreva o problema do equipamento..." 
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
      
      {/* View Maintenance Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Detalhes da Manutenção</DialogTitle>
            <DialogDescription>
              Informações completas sobre o registro de manutenção
            </DialogDescription>
          </DialogHeader>
          
          {currentRecord && (
            <div className="py-4">
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-zuq-darkblue">
                    {currentRecord.equipment?.name} {currentRecord.equipment?.model}
                  </h3>
                  <Badge className={getStatusBadgeClass(currentRecord.status)}>
                    {currentRecord.status}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Data de Envio</p>
                    <p className="font-medium">{new Date(currentRecord.send_date).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Quantidade</p>
                    <p className="font-medium">{currentRecord.quantity}</p>
                  </div>
                  {currentRecord.expected_completion_date && (
                    <div>
                      <p className="text-sm text-muted-foreground">Previsão de Conclusão</p>
                      <p className="font-medium">{new Date(currentRecord.expected_completion_date).toLocaleDateString('pt-BR')}</p>
                    </div>
                  )}
                  {currentRecord.completion_date && (
                    <div>
                      <p className="text-sm text-muted-foreground">Data de Conclusão</p>
                      <p className="font-medium">{new Date(currentRecord.completion_date).toLocaleDateString('pt-BR')}</p>
                    </div>
                  )}
                </div>
                
                <Tabs defaultValue="problem" className="w-full">
                  <TabsList className="grid grid-cols-2 mb-4">
                    <TabsTrigger value="problem">Problema Reportado</TabsTrigger>
                    <TabsTrigger value="technical">Relatório Técnico</TabsTrigger>
                  </TabsList>
                  <TabsContent value="problem" className="mb-4">
                    <Card>
                      <CardContent className="pt-6">
                        {currentRecord.notes ? (
                          <p className="text-sm">{currentRecord.notes}</p>
                        ) : (
                          <p className="text-sm text-muted-foreground">Nenhuma descrição fornecida</p>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                  <TabsContent value="technical">
                    <Card>
                      <CardContent className="pt-6">
                        {currentRecord.technician_notes ? (
                          <p className="text-sm">{currentRecord.technician_notes}</p>
                        ) : (
                          <p className="text-sm text-muted-foreground">Nenhum relatório técnico disponível</p>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsViewDialogOpen(false)}
              className="w-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Complete Maintenance Dialog */}
      <Dialog open={isCompleteDialogOpen} onOpenChange={setIsCompleteDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Concluir Manutenção</DialogTitle>
            <DialogDescription>
              Informe os detalhes da conclusão da manutenção
            </DialogDescription>
          </DialogHeader>
          
          {currentRecord && (
            <div className="grid gap-4 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">{currentRecord.equipment?.name} {currentRecord.equipment?.model}</h4>
                  <p className="text-sm text-muted-foreground">Quantidade: {currentRecord.quantity}</p>
                </div>
                <Badge className={getStatusBadgeClass(currentRecord.status)}>
                  {currentRecord.status}
                </Badge>
              </div>
              
              <div className="flex flex-col gap-2">
                <Label htmlFor="completion_date">Data de Conclusão</Label>
                <Input 
                  id="completion_date" 
                  type="date"
                  value={completeData.completion_date}
                  onChange={handleCompleteInputChange}
                />
              </div>
              
              <div className="flex flex-col gap-2">
                <Label htmlFor="technician_notes">Relatório Técnico</Label>
                <Textarea 
                  id="technician_notes" 
                  placeholder="Descreva o serviço realizado e as condições do equipamento..." 
                  value={completeData.technician_notes}
                  onChange={handleCompleteInputChange}
                  rows={5}
                />
              </div>
            </div>
          )}
          
          <div className="flex justify-between gap-4">
            <Button 
              variant="outline" 
              onClick={() => setIsCompleteDialogOpen(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button 
              className="bg-green-600 hover:bg-green-700 flex-1"
              onClick={handleComplete}
            >
              <Check className="h-4 w-4 mr-2" /> Marcar como Concluído
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case 'Em Andamento':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'Aguardando Peças':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'Concluído':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'Cancelado':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export default Manutencao;
