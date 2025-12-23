import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function ProtectedRoute() {
    const { user, loading } = useAuth();

    // While checking auth state (e.g., fetching from API)
    if (loading) {
        return (
            <div className="w-full flex justify-center mt-20 text-lg">
                Checking authentication...
            </div>
        );
    }

    // If user is NOT logged in, redirect to login
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // If user is logged in, allow access
    return <Outlet />;
}
