import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import api from '../lib/api';
import { identifyClarityUser } from '../lib/clarity';
import { setSentryUser } from '../lib/sentry';
import { authService, AuthUser, AuthResponse } from '../services/auth';

const TOKEN_KEY = 'makani_cosmetique_token';
const REFRESH_TOKEN_KEY = 'makani_cosmetique_refresh_token';

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string, phone?: string, captchaToken?: string) => Promise<void>;
  loginWithToken: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(!!localStorage.getItem(TOKEN_KEY));

  // Always read the latest token from localStorage when sending; React state
  // can lag behind the synchronous refresh below.
  const tokenRef = useRef<string | null>(token);
  useEffect(() => { tokenRef.current = token; }, [token]);

  // Coalesce concurrent refresh attempts into a single network call.
  const refreshPromiseRef = useRef<Promise<string> | null>(null);

  const persistTokens = useCallback((accessToken: string, refreshToken: string) => {
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    tokenRef.current = accessToken;
    setToken(accessToken);
  }, []);

  const clearTokens = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    tokenRef.current = null;
    setToken(null);
    setUser(null);
    setSentryUser(null);
  }, []);

  const persist = useCallback((res: AuthResponse) => {
    persistTokens(res.access_token, res.refresh_token);
    setUser(res.user);
    identifyClarityUser(res.user.id, res.user.fullName);
    setSentryUser({ id: res.user.id });
  }, [persistTokens]);

  const refreshTokens = useCallback(async (): Promise<string> => {
    const rt = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!rt) throw new Error('No refresh token');
    const res = await authService.refresh(rt);
    persistTokens(res.access_token, res.refresh_token);
    setUser(res.user);
    return res.access_token;
  }, [persistTokens]);

  // Request interceptor — attach access token (read latest from ref to avoid stale closure)
  useEffect(() => {
    const id = api.interceptors.request.use((config) => {
      const t = tokenRef.current;
      if (t) config.headers.Authorization = `Bearer ${t}`;
      else delete config.headers.Authorization;
      return config;
    });
    return () => api.interceptors.request.eject(id);
  }, []);

  // Response interceptor — on 401, refresh once and retry
  useEffect(() => {
    const id = api.interceptors.response.use(
      (res) => res,
      async (error) => {
        const original = error.config;
        const status = error.response?.status;
        const url: string = original?.url ?? '';

        // Skip if: not 401, no original config, already retried, or it's an auth endpoint
        // (refresh, login, register — these failures should not trigger another refresh)
        const isAuthEndpoint = /\/auth\/(refresh|login|register|forgot-password|reset-password)/.test(url);
        if (status !== 401 || !original || original._retry || isAuthEndpoint) {
          return Promise.reject(error);
        }

        // No refresh token at all → can't recover
        if (!localStorage.getItem(REFRESH_TOKEN_KEY)) {
          return Promise.reject(error);
        }

        original._retry = true;

        try {
          if (!refreshPromiseRef.current) {
            refreshPromiseRef.current = refreshTokens().finally(() => {
              refreshPromiseRef.current = null;
            });
          }
          const newAccess = await refreshPromiseRef.current;
          original.headers.Authorization = `Bearer ${newAccess}`;
          return api(original);
        } catch (refreshErr) {
          clearTokens();
          return Promise.reject(error);
        }
      },
    );
    return () => api.interceptors.response.eject(id);
  }, [refreshTokens, clearTokens]);

  // On mount, restore session — the response interceptor handles 401→refresh transparently
  useEffect(() => {
    if (!token) { setLoading(false); return; }
    authService.getMe()
      .then((u) => {
        setUser(u);
        identifyClarityUser(u.id, u.fullName);
        setSentryUser({ id: u.id });
      })
      .catch(() => clearTokens())
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = useCallback(async (email: string, password: string) => {
    const res = await authService.login(email, password);
    persist(res);
  }, [persist]);

  const register = useCallback(async (fullName: string, email: string, password: string, phone?: string, captchaToken?: string) => {
    const res = await authService.register(fullName, email, password, phone, captchaToken);
    persist(res);
  }, [persist]);

  const loginWithToken = useCallback(async (jwt: string) => {
    // OAuth callback: we only have an access token. Persist it and fetch /me.
    // No refresh token available via this path — the server should also issue one
    // alongside on OAuth flows in a future iteration.
    localStorage.setItem(TOKEN_KEY, jwt);
    tokenRef.current = jwt;
    const { data: me } = await api.get<AuthUser>('/auth/me', {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    setToken(jwt);
    setUser(me);
  }, []);

  const logout = useCallback(async () => {
    const rt = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (rt) {
      // Best-effort revocation — don't block logout on network failure
      authService.logout(rt).catch(() => undefined);
    }
    clearTokens();
  }, [clearTokens]);

  return (
    <AuthContext.Provider value={{
      user, token, loading,
      login, register, loginWithToken, logout,
      isAdmin: user?.role === 'admin',
      isAuthenticated: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
