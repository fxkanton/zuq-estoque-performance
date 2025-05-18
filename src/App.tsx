
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Equipamentos from "./pages/Equipamentos";
import Fornecedores from "./pages/Fornecedores";
import Movimentacoes from "./pages/Movimentacoes";
import Leitoras from "./pages/Leitoras";
import Pedidos from "./pages/Pedidos";
import Manutencao from "./pages/Manutencao";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/equipamentos" element={<Equipamentos />} />
          <Route path="/fornecedores" element={<Fornecedores />} />
          <Route path="/movimentacoes" element={<Movimentacoes />} />
          <Route path="/leitoras" element={<Leitoras />} />
          <Route path="/pedidos" element={<Pedidos />} />
          <Route path="/manutencao" element={<Manutencao />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
