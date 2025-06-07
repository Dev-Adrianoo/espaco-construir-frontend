import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, Navigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import { GraduationCap } from "lucide-react";
import Modal from "../components/Modal";
import Input from "../components/Input";
import { apiService } from "../services/api";
import { AxiosError } from "axios";

type UserType = "teacher" | "parent" | null;

export default function AuthFlow() {
  const navigate = useNavigate();
  const [userType, setUserType] = useState<UserType>(null);
  const [isFlipping, setIsFlipping] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState("");
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);
  const [registrationType, setRegistrationType] = useState<UserType>(null);
  const [registrationFormData, setRegistrationFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    cnpj: "",
  });
  const [registrationError, setRegistrationError] = useState<string | null>(
    null
  );
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
      const response = await apiService.login({ email, password });

      // Salva o token no localStorage
      localStorage.setItem("token", response.data.token);

      // Salva o tipo de usuário e ID no localStorage
      if (userType === "teacher") {
        localStorage.setItem("userType", "teacher");
        localStorage.setItem("professorId", response.data.id);
      } else if (userType === "parent") {
        localStorage.setItem("userType", "parent");
        localStorage.setItem("responsavelId", response.data.id);
      }

      setIsAuthenticated(true);

      // Navigate based on user type
      if (userType === "teacher") {
        navigate("/teacher-dashboard");
      } else if (userType === "parent") {
        navigate("/schedule");
      }
    } catch (error) {
      console.error("Authentication failed:", error);
      setError("Email ou senha inválidos. Por favor, tente novamente.");
    }
  };

  const handleRegistrationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegistrationError(null);
    setRegistrationSuccess(false);
    setIsLoading(true);

    try {
      if (registrationType === "teacher") {
        await apiService.registerTeacher({
          name: registrationFormData.name,
          email: registrationFormData.email,
          password: registrationFormData.password,
          phone: registrationFormData.phone,
          cnpj: registrationFormData.cnpj,
        });
      } else {
        await apiService.registerResponsible({
          name: registrationFormData.name,
          email: registrationFormData.email,
          password: registrationFormData.password,
          phone: registrationFormData.phone,
        });
      }

      setRegistrationSuccess(true);
      setRegistrationFormData({
        name: "",
        email: "",
        password: "",
        phone: "",
        cnpj: "",
      });
      setTimeout(() => {
        setIsRegistrationModalOpen(false);
        setRegistrationSuccess(false);
      }, 2000);
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      console.error("Registration error:", error);

      if (error.code === "ERR_NETWORK") {
        setRegistrationError(
          "Não foi possível conectar ao servidor. Verifique se o backend está rodando em http://localhost:8080"
        );
      } else {
        setRegistrationError(
          error.response?.data?.message || "Ocorreu um erro durante o cadastro"
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegistrationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRegistrationFormData((prev) => ({ ...prev, [name]: value }));
  };

  const openRegistrationModal = (type: UserType) => {
    setRegistrationType(type);
    setIsRegistrationModalOpen(true);
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
                onRegisterClick={openRegistrationModal}
              />
            )}
          </motion.div>
        </motion.div>
      </div>

      <Modal
        isOpen={isRegistrationModalOpen}
        onClose={() => setIsRegistrationModalOpen(false)}
        title={`Cadastro de ${
          registrationType === "teacher" ? "Professor(a)" : "Responsável"
        }`}
      >
        {registrationError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{registrationError}</p>
          </div>
        )}
        {registrationSuccess && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-600">
              Cadastro realizado com sucesso!
            </p>
          </div>
        )}
        <form onSubmit={handleRegistrationSubmit} className="space-y-6">
          <Input
            label="Nome"
            id="name"
            name="name"
            placeholder="Digite o nome"
            value={registrationFormData.name}
            onChange={handleRegistrationChange}
            required
          />
          <Input
            label="E-mail"
            id="email"
            name="email"
            placeholder="Digite o e-mail"
            value={registrationFormData.email}
            onChange={handleRegistrationChange}
            required
            type="email"
          />
          <Input
            label="Senha"
            id="password"
            name="password"
            placeholder="Digite a senha"
            value={registrationFormData.password}
            onChange={handleRegistrationChange}
            required
            type="password"
          />
          <Input
            label="Telefone"
            id="phone"
            name="phone"
            placeholder="Digite o telefone"
            value={registrationFormData.phone}
            onChange={handleRegistrationChange}
            required
            type="tel"
          />
          {registrationType === "teacher" && (
            <Input
              label="CNPJ"
              id="cnpj"
              name="cnpj"
              placeholder="Digite o CNPJ"
              value={registrationFormData.cnpj}
              onChange={handleRegistrationChange}
              required
            />
          )}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => setIsRegistrationModalOpen(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isLoading ? "Cadastrando..." : "Cadastrar"}
            </button>
          </div>
        </form>
      </Modal>
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
  onRegisterClick: (type: UserType) => void;
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
  onRegisterClick,
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
            <button
              onClick={() => onRegisterClick("teacher")}
              className="text-sm font-medium text-blue-500 hover:text-blue-700"
            >
              Cadastrar Professor(a)
            </button>
          </div>
        )}
        {userType === "parent" && (
          <div className="mt-4">
            <button
              onClick={() => onRegisterClick("parent")}
              className="text-sm font-medium text-blue-500 hover:text-blue-700"
            >
              Cadastrar Responsável
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
