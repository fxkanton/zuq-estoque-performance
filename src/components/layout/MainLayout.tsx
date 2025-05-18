
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./Sidebar";
import { Navbar } from "./Navbar";
import { Suspense } from "react";

interface MainLayoutProps {
  children: React.ReactNode;
  title: string;
}

export function MainLayout({ children, title }: MainLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-zuq-gray/10">
        <AppSidebar />
        <div className="flex flex-col flex-1">
          <Navbar title={title} />
          <Suspense fallback={<div className="flex-1 p-6 flex items-center justify-center">Carregando...</div>}>
            <main className="flex-1 p-6 overflow-auto">
              {children}
            </main>
          </Suspense>
        </div>
      </div>
    </SidebarProvider>
  );
}
