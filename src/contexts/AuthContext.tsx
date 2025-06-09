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
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token")
  );
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem("token");
      const storedUserType = localStorage.getItem("userType");

      if (storedToken && storedUserType) {
        try {
          let fetchedUser: User | null = null;
          if (storedUserType === "PROFESSORA") {
            const teacherResponse = await apiService.getCurrentTeacher();
            fetchedUser = { ...teacherResponse.data, role: "PROFESSORA" };
          } else if (storedUserType === "RESPONSAVEL") {
            const guardianResponse = await apiService.getCurrentGuardian();
            fetchedUser = { ...guardianResponse.data, role: "RESPONSAVEL" };
          }

          if (fetchedUser) {
            setToken(storedToken);
            setUser(fetchedUser);
            localStorage.setItem("user", JSON.stringify(fetchedUser));
          } else {
            console.error("Could not fetch current user data, forcing logout.");
            logout();
          }
        } catch (error) {
          console.error("Error fetching current user data:", error);
          logout();
        }
      } else {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("userType");
        localStorage.removeItem("responsavelId");
        localStorage.removeItem("professorId");
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await apiService.login({ email, password });

      if (
        !response.data ||
        !response.data.token ||
        !response.data.id ||
        !response.data.name ||
        !response.data.email ||
        !response.data.role
      ) {
        console.error(
          "Login response data is incomplete or invalid:",
          response.data
        );
        throw new Error("Invalid credentials or unexpected server response.");
      }

      const { token, id, name, email: userEmail, role } = response.data;

      if (!["PROFESSORA", "RESPONSAVEL"].includes(role)) {
        console.error("Attempted login with unsupported role:", role);
        throw new Error("Role not supported for login.");
      }

      const loggedInUser: User = {
        id,
        name,
        email: userEmail,
        role: role as "PROFESSORA" | "RESPONSAVEL",
      };

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(loggedInUser));
      localStorage.setItem("userType", loggedInUser.role);

      if (loggedInUser.role === "RESPONSAVEL") {
        localStorage.setItem("responsavelId", loggedInUser.id);
        localStorage.removeItem("professorId");
      } else if (loggedInUser.role === "PROFESSORA") {
        localStorage.setItem("professorId", loggedInUser.id);
        localStorage.removeItem("responsavelId");
      }

      setToken(token);
      setUser(loggedInUser);

      if (loggedInUser.role === "PROFESSORA") {
        navigate("/teacher-dashboard");
      } else if (loggedInUser.role === "RESPONSAVEL") {
        navigate("/children");
      } else {
        console.warn("Unexpected role after login:", loggedInUser.role);
        navigate("/");
      }
    } catch (error) {
      console.error("Authentication failed:", error);
      if (error instanceof AxiosError && error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error("Invalid credentials");
    }
  };

  const logout = () => {
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
        isAuthenticated: !!token,
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
