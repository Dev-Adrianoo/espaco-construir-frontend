import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, Navigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import { GraduationCap } from "lucide-react";

type UserType = "teacher" | "parent" | null;

// Mock user data - in a real app, this would come from an API
const MOCK_USERS = {
  teacher: {
    email: "teacher@example.com",
    password: "password123",
    hasChildren: false,
  },
  parent: {
    email: "parent@example.com",
    password: "password123",
    hasChildren: true,
  },
};

export default function AuthFlow() {
  const navigate = useNavigate();
  const [userType, setUserType] = useState<UserType>(null);
  const [isFlipping, setIsFlipping] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState("");

  const handleUserTypeSelect = (type: UserType) => {
    setIsFlipping(true);
    setTimeout(() => {
      setUserType(type);
      setIsFlipping(false);
    }, 400);
  };

  const handleBack = () => {
    setIsFlipping(true);
    setTimeout(() => {
      setUserType(null);
      setIsFlipping(false);
    }, 400);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Por favor, preencha todos os campos");
      return;
    }

    try {
      // Simulate authentication
      const mockUser = MOCK_USERS[userType as keyof typeof MOCK_USERS];

      if (
        mockUser &&
        email === mockUser.email &&
        password === mockUser.password
      ) {
        setIsAuthenticated(true);

        // Navigate based on user type and whether they have children
        if (userType === "teacher") {
          navigate("/teacher-dashboard");
        } else if (userType === "parent") {
          // If parent has no children, direct to registration
          if (!mockUser.hasChildren) {
            navigate("/register-child");
          } else {
            navigate("/schedule");
          }
        }
      } else {
        setError("Credenciais inválidas. Por favor, tente novamente.");
      }
    } catch (error) {
      console.error("Authentication failed:", error);
      setError("Falha na autenticação. Por favor, tente novamente.");
    }
  };

  // If user is authenticated, render the MainLayout
  if (isAuthenticated && userType) {
    return (
      <MainLayout userType={userType}>
        <Navigate
          to={userType === "teacher" ? "/teacher-dashboard" : "/schedule"}
        />
      </MainLayout>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-login-svg">
      <div className="max-w-md w-full">
        <motion.div
          className="relative w-full"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
        >
          {/* Card Container */}
          <motion.div
            className={`bg-white rounded-xl shadow-lg overflow-hidden border border-primary-100 ${
              isFlipping ? "pointer-events-none" : ""
            }`}
            animate={{
              rotateY: isFlipping ? 90 : 0,
              transition: { duration: 0.4 },
            }}
          >
            {userType === null ? (
              <UserTypeSelection onSelect={handleUserTypeSelect} />
            ) : (
              <LoginForm
                userType={userType}
                onBack={handleBack}
                email={email}
                setEmail={setEmail}
                password={password}
                setPassword={setPassword}
                onSubmit={handleSubmit}
                error={error}
              />
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

type UserTypeSelectionProps = {
  onSelect: (type: UserType) => void;
};

function UserTypeSelection({ onSelect }: UserTypeSelectionProps) {
  return (
    <div className="p-8">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-6">
          <div className="bg-blue-100 p-4 rounded-full">
            <GraduationCap className="h-12 w-12 text-blue-500" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-blue-700">Espaço Construir</h2>
        <p className="mt-3 text-lg text-blue-500">Bem-vindo(a) de volta!</p>
      </div>

      <p className="text-sm font-medium text-gray-700 mb-4 text-center">
        Selecione como você utiliza a plataforma
      </p>

      <div className="space-y-4">
        <motion.button
          onClick={() => onSelect("teacher")}
          className="w-full flex items-center justify-between p-4 rounded-lg border border-blue-200 hover:border-blue-400 bg-white hover:bg-blue-50 transition-all"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center">
            <div className="p-2 mr-4 bg-blue-100 rounded-lg">
              <svg
                className="h-6 w-6 text-blue-500"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div className="text-left">
              <h3 className="font-medium text-gray-900">Sou Professor(a)</h3>
              <p className="text-sm text-gray-500">
                Para educadores e coordenadores
              </p>
            </div>
          </div>
          <svg
            className="h-5 w-5 text-gray-400"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        </motion.button>

        <motion.button
          onClick={() => onSelect("parent")}
          className="w-full flex items-center justify-between p-4 rounded-lg border border-blue-200 hover:border-blue-400 bg-white hover:bg-blue-50 transition-all"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center">
            <div className="p-2 mr-4 bg-blue-100 rounded-lg">
              <svg
                className="h-6 w-6 text-blue-500"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div className="text-left">
              <h3 className="font-medium text-gray-900">Sou Responsável</h3>
              <p className="text-sm text-gray-500">
                Para pais e responsáveis de alunos
              </p>
            </div>
          </div>
          <svg
            className="h-5 w-5 text-gray-400"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        </motion.button>
      </div>
    </div>
  );
}

type LoginFormProps = {
  userType: UserType;
  onBack: () => void;
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  error?: string;
};

function LoginForm({
  userType,
  onBack,
  email,
  setEmail,
  password,
  setPassword,
  onSubmit,
  error,
}: LoginFormProps) {
  return (
    <div className="p-8">
      <div className="flex items-center mb-8">
        <motion.button
          onClick={onBack}
          className="p-2 -ml-2 mr-3 rounded-full hover:bg-blue-100 transition-colors"
          whileTap={{ scale: 0.95 }}
        >
          <svg
            className="h-5 w-5 text-blue-500"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </motion.button>
        <div>
          <h2 className="text-xl font-bold text-gray-800">
            {userType === "teacher"
              ? "Login de Professor"
              : "Login de Responsável"}
          </h2>
          <p className="text-sm text-gray-600">
            {userType === "teacher"
              ? "Acesse sua conta de educador"
              : "Acesse sua conta de responsável"}
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            E-mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
            className="w-full px-3 py-2 border border-blue-200 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Digite seu e-mail"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Senha
            </label>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            className="w-full px-3 py-2 border border-blue-200 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Digite sua senha"
          />
        </div>

        <div>
          <motion.button
            type="submit"
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-500 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
          >
            Entrar
          </motion.button>
        </div>
      </form>

      <div className="mt-6 text-center">
        <a
          href="#"
          className="text-sm font-medium text-blue-500 hover:text-blue-700"
        >
          Esqueci minha senha
        </a>
        {userType === "teacher" && (
          <div className="mt-4">
            <a
              href="/register-teacher"
              className="text-sm font-medium text-blue-500 hover:text-blue-700"
            >
              Cadastrar Professor(a)
            </a>
          </div>
        )}
        {userType === "parent" && (
          <div className="mt-4">
            <a
              href="/register-responsible"
              className="text-sm font-medium text-blue-500 hover:text-blue-700"
            >
              Cadastrar Responsável
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
