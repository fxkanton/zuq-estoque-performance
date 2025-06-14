import { useState, useRef, useEffect } from "react";
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
  Kanban
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

export function AppSidebar() {
  const { state, isMobile, setOpenMobile } = useSidebar(); // novo
  const isCollapsed = state === "collapsed";
  const logoFullRef = useRef<HTMLImageElement>(null);
  const logoSmallRef = useRef<HTMLImageElement>(null);
  const location = useLocation();

  useEffect(() => {
    // Preload images to prevent flashing
    const logoFullImg = new Image();
    logoFullImg.src = "/lovable-uploads/d23c7cfe-f31c-48e7-853d-9336a829189d.png";
    
    const logoSmallImg = new Image();
    logoSmallImg.src = "/lovable-uploads/b063f862-dfa6-4ec2-bf1e-f6ba630f97b6.png";
  }, []);

  // Sempre que a rota mudar, fecha o menu no mobile
  useEffect(() => {
    if (isMobile) setOpenMobile(false);
  }, [location, isMobile, setOpenMobile]);

  // Handler para navegação nos itens do menu - fecha sidebar no mobile
  const handleNavClick = () => {
    if (isMobile) setOpenMobile(false);
  };

  return (
    <Sidebar
      className={`transition-all duration-300 ease-in-out ${isCollapsed ? "w-14" : "w-60"} bg-sidebar border-sidebar-border`}
      collapsible="icon"
    >
      <SidebarContent className="bg-sidebar">
        {/* Trigger também dentro do sidebar (visível só no mobile/mini) */}
        <div className="flex items-center justify-between my-6 px-2 md:px-6">
          {isCollapsed ? (
            <img 
              ref={logoSmallRef}
              src="/lovable-uploads/b063f862-dfa6-4ec2-bf1e-f6ba630f97b6.png" 
              alt="ZUQ Performance" 
              className="w-8 h-8 brightness-0 invert"
              loading="eager"
            />
          ) : (
            <img 
              ref={logoFullRef}
              src="/lovable-uploads/d23c7cfe-f31c-48e7-853d-9336a829189d.png" 
              alt="ZUQ Performance" 
              className="w-36 brightness-0 invert"
              loading="eager"
            />
          )}
          {/* SidebarTrigger sempre visível em mobile/mini para expandir/recolher */}
          <SidebarTrigger className="ml-auto md:hidden" />
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/70 font-medium text-xs uppercase tracking-wider">
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
}

type NavItemProps = {
  to: string;
  icon: React.ReactNode;
  label: string;
  isCollapsed: boolean;
  onClick?: () => void; // novo
};

const NavItem = ({ to, icon, label, isCollapsed, onClick }: NavItemProps) => {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild>
        <NavLink
          to={to}
          className={({ isActive }) =>
            `flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 ${
              isActive
                ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                : "hover:bg-sidebar-accent text-sidebar-foreground hover:text-sidebar-accent-foreground"
            }`
          }
          end
          onClick={onClick}
        >
          <div className="flex items-center">
            {icon}
            {!isCollapsed && <span className="ml-3 font-medium">{label}</span>}
          </div>
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
};
