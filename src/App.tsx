import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import CategorySidebar from "@/components/CategorySidebar";
import AdminDashboard from "./pages/AdminDashboard";
import AdminProjectEdit from "./pages/AdminProjectEdit";
import AdminInstagram from "./pages/AdminInstagram";
import AdminInstagramClient from "./pages/AdminInstagramClient";
import AdminOrcamentos from "./pages/AdminOrcamentos";
import AdminEventos from "./pages/AdminEventos";
import AdminEventoEdit from "./pages/AdminEventoEdit";
import AdminMetricas from "./pages/AdminMetricas";
import AdminNotas from "./pages/AdminNotas";
import AdminAgenda from "./pages/AdminAgenda";
import AdminFinanceiro from "./pages/AdminFinanceiro";
import AdminMensagens from "./pages/AdminMensagens";
import AdminLinks from "./pages/AdminLinks";
import ClientPreview from "./pages/ClientPreview";
import NotFound from "./pages/NotFound";
import Links from "./pages/Links";
import { ProtectedRoute } from "./components/ProtectedRoute";
import AdminShell from "./components/admin/AdminShell";
import Eventos from "./pages/Eventos";
import EventoGaleria from "./pages/EventoGaleria";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <CategorySidebar />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/admin" element={<Login />} />
          <Route path="/login" element={<Navigate to="/admin" replace />} />
          {/* Every signed-in admin screen shares one frame (sidebar + content). */}
          <Route element={<AdminShell />}>
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/projeto/:id"
              element={<AdminProjectEdit />}
            />
            <Route
              path="/admin/instagram"
              element={
                <ProtectedRoute>
                  <AdminInstagram />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/instagram/cliente/:id"
              element={
                <ProtectedRoute>
                  <AdminInstagramClient />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/orcamentos"
              element={
                <ProtectedRoute>
                  <AdminOrcamentos />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/agenda"
              element={
                <ProtectedRoute>
                  <AdminAgenda />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/financeiro"
              element={
                <ProtectedRoute>
                  <AdminFinanceiro />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/mensagens"
              element={
                <ProtectedRoute>
                  <AdminMensagens />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/links"
              element={
                <ProtectedRoute>
                  <AdminLinks />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/notas"
              element={
                <ProtectedRoute>
                  <AdminNotas />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/metricas"
              element={
                <ProtectedRoute>
                  <AdminMetricas />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/eventos"
              element={
                <ProtectedRoute>
                  <AdminEventos />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/eventos/:id"
              element={
                <ProtectedRoute>
                  <AdminEventoEdit />
                </ProtectedRoute>
              }
            />
          </Route>
          <Route path="/projeto/:id" element={<ClientPreview />} />
          <Route path="/cliente/:slug" element={<ClientPreview />} />
          <Route path="/links" element={<Links />} />
          <Route path="/eventos" element={<Eventos />} />
          <Route path="/eventos/:id" element={<EventoGaleria />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
