import { supabase } from "@/integrations/supabase/client";
import * as XLSX from 'xlsx';

export interface ImportRecord {
  [key: string]: any;
  _hasErrors?: boolean;
  _errors?: string[];
  _isDuplicate?: boolean;
  _duplicateInfo?: string[];
  _duplicateId?: string;
  _userApproved?: boolean;
}

export const processImportFile = async (file: File, dataType: string): Promise<ImportRecord[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const data = e.target?.result;
        let jsonData: any[] = [];

        if (file.name.endsWith('.csv')) {
          // Processar CSV
          const text = data as string;
          const lines = text.split('\n').filter(line => line.trim());
          if (lines.length < 2) {
            throw new Error('Arquivo CSV deve ter pelo menos um cabeçalho e uma linha de dados');
          }

          const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
          jsonData = lines.slice(1).map(line => {
            const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
            const record: any = {};
            headers.forEach((header, index) => {
              record[header] = values[index] || '';
            });
            return record;
          });
        } else {
          // Processar Excel
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          jsonData = XLSX.utils.sheet_to_json(worksheet);
        }

        // Validar dados e verificar duplicatas
        const validatedData = await validateImportData(jsonData, dataType);
        resolve(validatedData);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Erro ao ler arquivo'));
    };

    if (file.name.endsWith('.csv')) {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  });
};

const validateImportData = async (data: any[], dataType: string): Promise<ImportRecord[]> => {
  const validators = {
    equipamentos: validateEquipmentData,
    fornecedores: validateSupplierData,
    leitoras: validateReaderData,
    movimentacoes: validateMovementData,
    pedidos: validateOrderData,
  };

  const validator = validators[dataType as keyof typeof validators];
  if (!validator) {
    throw new Error(`Tipo de dados não suportado: ${dataType}`);
  }

  return await validator(data);
};

const validateEquipmentData = async (data: any[]): Promise<ImportRecord[]> => {
  const requiredFields = ['marca', 'modelo', 'categoria'];
  const validCategories = ['Leitora', 'Sensor', 'Rastreador', 'Acessório'];

  // Buscar equipamentos existentes
  const { data: existingEquipment } = await supabase
    .from('equipment')
    .select('id, brand, model, category');

  return data.map(record => {
    const errors: string[] = [];
    const duplicateInfo: string[] = [];
    let isDuplicate = false;
    let duplicateId = '';
    
    // Verificar campos obrigatórios
    requiredFields.forEach(field => {
      if (!record[field] || record[field].toString().trim() === '') {
        errors.push(`Campo ${field} é obrigatório`);
      }
    });

    // Validar categoria
    if (record.categoria && !validCategories.includes(record.categoria)) {
      errors.push(`Categoria deve ser: ${validCategories.join(', ')}`);
    }

    // Validar números
    if (record.preco_medio && isNaN(Number(record.preco_medio))) {
      errors.push('Preço médio deve ser um número');
    }
    if (record.estoque_minimo && isNaN(Number(record.estoque_minimo))) {
      errors.push('Estoque mínimo deve ser um número');
    }
    if (record.estoque_inicial && isNaN(Number(record.estoque_inicial))) {
      errors.push('Estoque inicial deve ser um número');
    }

    // Verificar duplicatas
    if (record.marca && record.modelo && record.categoria && existingEquipment) {
      const duplicate = existingEquipment.find(eq => 
        eq.brand?.toLowerCase() === record.marca.toLowerCase() &&
        eq.model?.toLowerCase() === record.modelo.toLowerCase() &&
        eq.category === record.categoria
      );
      
      if (duplicate) {
        isDuplicate = true;
        duplicateId = duplicate.id;
        duplicateInfo.push(`Equipamento já existe: ${duplicate.brand} ${duplicate.model} (${duplicate.category})`);
      }
    }

    return {
      ...record,
      _hasErrors: errors.length > 0,
      _errors: errors,
      _isDuplicate: isDuplicate,
      _duplicateInfo: duplicateInfo,
      _duplicateId: duplicateId,
      _userApproved: false
    };
  });
};

const validateSupplierData = async (data: any[]): Promise<ImportRecord[]> => {
  const requiredFields = ['nome', 'cnpj'];

  // Buscar fornecedores existentes
  const { data: existingSuppliers } = await supabase
    .from('suppliers')
    .select('id, name, cnpj');

  return data.map(record => {
    const errors: string[] = [];
    const duplicateInfo: string[] = [];
    let isDuplicate = false;
    let duplicateId = '';
    
    // Verificar campos obrigatórios
    requiredFields.forEach(field => {
      if (!record[field] || record[field].toString().trim() === '') {
        errors.push(`Campo ${field} é obrigatório`);
      }
    });

    // Validar CNPJ (básico)
    if (record.cnpj && !/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(record.cnpj)) {
      errors.push('CNPJ deve estar no formato XX.XXX.XXX/XXXX-XX');
    }

    // Validar email
    if (record.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.email)) {
      errors.push('Email deve ter formato válido');
    }

    // Validar dias de entrega
    if (record.dias_entrega_media && isNaN(Number(record.dias_entrega_media))) {
      errors.push('Dias de entrega deve ser um número');
    }

    // Verificar duplicatas
    if (record.cnpj && existingSuppliers) {
      const duplicateByCnpj = existingSuppliers.find(sup => sup.cnpj === record.cnpj);
      const duplicateByName = existingSuppliers.find(sup => 
        sup.name?.toLowerCase() === record.nome.toLowerCase()
      );
      
      if (duplicateByCnpj) {
        isDuplicate = true;
        duplicateId = duplicateByCnpj.id;
        duplicateInfo.push(`CNPJ já cadastrado: ${duplicateByCnpj.cnpj} (${duplicateByCnpj.name})`);
      } else if (duplicateByName) {
        isDuplicate = true;
        duplicateId = duplicateByName.id;
        duplicateInfo.push(`Nome já cadastrado: ${duplicateByName.name}`);
      }
    }

    return {
      ...record,
      _hasErrors: errors.length > 0,
      _errors: errors,
      _isDuplicate: isDuplicate,
      _duplicateInfo: duplicateInfo,
      _duplicateId: duplicateId,
      _userApproved: false
    };
  });
};

const validateReaderData = async (data: any[]): Promise<ImportRecord[]> => {
  const requiredFields = ['codigo', 'equipamento_marca', 'equipamento_modelo'];
  const validStatuses = ['Disponível', 'Em Uso', 'Em Manutenção'];
  const validConditions = ['Novo', 'Recondicionado'];

  // Buscar leitoras existentes
  const { data: existingReaders } = await supabase
    .from('readers')
    .select('id, code');

  return data.map(record => {
    const errors: string[] = [];
    const duplicateInfo: string[] = [];
    let isDuplicate = false;
    let duplicateId = '';
    
    // Verificar campos obrigatórios
    requiredFields.forEach(field => {
      if (!record[field] || record[field].toString().trim() === '') {
        errors.push(`Campo ${field} é obrigatório`);
      }
    });

    // Validar status
    if (record.status && !validStatuses.includes(record.status)) {
      errors.push(`Status deve ser: ${validStatuses.join(', ')}`);
    }

    // Validar condição
    if (record.condicao && !validConditions.includes(record.condicao)) {
      errors.push(`Condição deve ser: ${validConditions.join(', ')}`);
    }

    // Validar data
    if (record.data_aquisicao && !isValidDate(record.data_aquisicao)) {
      errors.push('Data de aquisição deve estar no formato DD/MM/AAAA');
    }

    // Verificar duplicatas
    if (record.codigo && existingReaders) {
      const duplicate = existingReaders.find(reader => reader.code === record.codigo);
      
      if (duplicate) {
        isDuplicate = true;
        duplicateId = duplicate.id;
        duplicateInfo.push(`Código já cadastrado: ${duplicate.code}`);
      }
    }

    return {
      ...record,
      _hasErrors: errors.length > 0,
      _errors: errors,
      _isDuplicate: isDuplicate,
      _duplicateInfo: duplicateInfo,
      _duplicateId: duplicateId,
      _userApproved: false
    };
  });
};

const validateMovementData = async (data: any[]): Promise<ImportRecord[]> => {
  const requiredFields = ['equipamento_marca', 'equipamento_modelo', 'tipo_movimento', 'quantidade'];
  const validMovementTypes = ['Entrada', 'Saída'];

  // Buscar movimentações existentes (últimos 30 dias para performance)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const { data: existingMovements } = await supabase
    .from('inventory_movements')
    .select(`
      id, 
      movement_type, 
      quantity, 
      movement_date,
      equipment!inner(brand, model)
    `)
    .gte('movement_date', thirtyDaysAgo.toISOString());

  return data.map(record => {
    const errors: string[] = [];
    const duplicateInfo: string[] = [];
    let isDuplicate = false;
    let duplicateId = '';
    
    // Verificar campos obrigatórios
    requiredFields.forEach(field => {
      if (!record[field] || record[field].toString().trim() === '') {
        errors.push(`Campo ${field} é obrigatório`);
      }
    });

    // Validar tipo de movimento
    if (record.tipo_movimento && !validMovementTypes.includes(record.tipo_movimento)) {
      errors.push(`Tipo de movimento deve ser: ${validMovementTypes.join(', ')}`);
    }

    // Validar quantidade
    if (record.quantidade && (isNaN(Number(record.quantidade)) || Number(record.quantidade) <= 0)) {
      errors.push('Quantidade deve ser um número positivo');
    }

    // Validar data
    if (record.data && !isValidDate(record.data)) {
      errors.push('Data deve estar no formato DD/MM/AAAA');
    }

    // Verificar duplicatas
    if (record.equipamento_marca && record.equipamento_modelo && record.tipo_movimento && 
        record.quantidade && record.data && existingMovements) {
      
      const recordDate = convertDateString(record.data);
      const duplicate = existingMovements.find(mov => 
        mov.equipment?.brand?.toLowerCase() === record.equipamento_marca.toLowerCase() &&
        mov.equipment?.model?.toLowerCase() === record.equipamento_modelo.toLowerCase() &&
        mov.movement_type === record.tipo_movimento &&
        mov.quantity === Number(record.quantidade) &&
        mov.movement_date?.split('T')[0] === recordDate.split('T')[0]
      );
      
      if (duplicate) {
        isDuplicate = true;
        duplicateId = duplicate.id;
        duplicateInfo.push(`Movimentação similar já existe para esta data`);
      }
    }

    return {
      ...record,
      _hasErrors: errors.length > 0,
      _errors: errors,
      _isDuplicate: isDuplicate,
      _duplicateInfo: duplicateInfo,
      _duplicateId: duplicateId,
      _userApproved: false
    };
  });
};

const validateOrderData = async (data: any[]): Promise<ImportRecord[]> => {
  const requiredFields = ['equipamento_marca', 'equipamento_modelo', 'fornecedor_nome', 'quantidade'];

  // Buscar pedidos existentes (últimos 90 dias)
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  
  const { data: existingOrders } = await supabase
    .from('orders')
    .select(`
      id,
      quantity,
      expected_arrival_date,
      equipment!inner(brand, model),
      suppliers!inner(name)
    `)
    .gte('created_at', ninetyDaysAgo.toISOString());

  return data.map(record => {
    const errors: string[] = [];
    const duplicateInfo: string[] = [];
    let isDuplicate = false;
    let duplicateId = '';
    
    // Verificar campos obrigatórios
    requiredFields.forEach(field => {
      if (!record[field] || record[field].toString().trim() === '') {
        errors.push(`Campo ${field} é obrigatório`);
      }
    });

    // Validar quantidade
    if (record.quantidade && (isNaN(Number(record.quantidade)) || Number(record.quantidade) <= 0)) {
      errors.push('Quantidade deve ser um número positivo');
    }

    // Validar data
    if (record.data_chegada_esperada && !isValidDate(record.data_chegada_esperada)) {
      errors.push('Data de chegada deve estar no formato DD/MM/AAAA');
    }

    // Verificar duplicatas
    if (record.equipamento_marca && record.equipamento_modelo && 
        record.fornecedor_nome && record.data_chegada_esperada && existingOrders) {
      
      const recordDate = convertDateString(record.data_chegada_esperada);
      const duplicate = existingOrders.find(order => 
        order.equipment?.brand?.toLowerCase() === record.equipamento_marca.toLowerCase() &&
        order.equipment?.model?.toLowerCase() === record.equipamento_modelo.toLowerCase() &&
        order.suppliers?.name?.toLowerCase() === record.fornecedor_nome.toLowerCase() &&
        order.expected_arrival_date === recordDate.split('T')[0]
      );
      
      if (duplicate) {
        isDuplicate = true;
        duplicateId = duplicate.id;
        duplicateInfo.push(`Pedido similar já existe para esta data`);
      }
    }

    return {
      ...record,
      _hasErrors: errors.length > 0,
      _errors: errors,
      _isDuplicate: isDuplicate,
      _duplicateInfo: duplicateInfo,
      _duplicateId: duplicateId,
      _userApproved: false
    };
  });
};

const isValidDate = (dateString: string): boolean => {
  const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
  if (!dateRegex.test(dateString)) return false;
  
  const [day, month, year] = dateString.split('/').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getDate() === day && date.getMonth() === month - 1 && date.getFullYear() === year;
};

export const saveImportData = async (dataType: string, data: ImportRecord[], filename: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  // Filtrar apenas registros aprovados (válidos ou duplicatas aprovadas pelo usuário)
  const approvedData = data.filter(record => 
    !record._hasErrors && (!record._isDuplicate || record._userApproved)
  );

  // Registrar no histórico
  const { data: historyRecord, error: historyError } = await supabase
    .from('import_history')
    .insert({
      user_id: user.id,
      data_type: dataType,
      original_filename: filename,
      total_records: data.length,
      processed_records: 0,
      failed_records: data.length - approvedData.length,
      status: 'pending'
    })
    .select()
    .single();

  if (historyError) throw historyError;

  try {
    // Salvar dados específicos baseado no tipo
    await saveDataByType(dataType, approvedData, user.id);

    // Atualizar histórico como sucesso
    await supabase
      .from('import_history')
      .update({
        processed_records: approvedData.length,
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', historyRecord.id);

  } catch (error) {
    // Atualizar histórico como erro
    await supabase
      .from('import_history')
      .update({
        failed_records: data.length,
        status: 'error',
        error_details: [{ message: (error as Error).message }],
        completed_at: new Date().toISOString()
      })
      .eq('id', historyRecord.id);

    throw error;
  }
};

const saveDataByType = async (dataType: string, data: ImportRecord[], userId: string) => {
  switch (dataType) {
    case 'equipamentos':
      await saveEquipmentData(data, userId);
      break;
    case 'fornecedores':
      await saveSupplierData(data, userId);
      break;
    case 'leitoras':
      await saveReaderData(data, userId);
      break;
    case 'movimentacoes':
      await saveMovementData(data, userId);
      break;
    case 'pedidos':
      await saveOrderData(data, userId);
      break;
    default:
      throw new Error(`Tipo de dados não suportado: ${dataType}`);
  }
};

const saveEquipmentData = async (data: ImportRecord[], userId: string) => {
  for (const record of data) {
    let supplierId = null;
    
    if (record.fornecedor_nome) {
      const { data: supplier } = await supabase
        .from('suppliers')
        .select('id')
        .eq('name', record.fornecedor_nome)
        .single();
      supplierId = supplier?.id;
    }

    await supabase.from('equipment').insert({
      brand: record.marca,
      model: record.modelo,
      category: record.categoria,
      average_price: record.preco_medio ? Number(record.preco_medio) : null,
      min_stock: record.estoque_minimo ? Number(record.estoque_minimo) : null,
      initial_stock: record.estoque_inicial ? Number(record.estoque_inicial) : null,
      supplier_id: supplierId,
      created_by: userId
    });
  }
};

const saveSupplierData = async (data: ImportRecord[], userId: string) => {
  for (const record of data) {
    await supabase.from('suppliers').insert({
      name: record.nome,
      cnpj: record.cnpj,
      contact_name: record.contato,
      phone: record.telefone,
      email: record.email,
      address: record.endereco,
      average_delivery_days: record.dias_entrega_media ? Number(record.dias_entrega_media) : null,
      created_by: userId
    });
  }
};

const saveReaderData = async (data: ImportRecord[], userId: string) => {
  for (const record of data) {
    // Buscar equipamento
    const { data: equipment } = await supabase
      .from('equipment')
      .select('id')
      .eq('brand', record.equipamento_marca)
      .eq('model', record.equipamento_modelo)
      .single();

    if (!equipment) {
      throw new Error(`Equipamento não encontrado: ${record.equipamento_marca} ${record.equipamento_modelo}`);
    }

    const acquisitionDate = record.data_aquisicao ? 
      convertDateString(record.data_aquisicao) : null;

    await supabase.from('readers').insert({
      code: record.codigo,
      equipment_id: equipment.id,
      status: record.status || 'Disponível',
      condition: record.condicao || 'Novo',
      acquisition_date: acquisitionDate,
      created_by: userId
    });
  }
};

const saveMovementData = async (data: ImportRecord[], userId: string) => {
  for (const record of data) {
    // Buscar equipamento
    const { data: equipment } = await supabase
      .from('equipment')
      .select('id')
      .eq('brand', record.equipamento_marca)
      .eq('model', record.equipamento_modelo)
      .single();

    if (!equipment) {
      throw new Error(`Equipamento não encontrado: ${record.equipamento_marca} ${record.equipamento_modelo}`);
    }

    const movementDate = record.data ? 
      convertDateString(record.data) : new Date().toISOString();

    await supabase.from('inventory_movements').insert({
      equipment_id: equipment.id,
      movement_type: record.tipo_movimento,
      quantity: Number(record.quantidade),
      movement_date: movementDate,
      notes: record.observacoes,
      created_by: userId
    });
  }
};

const saveOrderData = async (data: ImportRecord[], userId: string) => {
  for (const record of data) {
    // Buscar equipamento
    const { data: equipment } = await supabase
      .from('equipment')
      .select('id')
      .eq('brand', record.equipamento_marca)
      .eq('model', record.equipamento_modelo)
      .single();

    if (!equipment) {
      throw new Error(`Equipamento não encontrado: ${record.equipamento_marca} ${record.equipamento_modelo}`);
    }

    // Buscar fornecedor
    const { data: supplier } = await supabase
      .from('suppliers')
      .select('id')
      .eq('name', record.fornecedor_nome)
      .single();

    if (!supplier) {
      throw new Error(`Fornecedor não encontrado: ${record.fornecedor_nome}`);
    }

    const expectedDate = record.data_chegada_esperada ? 
      convertDateString(record.data_chegada_esperada) : null;

    await supabase.from('orders').insert({
      equipment_id: equipment.id,
      supplier_id: supplier.id,
      quantity: Number(record.quantidade),
      expected_arrival_date: expectedDate,
      invoice_number: record.nota_fiscal,
      notes: record.observacoes,
      created_by: userId
    });
  }
};

const convertDateString = (dateString: string): string => {
  const [day, month, year] = dateString.split('/');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

export const getImportHistory = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { data, error } = await supabase
    .from('import_history')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const generateTemplate = async (dataType: string) => {
  const templates = {
    equipamentos: [
      ['marca', 'modelo', 'categoria', 'preco_medio', 'estoque_minimo', 'estoque_inicial', 'fornecedor_nome'],
      ['Zebra', 'MC3300', 'Leitora', '2500.00', '5', '10', 'Fornecedor Exemplo']
    ],
    fornecedores: [
      ['nome', 'cnpj', 'contato', 'telefone', 'email', 'endereco', 'dias_entrega_media'],
      ['Fornecedor Exemplo', '12.345.678/0001-90', 'João Silva', '(11) 99999-9999', 'contato@exemplo.com', 'Rua Exemplo, 123', '15']
    ],
    leitoras: [
      ['codigo', 'equipamento_marca', 'equipamento_modelo', 'status', 'condicao', 'data_aquisicao'],
      ['LT001', 'Zebra', 'MC3300', 'Disponível', 'Novo', '01/01/2024']
    ],
    movimentacoes: [
      ['equipamento_marca', 'equipamento_modelo', 'tipo_movimento', 'quantidade', 'data', 'observacoes'],
      ['Zebra', 'MC3300', 'Entrada', '10', '01/01/2024', 'Compra inicial']
    ],
    pedidos: [
      ['equipamento_marca', 'equipamento_modelo', 'fornecedor_nome', 'quantidade', 'data_chegada_esperada', 'nota_fiscal', 'observacoes'],
      ['Zebra', 'MC3300', 'Fornecedor Exemplo', '5', '15/01/2024', 'NF123456', 'Pedido urgente']
    ]
  };

  const template = templates[dataType as keyof typeof templates];
  if (!template) {
    throw new Error('Template não encontrado');
  }

  // Criar arquivo Excel
  const ws = XLSX.utils.aoa_to_sheet(template);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template');
  
  // Download do arquivo
  XLSX.writeFile(wb, `template_${dataType}.xlsx`);
};

export const downloadImportReport = async (importId: string, filename: string) => {
  try {
    // Buscar os detalhes da importação
    const { data: importData, error } = await supabase
      .from('import_history')
      .select('*')
      .eq('id', importId)
      .single();

    if (error) {
      throw new Error('Erro ao buscar dados da importação');
    }

    // Gerar relatório em formato CSV
    const reportContent = generateImportReport(importData);
    
    // Criar e baixar o arquivo
    const blob = new Blob([reportContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio-importacao-${filename}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Erro ao baixar relatório:', error);
    throw error;
  }
};

const generateImportReport = (importData: any) => {
  const headers = [
    'Arquivo',
    'Tipo de Dados',
    'Status',
    'Total de Registros',
    'Registros Processados',
    'Registros com Erro',
    'Data de Criação',
    'Data de Conclusão'
  ].join(',');

  const dataTypeLabels: { [key: string]: string } = {
    equipamentos: 'Equipamentos',
    fornecedores: 'Fornecedores',
    leitoras: 'Leitoras',
    movimentacoes: 'Movimentações',
    pedidos: 'Pedidos'
  };

  const statusLabels: { [key: string]: string } = {
    completed: 'Concluído',
    pending: 'Pendente',
    error: 'Erro'
  };

  const row = [
    `"${importData.original_filename}"`,
    `"${dataTypeLabels[importData.data_type] || importData.data_type}"`,
    `"${statusLabels[importData.status] || importData.status}"`,
    importData.total_records,
    importData.processed_records,
    importData.failed_records,
    `"${new Date(importData.created_at).toLocaleString('pt-BR')}"`,
    importData.completed_at ? `"${new Date(importData.completed_at).toLocaleString('pt-BR')}"` : '""'
  ].join(',');

  return `${headers}\n${row}`;
};
