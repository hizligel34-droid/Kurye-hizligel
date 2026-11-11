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
import { ROLE_LABELS, type UserRole } from "@shared/kuryeler";

type AuthContextValue = {
  user: SessionUser | null;
  loading: boolean;
  mode: typeof kuryelerMode;
  lockedRole?: UserRole;
  wrongRole: UserRole | null;
  signIn: (email: string, password: string) => Promise<SessionUser>;
  signUp: (input: {
    email: string;
    password: string;
    fullName: string;
    phone: string;
    role: UserRole;
  }) => Promise<SessionUser>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function KuryelerAuthProvider({
  children,
  lockedRole,
}: {
  children: ReactNode;
  lockedRole?: UserRole;
}) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [wrongRole, setWrongRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  const applyUser = useCallback(
    (session: SessionUser | null) => {
      if (session && lockedRole && session.role !== lockedRole) {
        setWrongRole(session.role);
        setUser(null);
        return;
      }
      setWrongRole(null);
      setUser(session);
    },
    [lockedRole],
  );

  const refresh = useCallback(async () => {
    applyUser(await getSession());
  }, [applyUser]);

  useEffect(() => {
    let active = true;
    getSession()
      .then(session => {
        if (active) applyUser(session);
      })
      .catch(() => {
        if (active) applyUser(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    const supabase = getSupabase();
    if (!supabase) {
      return () => {
        active = false;
      };
    }
    const { data } = supabase.auth.onAuthStateChange(() => {
      void getSession().then(session => {
        if (active) applyUser(session);
      });
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [applyUser]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      mode: kuryelerMode,
      lockedRole,
      wrongRole,
      signIn: async (email, password) => {
        const next = await apiSignIn(email, password);
        if (lockedRole && next.role !== lockedRole) {
          await apiSignOut();
          setWrongRole(next.role);
          setUser(null);
          throw new Error(
            `Bu hesap ${ROLE_LABELS[next.role]} uygulamasına aittir. Hızlıgel ${ROLE_LABELS[next.role]} uygulamasını açın.`,
          );
        }
        setWrongRole(null);
        setUser(next);
        return next;
      },
      signUp: async input => {
        const next = await apiSignUp(input);
        if (lockedRole && next.role !== lockedRole) {
          await apiSignOut();
          setUser(null);
          throw new Error("Bu uygulamada yalnızca ilgili rol ile kayıt olunur.");
        }
        setUser(next);
        return next;
      },
      signOut: async () => {
        await apiSignOut();
        setWrongRole(null);
        setUser(null);
      },
      refresh,
    }),
    [user, loading, lockedRole, wrongRole, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useKuryelerAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("KuryelerAuthProvider eksik");
  return ctx;
}

export function panelPathForRole(role: SessionUser["role"]) {
  if (role === "courier") return "/kurye/";
  if (role === "admin") return "/yonetici/";
  return "/musteri/";
}
