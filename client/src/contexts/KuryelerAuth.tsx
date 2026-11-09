import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  getSession,
  kuryelerMode,
  signIn as apiSignIn,
  signOut as apiSignOut,
  signUp as apiSignUp,
  type SessionUser,
} from "@/lib/kuryelerApi";
import { getSupabase } from "@/lib/supabaseClient";

type AuthContextValue = {
  user: SessionUser | null;
  loading: boolean;
  mode: typeof kuryelerMode;
  signIn: (email: string, password: string) => Promise<SessionUser>;
  signUp: (input: {
    email: string;
    password: string;
    fullName: string;
    phone: string;
    role: "customer" | "courier";
  }) => Promise<SessionUser>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function KuryelerAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const session = await getSession();
    setUser(session);
  }, []);

  useEffect(() => {
    let active = true;
    getSession()
      .then(session => {
        if (active) setUser(session);
      })
      .catch(() => {
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    const supabase = getSupabase();
    if (!supabase) return () => {
      active = false;
    };
    const { data } = supabase.auth.onAuthStateChange(() => {
      void getSession().then(setUser);
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      mode: kuryelerMode,
      signIn: async (email, password) => {
        const next = await apiSignIn(email, password);
        setUser(next);
        return next;
      },
      signUp: async input => {
        const next = await apiSignUp(input);
        setUser(next);
        return next;
      },
      signOut: async () => {
        await apiSignOut();
        setUser(null);
      },
      refresh,
    }),
    [user, loading, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useKuryelerAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("KuryelerAuthProvider eksik");
  return ctx;
}

export function panelPathForRole(role: SessionUser["role"]) {
  if (role === "courier") return "/kurye";
  if (role === "admin") return "/yonetici";
  return "/musteri";
}
