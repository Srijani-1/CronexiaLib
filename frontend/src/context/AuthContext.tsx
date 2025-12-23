import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const AuthContext = createContext<any>(null);

function isValidUser(user: any) {
    // Accept only real logged-in users
    return (
        user &&
        typeof user === "object" &&
        user.email &&           // must contain email (or id)
        typeof user.email === "string"
    );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const navigate = useNavigate();

    // Load from sessionStorage but only if valid
    const stored = JSON.parse(sessionStorage.getItem("user") || "null");
    const [user, setUser] = useState(isValidUser(stored) ? stored : null);

    // Validate Session on Mount
    useEffect(() => {
        const validateSession = async () => {
            const u = JSON.parse(sessionStorage.getItem("user") || "null");
            const token = sessionStorage.getItem("token");

            if (u && isValidUser(u) && token) {
                try {
                    const API_BASE_URL = 'http://localhost:8000'; // Or import from config
                    const res = await fetch(`${API_BASE_URL}/users/profile`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });

                    if (!res.ok) {
                        if (res.status === 401) {
                            // Token expired or invalid
                            console.log("Session expired, logging out...");
                            sessionStorage.removeItem("user");
                            sessionStorage.removeItem("token");
                            setUser(null);
                        }
                    } else {
                        // Session is valid
                        setUser(u);
                    }
                } catch (err) {
                    console.error("Session validation error:", err);
                    setUser(u);
                }
            } else {
                // No valid user data
                setUser(null);
                if (sessionStorage.getItem("user")) sessionStorage.removeItem("user");
                if (sessionStorage.getItem("token")) sessionStorage.removeItem("token");
            }
        };

        validateSession();
    }, []);

    // LOGIN
    const login = (userData: any) => {
        if (!isValidUser(userData)) {
            console.error("Invalid user data passed to login():", userData);
            return;
        }

        sessionStorage.setItem("user", JSON.stringify(userData));
        setUser(userData);
    };

    // LOGOUT
    const logout = () => {
        sessionStorage.removeItem("user");
        sessionStorage.removeItem("token");

        setUser(null);

        toast.success("Logged out successfully!");
        navigate("/");
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
