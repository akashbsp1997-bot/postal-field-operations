import { createContext, useContext, ReactNode } from "react";
import { useAuth as useSupabaseAuth } from "@/hooks/useAuth";
import type { AppUser } from "@/types";
import { signOut as dbSignOut } from "@/lib/db";

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useSupabaseAuth();

  const signOut = async () => {
    await dbSignOut();
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useUser() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useUser must be used within an AuthProvider");
  }
  return context;
}
