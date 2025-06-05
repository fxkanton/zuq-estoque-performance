
export const hasAccess = (userRole: string | undefined, requiredLevel: 'membro' | 'gerente' = 'membro'): boolean => {
  if (!userRole) return false;
  
  const roleHierarchy: Record<string, number> = {
    'intruso': 0,
    'membro': 1,
    'gerente': 2
  };
  
  const userLevel = roleHierarchy[userRole] || 0;
  const requiredRoleLevel = roleHierarchy[requiredLevel] || 0;
  
  return userLevel >= requiredRoleLevel;
};

export const isMemberOrManager = (userRole: string | undefined): boolean => {
  return hasAccess(userRole, 'membro');
};

export const isManager = (userRole: string | undefined): boolean => {
  return userRole === 'gerente';
};
