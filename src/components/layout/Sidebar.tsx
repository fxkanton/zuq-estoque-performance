
import { useState, useRef, useEffect, memo, useMemo } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { 
  Package2, 
  Users, 
  ArrowDownUp, 
  Database, 
  ClipboardCheck, 
  Settings, 
  Package, 
  BarChart3,
  Kanban,
  Upload
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

// Component definition without memo wrapper first
const AppSidebarComponent = () => {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const isCollapsed = state === "collapsed";
  const logoFullRef = useRef<HTMLImageElement>(null);
  const logoSmallRef = useRef<HTMLImageElement>(null);
  const location = useLocation();

  // Novo logo para ambas versões (full e small)
  const logoUrls = useMemo(() => ({
    full: "/lovable-uploads/b796a5d7-8133-46ff-9b97-024bf392cec8.png",
    small: "/lovable-uploads/b796a5d7-8133-46ff-9b97-024bf392cec8.png"
  }), []);

  // Preload apenas uma vez
  useEffect(() => {
    const logoFullImg = new Image();
    logoFullImg.src = logoUrls.full;
    const logoSmallImg = new Image();
    logoSmallImg.src = logoUrls.small;
  }, [logoUrls]);

  // Sempre que a rota mudar, fecha o menu no mobile
  useEffect(() => {
    if (isMobile) setOpenMobile(false);
  }, [location, isMobile, setOpenMobile]);

  // Handler para navegação nos itens do menu - fecha sidebar no mobile
  const handleNavClick = () => {
    if (isMobile) setOpenMobile(false);
  };

  // Memoizar o logo para evitar re-renderização
  const logoElement = useMemo(() => {
    if (isCollapsed) {
      return (
        <img 
          key="logo-small"
          ref={logoSmallRef}
          src={logoUrls.small}
          alt="ZUQ Performance" 
          className="w-8 h-8"
          loading="eager"
          style={{ objectFit: "contain" }}
        />
      );
    } else {
      return (
        <img 
          key="logo-full"
          ref={logoFullRef}
          src={logoUrls.full}
          alt="ZUQ Performance" 
          className="w-32"
          loading="eager"
          style={{ objectFit: "contain" }}
        />
      );
    }
  }, [isCollapsed, logoUrls]);

  return (
    <Sidebar
      className={`transition-all duration-300 ease-in-out ${isCollapsed ? "w-14" : "w-60"} bg-white/95 border-r border-gray-200 shadow-sm`}
      collapsible="icon"
    >
      <SidebarContent>
        <div className="flex items-center justify-between my-6 px-2 md:px-6">
          {logoElement}
          <SidebarTrigger className="ml-auto md:hidden"/>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-gray-400 font-medium text-xs uppercase tracking-wider">
            {!isCollapsed && "Principal"}
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              <NavItem
                to="/dashboard"
                icon={<BarChart3 className="h-5 w-5" />}
                label="Dashboard"
                isCollapsed={isCollapsed}
                onClick={handleNavClick}
              />
              <NavItem
                to="/equipamentos"
                icon={<Package2 className="h-5 w-5" />}
                label="Equipamentos"
                isCollapsed={isCollapsed}
                onClick={handleNavClick}
              />
              <NavItem
                to="/fornecedores"
                icon={<Users className="h-5 w-5" />}
                label="Fornecedores"
                isCollapsed={isCollapsed}
                onClick={handleNavClick}
              />
              <NavItem
                to="/movimentacoes"
                icon={<ArrowDownUp className="h-5 w-5" />}
                label="Entradas e Saídas"
                isCollapsed={isCollapsed}
                onClick={handleNavClick}
              />
              <NavItem
                to="/leitoras"
                icon={<Database className="h-5 w-5" />}
                label="Leitoras"
                isCollapsed={isCollapsed}
                onClick={handleNavClick}
              />
              <NavItem
                to="/pedidos"
                icon={<ClipboardCheck className="h-5 w-5" />}
                label="Pedidos"
                isCollapsed={isCollapsed}
                onClick={handleNavClick}
              />
              <NavItem
                to="/fluxo-tarefas"
                icon={<Kanban className="h-5 w-5" />}
                label="Fluxo de Tarefas"
                isCollapsed={isCollapsed}
                onClick={handleNavClick}
              />
              <NavItem
                to="/importacao"
                icon={<Upload className="h-5 w-5" />}
                label="Importar Dados"
                isCollapsed={isCollapsed}
                onClick={handleNavClick}
              />
              <NavItem
                to="/manutencao"
                icon={<Settings className="h-5 w-5" />}
                label="Manutenção"
                isCollapsed={isCollapsed}
                onClick={handleNavClick}
              />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

// Custom hover for menu items: leve azul #00B3DA de fundo, borda no hover
type NavItemProps = {
  to: string;
  icon: React.ReactNode;
  label: string;
  isCollapsed: boolean;
  onClick?: () => void;
};

const NavItem = memo(({ to, icon, label, isCollapsed, onClick }: NavItemProps) => {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild>
        <NavLink
          to={to}
          className={({ isActive }) =>
            // Estilo base + active + hover customizado
            `flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 border-2 
             ${
               isActive
                 ? "bg-[#00B3DA1A] border-[#00B3DA] text-[#00B3DA] font-semibold shadow-sm"
                 : "hover:bg-[#00B3DA1A] hover:border-[#00B3DA] hover:text-[#00B3DA] border-transparent text-gray-700"
             }
            `
          }
          end
          onClick={onClick}
          style={{
            // Efeito para círculo sutil na borda do ícone ao hover também
            alignItems: "center",
            gap: isCollapsed ? 0 : '0.75rem',
          }}
        >
          <div
            className={`flex items-center justify-center ${isCollapsed ? 'w-full' : ''}`}
          >
            {icon}
          </div>
          {!isCollapsed && <span className="ml-3 font-medium">{label}</span>}
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
});

NavItem.displayName = "NavItem";

export { AppSidebar };
