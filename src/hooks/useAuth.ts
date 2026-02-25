import { useState, useEffect } from "react";

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem("gofocus_admin_user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    // Simple mock authentication
    if (email === "admin@gofocus.com" && password === "gofocus123") {
      const mockUser = { email, id: "mock-uid-1" };
      setUser(mockUser);
      localStorage.setItem("gofocus_admin_user", JSON.stringify(mockUser));
    } else {
      throw new Error("Credenciais inválidas");
    }
  };

  const signUp = async () => {
    throw new Error("Cadastro não permitido");
  };

  const signOut = async () => {
    setUser(null);
    localStorage.removeItem("gofocus_admin_user");
  };

  return { user, session: user, loading, signIn, signUp, signOut };
}
