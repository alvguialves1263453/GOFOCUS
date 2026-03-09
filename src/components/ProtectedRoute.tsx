import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <p className="text-[10px] text-white/40 uppercase tracking-[0.4em] animate-pulse font-bold">Autenticando...</p>
            </div>
        );
    }

    if (!user) {
        const isAdminRoute = location.pathname.startsWith("/admin");
        return <Navigate to={isAdminRoute ? "/admin" : "/login"} state={{ from: location }} replace />;
    }

    return <>{children}</>;
};
