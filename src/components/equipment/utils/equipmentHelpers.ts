
export const getCategoryBadgeStyle = (category: string) => {
  switch (category.toLowerCase()) {
    case 'leitora':
      return 'bg-blue-100 text-blue-800';
    case 'sensor':
      return 'bg-green-100 text-green-800';
    case 'rastreador':
      return 'bg-purple-100 text-purple-800';
    case 'acessorio':
    case 'acessório':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const getQualityBadgeStyle = (status: string) => {
  switch (status) {
    case 'Aprovado':
      return 'bg-green-100 text-green-800';
    case 'Reprovado':
      return 'bg-red-100 text-red-800';
    case 'Em Teste':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};
