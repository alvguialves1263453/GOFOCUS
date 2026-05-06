import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
        <p className="text-[10px] text-white/30 uppercase tracking-[0.4em] animate-pulse">Autenticando...</p>
      </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
};
