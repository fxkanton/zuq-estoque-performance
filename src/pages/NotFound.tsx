
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-zuq-gray/10">
      <div className="text-center p-8 rounded-lg bg-white shadow-lg max-w-md">
        <div className="flex justify-center mb-6">
          <img 
            src="/lovable-uploads/b063f862-dfa6-4ec2-bf1e-f6ba630f97b6.png" 
            alt="ZUQ Performance" 
            className="w-16 h-16"
          />
        </div>
        <h1 className="text-5xl font-bold mb-4 text-zuq-darkblue">404</h1>
        <p className="text-xl text-gray-600 mb-6">Oops! Página não encontrada</p>
        <p className="text-gray-500 mb-8">A página que você está procurando não existe ou foi removida.</p>
        <Button asChild className="bg-zuq-blue hover:bg-zuq-blue/80">
          <a href="/">Voltar para a Página Inicial</a>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
