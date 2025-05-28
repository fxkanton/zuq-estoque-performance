
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
    <header className="border-b border-white/20 bg-white/80 backdrop-blur-sm p-4 flex justify-between items-center shadow-sm">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="text-zuq-darkblue hover:text-zuq-turquoise hover:bg-zuq-turquoise/10 rounded-lg transition-colors duration-200" />
        <h1 className="text-xl font-bold text-zuq-darkblue">{title}</h1>
      </div>
      
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="icon" 
          className="text-zuq-darkblue border-none hover:bg-zuq-turquoise/10 hover:text-zuq-turquoise transition-colors duration-200 rounded-lg"
        >
          <Bell className="h-5 w-5" />
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="icon" 
              className="text-zuq-darkblue border-none hover:bg-zuq-turquoise/10 hover:text-zuq-turquoise transition-colors duration-200 rounded-lg"
            >
              <User className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-white/95 backdrop-blur-sm border-white/20">
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
