
import { memo, useMemo } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { UserMenu } from "./UserMenu";

interface NavbarProps {
  title?: string;
}

const Navbar = memo(({ title }: NavbarProps) => {
  // Novo logo enviado pelo usuário
  const logoUrl = useMemo(() => "/lovable-uploads/b796a5d7-8133-46ff-9b97-024bf392cec8.png", []);
  
  // Memoizar o título
  const displayTitle = useMemo(() => title || "ZUQ Performance", [title]);

  return (
    <nav className="bg-white/90 border-b border-gray-200 px-4 md:px-6 py-4 shadow-sm backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <SidebarTrigger className="md:hidden" />
          <img 
            key="navbar-logo"
            src={logoUrl}
            alt="ZUQ Performance" 
            className="w-10 h-10"
            loading="eager"
            style={{ objectFit: "contain" }}
          />
          <h1 className="text-lg md:text-xl font-semibold text-zuq-darkblue">
            {displayTitle}
          </h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <UserMenu />
        </div>
      </div>
    </nav>
  );
});

Navbar.displayName = "Navbar";

export { Navbar };
