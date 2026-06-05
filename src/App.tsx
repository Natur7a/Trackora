import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import { AuthPage } from "./pages/AuthPage";

import DashboardPage from "./pages/DashboardPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import CashflowPage from "./pages/CashflowPage";
import Goals from "./pages/Goals";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />

      <BrowserRouter>
        <AuthProvider>
          <Routes>

            {/* AUTH */}
            <Route
              path="/auth"
              element={<AuthPage />}
            />

            {/* DASHBOARD */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />

            {/* ANALYTICS */}
            <Route
              path="/analytics"
              element={
                <ProtectedRoute>
                  <AnalyticsPage />
                </ProtectedRoute>
              }
            />

            {/* GOALS */}
            <Route
              path="/goals"
              element={
                <ProtectedRoute>
                  <Goals />
                </ProtectedRoute>
              }
            />

            <Route
  path="/cashflow"
  element={
    <ProtectedRoute>
      <CashflowPage />
    </ProtectedRoute>
  }
/>

            {/* 404 */}
            <Route
              path="*"
              element={<NotFound />}
            />

          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;