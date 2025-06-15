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

  // Memoizar as URLs da nova logo (uma única imagem colorida agora)
  const logoUrls = useMemo(() => ({
    full: "/lovable-uploads/c260e98d-cc0b-4d2c-917e-8cad1270954e.png",
    small: "/lovable-uploads/c260e98d-cc0b-4d2c-917e-8cad1270954e.png"
  }), []);

  useEffect(() => {
    const logoFullImg = new Image();
    logoFullImg.src = logoUrls.full;
    const logoSmallImg = new Image();
    logoSmallImg.src = logoUrls.small;
  }, [logoUrls]);

  useEffect(() => {
    if (isMobile) setOpenMobile(false);
  }, [location, isMobile, setOpenMobile]);

  const handleNavClick = () => {
    if (isMobile) setOpenMobile(false);
  };

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
        />
      );
    } else {
      return (
        <img 
          key="logo-full"
          ref={logoFullRef}
          src={logoUrls.full}
          alt="ZUQ Performance" 
          className="w-36"
          loading="eager"
        />
      );
    }
  }, [isCollapsed, logoUrls]);

  return (
    <Sidebar
      className={`transition-all duration-300 ease-in-out ${isCollapsed ? "w-14" : "w-60"} bg-white border-sidebar-border`}
      collapsible="icon"
    >
      <SidebarContent className="bg-white">
        {/* Trigger também dentro do sidebar (visível só no mobile/mini) */}
        <div className="flex items-center justify-between my-6 px-2 md:px-6">
          {logoElement}
          {/* SidebarTrigger sempre visível em mobile/mini para expandir/recolher */}
          <SidebarTrigger className="ml-auto md:hidden" />
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[#1F2A47]/80 font-medium text-xs uppercase tracking-wider">
            {!isCollapsed && "Principal"}
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              <NavItem
                to="/dashboard"
                icon={<BarChart3 className="h-5 w-5 text-[#00B3DA] transition-colors duration-150" />}
                label="Dashboard"
                isCollapsed={isCollapsed}
                onClick={handleNavClick}
              />
              <NavItem
                to="/equipamentos"
                icon={<Package2 className="h-5 w-5 text-[#00B3DA] transition-colors duration-150" />}
                label="Equipamentos"
                isCollapsed={isCollapsed}
                onClick={handleNavClick}
              />
              <NavItem
                to="/fornecedores"
                icon={<Users className="h-5 w-5 text-[#00B3DA] transition-colors duration-150" />}
                label="Fornecedores"
                isCollapsed={isCollapsed}
                onClick={handleNavClick}
              />
              <NavItem
                to="/movimentacoes"
                icon={<ArrowDownUp className="h-5 w-5 text-[#00B3DA] transition-colors duration-150" />}
                label="Entradas e Saídas"
                isCollapsed={isCollapsed}
                onClick={handleNavClick}
              />
              <NavItem
                to="/leitoras"
                icon={<Database className="h-5 w-5 text-[#00B3DA] transition-colors duration-150" />}
                label="Leitoras"
                isCollapsed={isCollapsed}
                onClick={handleNavClick}
              />
              <NavItem
                to="/pedidos"
                icon={<ClipboardCheck className="h-5 w-5 text-[#00B3DA] transition-colors duration-150" />}
                label="Pedidos"
                isCollapsed={isCollapsed}
                onClick={handleNavClick}
              />
              <NavItem
                to="/fluxo-tarefas"
                icon={<Kanban className="h-5 w-5 text-[#00B3DA] transition-colors duration-150" />}
                label="Fluxo de Tarefas"
                isCollapsed={isCollapsed}
                onClick={handleNavClick}
              />
              <NavItem
                to="/importacao"
                icon={<Upload className="h-5 w-5 text-[#00B3DA] transition-colors duration-150" />}
                label="Importar Dados"
                isCollapsed={isCollapsed}
                onClick={handleNavClick}
              />
              <NavItem
                to="/manutencao"
                icon={<Settings className="h-5 w-5 text-[#00B3DA] transition-colors duration-150" />}
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

// Apply memo wrapper and set display name
const AppSidebar = memo(AppSidebarComponent);
AppSidebar.displayName = "AppSidebar";

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
            `flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 group ${
              isActive
                ? "bg-[#eafeff] text-[#00B3DA] shadow-sm"
                : "hover:bg-[#eafeff] hover:text-[#00B3DA] text-[#1F2A47]"
            }`
          }
          end
          onClick={onClick}
        >
          <div className="flex items-center">
            {/* Ícone: muda para azul turquesa quando ativo ou hover */}
            <span className="transition-colors duration-200 group-hover:text-[#00B3DA] group-active:text-[#00B3DA]">
              {icon}
            </span>
            {!isCollapsed && <span className="ml-3 font-medium">{label}</span>}
          </div>
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
});

NavItem.displayName = "NavItem";

export { AppSidebar };
