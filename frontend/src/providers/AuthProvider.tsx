"use client";

import { api, clearToken, getToken, setToken, setUnauthorizedHandler } from "@/lib/api";
import { LoginResponse, RegisterInput, Role, User } from "@/types/api";
import { useRouter } from "next/navigation";
import { Children, createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

const USER_KEY = "bazaar_user";

/*where each role lands after logging in */
export const homePathForRole = (role: Role): string => {
    if(role === "seller") return "/seller/orders";
    if(role === "admin") return "/admin/products";
    return "/";
};

/* ---------- saved user (display only: the backend trusts the token, never this) ---------- */

function readUser(): User | null {
    try {
        const raw = window.localStorage.getItem(USER_KEY);
        if(!raw) return null;
        const u = JSON.parse(raw) as Partial<User>;
        if(typeof u.id === "number" && typeof u.role == "string") return u as User;

    }catch {
        //corrupt value 
    }
    return null;
}

const writeUser = (user: User) => {
  try {
    window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    /* ignore */
  }
};
 
const clearSession = () => {
  clearToken();
  try {
    window.localStorage.removeItem(USER_KEY);
  } catch {
    /* ignore */
  }
};
 
/* ---------- context ---------- */
 
interface AuthContextValue {
  user: User | null;
  /** true until the saved login has been read on first load */
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  /** creates the account only: the backend does not log the user in */
  register: (input: RegisterInput) => Promise<User>;
  logout: () => Promise<void>;
}

const Authcontext = createContext<AuthContextValue | null>(null);

export function AuthProvider({children}: {children: ReactNode}){
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    //restore login after refresh
    useEffect(() => {
        const stored = readUser();
        if(getToken() && stored){
            setUser(stored);
        }else{
            clearSession();
        }
        setIsLoading(false);
    }, []);

    //any request that gets 401 while logged in ends session
    useEffect(() => {
        setUnauthorizedHandler(() => {
            clearSession();
            setUser(null);
            router.replace("/login");
        })
        return () => setUnauthorizedHandler(null);
    }, [router]);

    //logging in or out in another tab updates thsi one

    useEffect(() => {
        const onStorage = (e: StorageEvent) => {
            if(e.key !== "bazaar_token" && e.key !== USER_KEY) return;
            setUser(getToken() ? readUser(): null);
        };
        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, []);

    const login = useCallback(async (email: string, password: string) => {
    const res = await api.post<LoginResponse>("/auth/login", { email, password }, { auth: false });
    setToken(res.token);
    writeUser(res.user);
    setUser(res.user);
    return res.user;
  }, []);
 
  const register = useCallback(
    (input: RegisterInput) => api.post<User>("/auth/register", input, { auth: false }),
    []
  );
 
  const logout = useCallback(async () => {
    try {
      // revokes the token on the server; fine if it fails
      if (getToken()) await api.post("/auth/logout");
    } catch {
      /* the local logout below still happens */
    } finally {
      clearSession();
      setUser(null);
      router.push("/login");
    }
  }, [router]);
 
  const value = useMemo<AuthContextValue>(
    () => ({ user, isLoading, isAuthenticated: user !== null, login, register, logout }),
    [user, isLoading, login, register, logout]
  );
 
  return <Authcontext.Provider value={value}>{children}</Authcontext.Provider>;
}
 
export function useAuth(): AuthContextValue {
  const ctx = useContext(Authcontext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}




