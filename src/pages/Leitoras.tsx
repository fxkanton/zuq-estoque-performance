import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Plus, Search, Package2, FileText } from "lucide-react";
import { fetchReaders, ReaderWithEquipment } from "@/services/readerService";
import { useAuth } from "@/contexts/AuthContext";
import { isMemberOrManager } from "@/utils/permissions";
import { DataExportDialog } from "@/components/export/DataExportDialog";

const Leitoras = () => {
  const { profile } = useAuth();
  const [readers, setReaders] = useState<ReaderWithEquipment[]>([]);
  const [filteredReaders, setFilteredReaders] = useState<ReaderWithEquipment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

  const loadReaders = async () => {
    try {
      const data = await fetchReaders();
      setReaders(data);
      setFilteredReaders(data);
    } catch (error) {
      console.error("Error loading readers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReaders();
  }, []);

  useEffect(() => {
    const filtered = readers.filter(reader =>
      reader.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (reader.equipment?.brand && reader.equipment.brand.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (reader.equipment?.model && reader.equipment.model.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredReaders(filtered);
  }, [searchTerm, readers]);

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'Disponível':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'Em Uso':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Manutenção':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Indisponível':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getConditionBadgeStyle = (condition: string) => {
    switch (condition) {
      case 'Novo':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'Usado':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Danificado':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (!isMemberOrManager(profile?.role)) {
    return (
      <MainLayout title="Leitoras">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Acesso restrito a membros e gerentes.</p>
        </div>
      </MainLayout>
    );
  }

  if (isLoading) {
    return (
      <MainLayout title="Leitoras">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Carregando leitoras...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Leitoras">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl font-bold text-zuq-darkblue">Leitoras</h1>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Button className="bg-zuq-blue hover:bg-zuq-blue/80">
              <Plus className="h-4 w-4 mr-2" /> Nova Leitora
            </Button>
            <Button 
              variant="outline"
              onClick={() => setIsExportDialogOpen(true)}
            >
              <FileText className="h-4 w-4 mr-2" /> Exportar Dados
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filtrar Leitoras</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Pesquisar por código, marca ou modelo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Equipamento</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Marca/Modelo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Condição</TableHead>
                  <TableHead>Data de Aquisição</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReaders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10">
                      <Package2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Nenhuma leitora encontrada</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReaders.map((reader) => (
                    <TableRow key={reader.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {reader.equipment?.image_url ? (
                            <img 
                              src={reader.equipment.image_url} 
                              alt={`${reader.equipment.brand} ${reader.equipment.model}`}
                              className="h-12 w-12 object-cover rounded-md"
                            />
                          ) : (
                            <div className="bg-gray-100 p-2 h-12 w-12 flex items-center justify-center rounded-md">
                              <Package2 className="h-6 w-6 text-zuq-blue" />
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{reader.code}</TableCell>
                      <TableCell>
                        {reader.equipment ? 
                          `${reader.equipment.brand} ${reader.equipment.model}` : 
                          'Equipamento não encontrado'
                        }
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={getStatusBadgeStyle(reader.status || 'Disponível')}
                        >
                          {reader.status || 'Disponível'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={getConditionBadgeStyle(reader.condition || 'Novo')}
                        >
                          {reader.condition || 'Novo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {reader.acquisition_date ? 
                          new Date(reader.acquisition_date).toLocaleDateString('pt-BR') : 
                          'N/A'
                        }
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            Ver
                          </Button>
                          <Button variant="outline" size="sm">
                            Editar
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

        <DataExportDialog
          open={isExportDialogOpen}
          onOpenChange={setIsExportDialogOpen}
        />
      </div>
    </MainLayout>
  );
};

export default Leitoras;
