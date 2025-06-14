
import { SidebarTrigger } from "@/components/ui/sidebar";
import { UserMenu } from "./UserMenu";

interface NavbarProps {
  title?: string;
}

const Navbar = ({ title }: NavbarProps) => {
  return (
    <nav className="bg-white border-b border-gray-200 px-4 md:px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* SidebarTrigger sempre visível no mobile */}
          <SidebarTrigger className="md:hidden" />
          <img 
            src="/lovable-uploads/b063f862-dfa6-4ec2-bf1e-f6ba630f97b6.png" 
            alt="ZUQ Performance" 
            className="w-8 h-8"
          />
          <h1 className="text-lg md:text-xl font-semibold text-zuq-darkblue">
            {title || "ZUQ Performance"}
          </h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <UserMenu />
        </div>
      </div>
    </nav>
  );
};

export { Navbar };
