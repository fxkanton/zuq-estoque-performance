
import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Database, Plus, Search } from "lucide-react";
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
import { 
  Select, 
  SelectTrigger, 
  SelectValue, 
  SelectContent, 
  SelectItem 
} from "@/components/ui/select";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { 
  fetchReaders, 
  createReader, 
  updateReader, 
  deleteReader,
  ReaderWithEquipment, 
  EquipmentCondition, 
  EquipmentStatus 
} from "@/services/readerService";
import { fetchEquipment, Equipment } from "@/services/equipmentService";
import { supabase } from "@/integrations/supabase/client";

const Leitoras = () => {
  const [readers, setReaders] = useState<ReaderWithEquipment[]>([]);
  const [filteredReaders, setFilteredReaders] = useState<ReaderWithEquipment[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Form state
  const [currentReader, setCurrentReader] = useState<ReaderWithEquipment | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    equipment_id: '',
    status: 'Disponível' as EquipmentStatus,
    condition: 'Novo' as EquipmentCondition,
    acquisition_date: new Date().toISOString().split('T')[0]
  });

  const loadData = async () => {
    try {
      const readersData = await fetchReaders();
      setReaders(readersData);
      setFilteredReaders(readersData);
      
      // Only load equipment that are leitoras
      const equipmentData = await fetchEquipment();
      setEquipment(equipmentData.filter(item => item.category === 'Leitora'));
    } catch (error) {
      console.error("Error loading readers data:", error);
    }
  };

  useEffect(() => {
    loadData();

    // Subscribe to realtime updates
    const readersChannel = supabase
      .channel('public:readers')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'readers'
      }, () => {
        loadData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(readersChannel);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
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
      code: '',
      equipment_id: '',
      status: 'Disponível',
      condition: 'Novo',
      acquisition_date: new Date().toISOString().split('T')[0]
    });
    setCurrentReader(null);
  };

  const handleOpenAddDialog = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };

  const handleOpenEditDialog = (reader: ReaderWithEquipment) => {
    setCurrentReader(reader);
    setFormData({
      code: reader.code,
      equipment_id: reader.equipment_id,
      status: reader.status,
      condition: reader.condition,
      acquisition_date: reader.acquisition_date || new Date().toISOString().split('T')[0]
    });
    setIsEditDialogOpen(true);
  };

  const handleOpenDeleteDialog = (reader: ReaderWithEquipment) => {
    setCurrentReader(reader);
    setIsDeleteDialogOpen(true);
  };

  const handleSaveReader = async () => {
    try {
      await createReader(formData);
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error creating reader:", error);
    }
  };

  const handleUpdateReader = async () => {
    if (!currentReader) return;
    
    try {
      await updateReader(currentReader.id, formData);
      setIsEditDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error updating reader:", error);
    }
  };

  const handleDeleteReader = async () => {
    if (!currentReader) return;
    
    try {
      await deleteReader(currentReader.id);
      setIsDeleteDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error deleting reader:", error);
    }
  };

  // Filter readers based on search term and status
  useEffect(() => {
    let filtered = readers;
    
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.code.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item.equipment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.equipment.model.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }
    
    setFilteredReaders(filtered);
  }, [searchTerm, statusFilter, readers]);

  return (
    <MainLayout title="Controle de Leitoras">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-zuq-darkblue">Controle Individual de Leitoras</h1>
        <Button 
          className="bg-zuq-blue hover:bg-zuq-blue/80"
          onClick={handleOpenAddDialog}
        >
          <Plus className="h-4 w-4 mr-2" /> Cadastrar Nova Leitora
        </Button>
      </div>
      
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle>Filtrar Leitoras</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <SearchInput
                placeholder="Pesquisar por código ou modelo..."
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
                  <SelectItem value="Disponível">Disponível</SelectItem>
                  <SelectItem value="Em Uso">Em Uso</SelectItem>
                  <SelectItem value="Em Manutenção">Em Manutenção</SelectItem>
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
              <Button className="bg-zuq-blue hover:bg-zuq-blue/80 flex-1">Gerar Relatório</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Equipamento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Condição</TableHead>
                <TableHead>Data de Aquisição</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReaders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    Nenhuma leitora encontrada
                  </TableCell>
                </TableRow>
              ) : (
                filteredReaders.map((reader) => (
                  <TableRow key={reader.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="bg-zuq-gray/30 p-2 rounded-md">
                          <Database className="h-4 w-4 text-zuq-blue" />
                        </div>
                        {reader.code}
                      </div>
                    </TableCell>
                    <TableCell>{reader.equipment.name} {reader.equipment.model}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeStyle(reader.status)}`}>
                        {reader.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${getConditionBadgeStyle(reader.condition)}`}>
                        {reader.condition}
                      </span>
                    </TableCell>
                    <TableCell>
                      {reader.acquisition_date ? new Date(reader.acquisition_date).toLocaleDateString('pt-BR') : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleOpenEditDialog(reader)}
                        >
                          Editar
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-red-500"
                          onClick={() => handleOpenDeleteDialog(reader)}
                        >
                          Excluir
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Reader Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Cadastrar Nova Leitora</DialogTitle>
            <DialogDescription>
              Informe os detalhes da leitora para cadastro
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="code">Código da Leitora</Label>
              <Input 
                id="code" 
                placeholder="Insira o código único" 
                value={formData.code}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <Label htmlFor="equipment_id">Modelo de Equipamento</Label>
              <Select 
                value={formData.equipment_id} 
                onValueChange={(value) => handleSelectChange('equipment_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o modelo" />
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
            
            <div className="flex flex-col gap-2">
              <Label htmlFor="acquisition_date">Data de Aquisição</Label>
              <Input 
                id="acquisition_date" 
                type="date" 
                value={formData.acquisition_date}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => handleSelectChange('status', value as EquipmentStatus)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Disponível">Disponível</SelectItem>
                    <SelectItem value="Em Uso">Em Uso</SelectItem>
                    <SelectItem value="Em Manutenção">Em Manutenção</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="condition">Condição</Label>
                <Select 
                  value={formData.condition} 
                  onValueChange={(value) => handleSelectChange('condition', value as EquipmentCondition)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Condição" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Novo">Novo</SelectItem>
                    <SelectItem value="Recondicionado">Recondicionado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancelar</Button>
            <Button className="bg-zuq-blue hover:bg-zuq-blue/80" onClick={handleSaveReader}>Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Reader Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Leitora</DialogTitle>
            <DialogDescription>
              Atualize as informações da leitora
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-code">Código da Leitora</Label>
              <Input 
                id="code" 
                placeholder="Insira o código único" 
                value={formData.code}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-equipment">Modelo de Equipamento</Label>
              <Select 
                value={formData.equipment_id} 
                onValueChange={(value) => handleSelectChange('equipment_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o modelo" />
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
            
            <div className="flex flex-col gap-2">
              <Label htmlFor="acquisition_date">Data de Aquisição</Label>
              <Input 
                id="acquisition_date" 
                type="date" 
                value={formData.acquisition_date}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => handleSelectChange('status', value as EquipmentStatus)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Disponível">Disponível</SelectItem>
                    <SelectItem value="Em Uso">Em Uso</SelectItem>
                    <SelectItem value="Em Manutenção">Em Manutenção</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="edit-condition">Condição</Label>
                <Select 
                  value={formData.condition} 
                  onValueChange={(value) => handleSelectChange('condition', value as EquipmentCondition)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Condição" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Novo">Novo</SelectItem>
                    <SelectItem value="Recondicionado">Recondicionado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button>
            <Button className="bg-zuq-blue hover:bg-zuq-blue/80" onClick={handleUpdateReader}>Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta leitora? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {currentReader && (
              <div className="border-l-4 border-red-500 pl-4">
                <p className="font-medium">Código: {currentReader.code}</p>
                <p className="text-sm text-muted-foreground">
                  {currentReader.equipment.name} {currentReader.equipment.model}
                </p>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDeleteReader}>Excluir</Button>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

const getStatusBadgeStyle = (status: string) => {
  switch (status) {
    case 'Disponível':
      return 'bg-green-100 text-green-800';
    case 'Em Uso':
      return 'bg-blue-100 text-blue-800';
    case 'Em Manutenção':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getConditionBadgeStyle = (condition: string) => {
  switch (condition) {
    case 'Novo':
      return 'bg-purple-100 text-purple-800';
    case 'Recondicionado':
      return 'bg-amber-100 text-amber-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default Leitoras;
