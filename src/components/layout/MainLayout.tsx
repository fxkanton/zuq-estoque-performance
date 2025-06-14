
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
      <div className="flex min-h-screen w-full bg-gradient-to-br from-sky-50 via-white to-blue-50">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <Navbar title={title} />
          <Suspense fallback={
            <div className="flex-1 p-4 md:p-6 flex items-center justify-center">
              <div className="animate-pulse">Carregando...</div>
            </div>
          }>
            <main className="flex-1 p-4 md:p-6 overflow-auto">
              <div className="animate-fade-in">
                {children}
              </div>
            </main>
          </Suspense>
        </div>
      </div>
    </SidebarProvider>
  );
}
