import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiService } from "../services/api";
import { AxiosError } from "axios";

interface User {
  id: string;
  name: string;
  email: string;
  role: "PROFESSORA" | "RESPONSAVEL";
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, userType: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("token")
  );
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      if (storedToken && storedUser) {
        try {
          // Tenta verificar o token
          await apiService.verifyToken(storedToken);
          const parsedUser = JSON.parse(storedUser) as User;
          // Atualiza os dados do usuário
          try {
            let fetchedUser: User | null = null;
            if (parsedUser.role === "PROFESSORA") {
              const teacherResponse = await apiService.getCurrentTeacher();
              fetchedUser = { ...teacherResponse.data, role: "PROFESSORA" };
            } else if (parsedUser.role === "RESPONSAVEL") {
              const guardianResponse = await apiService.getCurrentGuardian();
              fetchedUser = { ...guardianResponse.data, role: "RESPONSAVEL" };
            }
            if (fetchedUser) {
              setToken(storedToken);
              setUser(fetchedUser);
              localStorage.setItem("user", JSON.stringify(fetchedUser));
            } else {
              throw new Error("Could not fetch current user data");
            }
          } catch (error) {
            console.error("Error fetching current user data:", error);
            throw error;
          }
        } catch (error) {
          // Se o token expirou, tenta renovar com o refresh token
          if (storedToken) {
            try {
              const response = await apiService.refreshToken(storedToken);
              if (response.data?.accessToken) {
                localStorage.setItem("token", response.data.accessToken);
                setToken(response.data.accessToken);
                // Atualize o usuário se vier na resposta
                if (response.data.user) {
                  setUser(response.data.user);
                  localStorage.setItem(
                    "user",
                    JSON.stringify(response.data.user)
                  );
                }
                setLoading(false);
                return;
              }
            } catch {
              await logout();
              setLoading(false);
              return;
            }
          } else {
            await logout();
            setLoading(false);
            return;
          }
        }
      } else {
        // Limpa qualquer dado de autenticação residual
        await logout();
      }
      setLoading(false);
    };
    initializeAuth();
  }, []);

  const login = async (email: string, password: string, userType: string) => {
    try {
      const response = await apiService.login({ email, password, userType });

      if (
        !response.data ||
        !response.data.token ||
        !response.data.id ||
        !response.data.name ||
        !response.data.email ||
        !response.data.role
      ) {
        throw new Error("Invalid credentials or unexpected server response.");
      }

      const {
        token,
        id,
        name,
        email: userEmail,
        role,
        refreshToken: refreshTokenFromApi,
      } = response.data;

      if (!["PROFESSORA", "RESPONSAVEL"].includes(role)) {
        throw new Error("Role not supported for login.");
      }

      const loggedInUser: User = {
        id,
        name,
        email: userEmail,
        role: role as "PROFESSORA" | "RESPONSAVEL",
      };

      localStorage.setItem("token", token);
      if (refreshTokenFromApi) {
        localStorage.setItem("refreshToken", refreshTokenFromApi);
      }
      localStorage.setItem("user", JSON.stringify(loggedInUser));
      localStorage.setItem("userType", loggedInUser.role);

      if (loggedInUser.role === "RESPONSAVEL") {
        localStorage.setItem("responsavelId", loggedInUser.id);
        localStorage.removeItem("professorId");
      } else {
        localStorage.setItem("professorId", loggedInUser.id);
        localStorage.removeItem("responsavelId");
      }

      setToken(token);
      setUser(loggedInUser);

      // Redireciona para a página apropriada
      if (loggedInUser.role === "PROFESSORA") {
        navigate("/teacher-dashboard");
      } else {
        navigate("/children");
      }
    } catch (error) {
      console.error("Authentication failed:", error);
      if (error instanceof AxiosError && error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error("Invalid credentials");
    }
  };

  const logout = async () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("userType");
    localStorage.removeItem("responsavelId");
    localStorage.removeItem("professorId");
    setToken(null);
    setUser(null);
    navigate("/");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        login,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
