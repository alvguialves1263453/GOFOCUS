import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div role="status" className="flex min-h-[60vh] items-center justify-center gap-2 text-[15px] text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Verificando acesso…
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/admin" state={{ from: location }} replace />;
    }

    return <>{children}</>;
};
