import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  User,
  LoginCredentials,
  RegisterCredentials,
  AuthLoginResponse,
  AuthRegisterResponse,
  CurrentUserResponse,
} from '../types';
import { API_ENDPOINTS, getMappedApiUrl } from '../env';

const JWT_STORAGE_KEY = 'ai_voice_studio_jwt_token';
const USER_STORAGE_KEY = 'ai_voice_studio_user';

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(JWT_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(JWT_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(JWT_STORAGE_KEY);
    }
  } catch {
    // ignore
  }
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  register: (credentials: RegisterCredentials) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to format FastAPI Pydantic validation error details
function formatApiError(detail: unknown, fallback: string): string {
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    const messages = detail.map((err) => {
      const field = Array.isArray(err.loc) ? err.loc[err.loc.length - 1] : '';
      return field ? `${field}: ${err.msg}` : err.msg;
    });
    return messages.join('; ');
  }
  return fallback;
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setTokenState] = useState<string | null>(() => getAuthToken());
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem(USER_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch current user with Bearer token (matches backend CurrentUserResponse)
  const fetchCurrentUser = useCallback(async (jwt: string): Promise<User | null> => {
    const baseUrl = getMappedApiUrl();
    const primaryUrl = `${baseUrl}${API_ENDPOINTS.AUTH_ME}`;

    try {
      let response = await fetch(primaryUrl, {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${jwt}`,
        },
      });

      // If 404 and endpoint was /api/auth/me, try fallback /auth/me or vice versa
      if (response.status === 404) {
        const altPath = API_ENDPOINTS.AUTH_ME.startsWith('/api')
          ? API_ENDPOINTS.AUTH_ME.replace('/api', '')
          : `/api${API_ENDPOINTS.AUTH_ME}`;
        response = await fetch(`${baseUrl}${altPath}`, {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${jwt}`,
          },
        });
      }

      if (response.ok) {
        const raw: CurrentUserResponse = await response.json();
        const userData: User = {
          id: String(raw.id),
          name: raw.name,
          email: raw.email,
          created_at: raw.created_at,
          username: raw.name,
          full_name: raw.name,
        };
        setUser(userData);
        try {
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
        } catch {
          // ignore
        }
        return userData;
      } else if (response.status === 401) {
        // Token expired or invalid
        setAuthToken(null);
        setTokenState(null);
        setUser(null);
        try {
          localStorage.removeItem(USER_STORAGE_KEY);
        } catch {
          // ignore
        }
      }
    } catch (err) {
      console.warn('Failed to verify user profile via current user endpoint:', err);
    }
    return null;
  }, []);

  // Initialize session on mount and listen for expiration
  useEffect(() => {
    const handleAuthExpired = () => {
      setAuthToken(null);
      setTokenState(null);
      setUser(null);
      try {
        localStorage.removeItem(USER_STORAGE_KEY);
      } catch {
        // ignore
      }
    };

    window.addEventListener('ai_voice_studio_auth_expired', handleAuthExpired);

    const currentToken = getAuthToken();
    if (currentToken) {
      fetchCurrentUser(currentToken).finally(() => {
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }

    return () => {
      window.removeEventListener('ai_voice_studio_auth_expired', handleAuthExpired);
    };
  }, [fetchCurrentUser]);

  // Login handler (matches backend UserLoginRequest: email, password)
  const login = async (credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    const baseUrl = getMappedApiUrl();
    const loginUrl = `${baseUrl}${API_ENDPOINTS.AUTH_LOGIN}`;

    const email = (credentials.email || credentials.username || '').trim();
    const password = credentials.password;

    try {
      // 1. Primary attempt: JSON POST matching UserLoginRequest { email, password }
      let response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      // 2. Fallback: if 422 and server expects OAuth2PasswordRequestForm (form-urlencoded)
      if (response.status === 422) {
        const formData = new URLSearchParams();
        formData.append('username', email);
        formData.append('password', password);

        const formResponse = await fetch(loginUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
          },
          body: formData.toString(),
        });

        if (formResponse.ok) {
          response = formResponse;
        }
      }

      const data: AuthLoginResponse = await response.json();

      if (!response.ok) {
        const errMsg = formatApiError(
          data.detail,
          data.message || `Login failed with status ${response.status}. Please check your credentials.`
        );
        setIsLoading(false);
        return { success: false, error: errMsg };
      }

      // Extract JWT token from response (matches UserLoginResponse: access_token, token_type)
      const accessToken = data.access_token || data.token;
      if (!accessToken) {
        setIsLoading(false);
        return { success: false, error: 'Authentication response did not contain an access_token.' };
      }

      setAuthToken(accessToken);
      setTokenState(accessToken);

      // Fetch user profile via CurrentUserResponse
      if (data.user) {
        setUser(data.user);
        try {
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user));
        } catch {
          // ignore
        }
      } else {
        await fetchCurrentUser(accessToken);
      }

      setIsLoading(false);
      return { success: true };
    } catch (err: unknown) {
      setIsLoading(false);
      const msg = err instanceof Error ? err.message : 'Unable to connect to authentication server.';
      return { success: false, error: msg };
    }
  };

  // Register handler (matches backend UserRegistrationRequest: name, email, password)
  const register = async (credentials: RegisterCredentials): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    const baseUrl = getMappedApiUrl();
    const registerUrl = `${baseUrl}${API_ENDPOINTS.AUTH_REGISTER}`;

    const name = (credentials.name || credentials.full_name || credentials.username || '').trim();
    const email = credentials.email.trim();
    const password = credentials.password;

    try {
      const response = await fetch(registerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      const data: AuthRegisterResponse = await response.json();

      if (!response.ok) {
        const errMsg = formatApiError(
          data.detail,
          data.message || `Registration failed (${response.status})`
        );
        setIsLoading(false);
        return { success: false, error: errMsg };
      }

      // If registration returns an access token immediately:
      const accessToken = data.access_token || data.token;
      if (accessToken) {
        setAuthToken(accessToken);
        setTokenState(accessToken);
        if (data.user) {
          setUser(data.user);
          try {
            localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user));
          } catch {
            // ignore
          }
        } else {
          await fetchCurrentUser(accessToken);
        }
      } else {
        // Backend returns UserRegistrationResponse: { id, name, email, created_at }
        // Attempt automatic login to acquire JWT token
        const loginRes = await login({
          email,
          password,
        });
        if (!loginRes.success) {
          setIsLoading(false);
          return { success: true }; // Registered successfully, user can now sign in
        }
      }

      setIsLoading(false);
      return { success: true };
    } catch (err: unknown) {
      setIsLoading(false);
      const msg = err instanceof Error ? err.message : 'Unable to reach backend registration service.';
      return { success: false, error: msg };
    }
  };

  // Logout handler
  const logout = () => {
    setAuthToken(null);
    setTokenState(null);
    setUser(null);
    try {
      localStorage.removeItem(USER_STORAGE_KEY);
      localStorage.removeItem(JWT_STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const refreshUser = async () => {
    const currentToken = getAuthToken();
    if (currentToken) {
      await fetchCurrentUser(currentToken);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
