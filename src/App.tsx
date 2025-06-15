
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ManagerRoute } from "@/components/auth/ManagerRoute";

// Pages
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Equipamentos from "./pages/Equipamentos";
import Fornecedores from "./pages/Fornecedores";
import Movimentacoes from "./pages/Movimentacoes";
import Leitoras from "./pages/Leitoras";
import Pedidos from "./pages/Pedidos";
import FluxoTarefas from "./pages/FluxoTarefas";
import Manutencao from "./pages/Manutencao";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Users from "./pages/Users";
import NotFound from "./pages/NotFound";
import Importacao from "./pages/Importacao";

// Auth Pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ResetPassword from "./pages/auth/ResetPassword";
import Intruso from "./pages/Intruso";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/register" element={<Register />} />
            <Route path="/auth/reset-password" element={<ResetPassword />} />
            
            {/* Intruso route */}
            <Route 
              path="/intruso" 
              element={
                <ProtectedRoute>
                  <Intruso />
                </ProtectedRoute>
              } 
            />
            
            {/* Member-only routes */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute requireMember>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/equipamentos" 
              element={
                <ProtectedRoute requireMember>
                  <Equipamentos />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/fornecedores" 
              element={
                <ProtectedRoute requireMember>
                  <Fornecedores />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/movimentacoes" 
              element={
                <ProtectedRoute requireMember>
                  <Movimentacoes />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/leitoras" 
              element={
                <ProtectedRoute requireMember>
                  <Leitoras />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/pedidos" 
              element={
                <ProtectedRoute requireMember>
                  <Pedidos />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/fluxo-tarefas" 
              element={
                <ProtectedRoute requireMember>
                  <FluxoTarefas />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/importacao" 
              element={
                <ProtectedRoute requireMember>
                  <Importacao />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/manutencao" 
              element={
                <ProtectedRoute requireMember>
                  <Manutencao />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute requireMember>
                  <Profile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/settings" 
              element={
                <ProtectedRoute requireMember>
                  <Settings />
                </ProtectedRoute>
              } 
            />
            
            {/* Manager-only routes */}
            <Route 
              path="/users" 
              element={
                <ManagerRoute>
                  <Users />
                </ManagerRoute>
              } 
            />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
