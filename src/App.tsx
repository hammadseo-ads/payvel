import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ErrorBoundary, AuthErrorFallback } from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Send from "./pages/Send";
import Receive from "./pages/Receive";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ErrorBoundary>
      <AuthProvider>
        <ErrorBoundary fallback={<AuthErrorFallback />}>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/dashboard" element={
                  <ErrorBoundary>
                    <Dashboard />
                  </ErrorBoundary>
                } />
                <Route path="/send" element={
                  <ErrorBoundary>
                    <Send />
                  </ErrorBoundary>
                } />
                <Route path="/receive" element={
                  <ErrorBoundary>
                    <Receive />
                  </ErrorBoundary>
                } />
                <Route path="/settings" element={
                  <ErrorBoundary>
                    <Settings />
                  </ErrorBoundary>
                } />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </ErrorBoundary>
      </AuthProvider>
    </ErrorBoundary>
  </QueryClientProvider>
);

export default App;
