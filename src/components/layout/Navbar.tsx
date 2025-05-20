
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { 
  Bell,
  User
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

export function Navbar({ title }: { title: string }) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <header className="border-b border-gray-200 bg-white p-4 flex justify-between items-center">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="text-zuq-darkblue hover:text-zuq-blue" />
        <h1 className="text-xl font-bold text-zuq-darkblue">{title}</h1>
      </div>
      
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" className="text-zuq-darkblue border-none hover:bg-zuq-gray/30">
          <Bell className="h-5 w-5" />
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="text-zuq-darkblue border-none hover:bg-zuq-gray/30">
              <User className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Perfil</DropdownMenuItem>
            <DropdownMenuItem>Configurações</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Sair</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
