import { useState, useEffect } from "react";

export function useAuth() {
  const [user, setUser] = useState<any | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Supabase auth logic removed
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log("Auth disabled: signIn", { email });
  };

  const signUp = async (email: string, password: string) => {
    console.log("Auth disabled: signUp", { email });
  };

  const signOut = async () => {
    console.log("Auth disabled: signOut");
  };

  return { user, session, loading, signIn, signUp, signOut };
}
