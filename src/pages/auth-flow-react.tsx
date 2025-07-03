import React, { useState } from "react";
import { motion } from "framer-motion";
import { Navigate } from "react-router-dom";
import { GraduationCap, User as UserIcon } from "lucide-react";
import Modal from "../components/Modal";
import Input from "../components/Input";
import Button from "../components/Button";
import { apiService } from "../services/api";
import { AxiosError } from "axios";
import { useAuth } from "../contexts/AuthContext";
import MaskedInput from "../components/MaskedInput";

type LocalUserType = "PROFESSORA" | "RESPONSAVEL" | null;

const formatPhone = (value: string) => {
  const numbers = value.replace(/\D/g, "");

  const limitedNumbers = numbers.slice(0, 11);

  if (limitedNumbers.length <= 10) {
    return limitedNumbers.replace(
      /(\d{2})(\d{0,4})(\d{0,4})/,
      (_, ddd, part1, part2) => {
        if (part2) return `(${ddd}) ${part1}-${part2}`;
        if (part1) return `(${ddd}) ${part1}`;
        if (ddd) return `(${ddd}`;
        return "";
      }
    );
  } else {
    return limitedNumbers.replace(
      /(\d{2})(\d{0,5})(\d{0,4})/,
      (_, ddd, part1, part2) => {
        if (part2) return `(${ddd}) ${part1}-${part2}`;
        if (part1) return `(${ddd}) ${part1}`;
        if (ddd) return `(${ddd}`;
        return "";
      }
    );
  }
};

export default function AuthFlow() {
  const { login: authLogin, user, isAuthenticated, loading } = useAuth();
  const [localUserTypeSelection, setLocalUserTypeSelection] =
    useState<LocalUserType>(null);
  const [isFlipping, setIsFlipping] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);
  const [registrationType, setRegistrationType] = useState<LocalUserType>(null);
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

  const handleUserTypeSelect = (type: LocalUserType) => {
    setIsFlipping(true);
    setTimeout(() => {
      setLocalUserTypeSelection(type);
      setIsFlipping(false);
    }, 400);
  };

  const handleBack = () => {
    setIsFlipping(true);
    setTimeout(() => {
      setLocalUserTypeSelection(null);
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
      localStorage.setItem("userType", localUserTypeSelection || "");
      // Mapear o tipo local para o esperado pelo backend
      let userType = "parent";
      if (localUserTypeSelection === "PROFESSORA") userType = "teacher";
      if (localUserTypeSelection === "RESPONSAVEL") userType = "parent";
      await authLogin(email, password, userType);
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

    // Remove formatação do telefone e CNPJ antes de validar/enviar
    const cleanPhone = registrationFormData.phone.replace(/\D/g, "");
    const cleanCnpj = registrationFormData.cnpj.replace(/\D/g, "");

    // Validar formato do telefone
    const phoneRegex = /^\d{10,11}$/;
    if (!phoneRegex.test(cleanPhone)) {
      setRegistrationError("O telefone deve ter 10 ou 11 dígitos");
      setIsLoading(false);
      return;
    }

    try {
      if (registrationType === "PROFESSORA") {
        await apiService.registerTeacher({
          name: registrationFormData.name,
          email: registrationFormData.email,
          password: registrationFormData.password,
          phone: cleanPhone,
          cnpj: cleanCnpj,
        });
      } else {
        await apiService.registerResponsible({
          name: registrationFormData.name,
          email: registrationFormData.email,
          password: registrationFormData.password,
          phone: cleanPhone,
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
          "Não foi possível conectar ao servidor. Verifique se o backend está rodando em http://localhost:8081"
        );
      } else if (
        error.response?.status === 400 &&
        error.response?.data?.message?.includes("already registered")
      ) {
        setRegistrationError(
          "Este e-mail já está cadastrado no sistema. Por favor, use outro e-mail ou faça login."
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

    // Aplica a máscara se for o campo de telefone
    if (name === "phone") {
      setRegistrationFormData((prev) => ({
        ...prev,
        [name]: formatPhone(value),
      }));
    } else {
      setRegistrationFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const openRegistrationModal = (type: LocalUserType) => {
    setRegistrationType(type);
    setIsRegistrationModalOpen(true);
  };

  if (isAuthenticated && user) {
    const targetPath =
      user.role === "PROFESSORA" ? "/teacher-dashboard" : "/children";
    return <Navigate to={targetPath} replace />;
  }

  if (loading) {
    return <p>Carregando autenticação...</p>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-login-svg">
      <div className="max-w-md w-full">
        <motion.div
          className="relative w-full"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className={`bg-white rounded-xl shadow-lg overflow-hidden border border-primary-100 ${
              isFlipping ? "pointer-events-none" : ""
            }`}
            animate={{
              rotateY: isFlipping ? 90 : 0,
              transition: { duration: 0.4 },
            }}
          >
            {localUserTypeSelection === null ? (
              <UserTypeSelection onSelect={handleUserTypeSelect} />
            ) : (
              <LoginForm
                userType={localUserTypeSelection}
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
          registrationType === "PROFESSORA" ? "Professor(a)" : "Responsável"
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
          {registrationType === "PROFESSORA" && (
            <MaskedInput
              label="CNPJ"
              id="cnpj"
              name="cnpj"
              mask="99.999.999/9999-99"
              placeholder="00.000.000/0000-00"
              value={registrationFormData.cnpj}
              onChange={handleRegistrationChange}
              required
            />
          )}
          <MaskedInput
            label="Telefone"
            id="phone"
            name="phone"
            mask="(99) 99999-9999"
            placeholder="(00) 00000-0000"
            value={registrationFormData.phone}
            onChange={handleRegistrationChange}
            required
          />
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Cadastrando..." : "Cadastrar"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}

interface UserTypeSelectionProps {
  onSelect: (type: LocalUserType) => void;
}

function UserTypeSelection({ onSelect }: UserTypeSelectionProps) {
  return (
    <div className="p-8">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-6">
          <div className="bg-blue-100 p-4 rounded-full">
            <img
              src="/src/images/espaco-construir-logo.jpeg"
              alt="logo"
              className="absolute top-13 left-1/2 transform -translate-x-1/2 -translate-y-1/2 max-w-[96px] h-auto object-contain z-20"
            ></img>
          </div>
        </div>
        <h2 className="text-3xl font-bold text-blue-700">Espaço Construir</h2>
        <p className="mt-3 text-lg text-blue-500">Bem-vindo(a) de volta!</p>
      </div>

      <p className="text-sm font-medium text-gray-700 mb-4 text-center">
        Selecione como você utiliza a plataforma
      </p>

      <div className="space-y-4">
        <button
          onClick={() => onSelect("PROFESSORA")}
          className="w-full flex items-center justify-between p-4 rounded-lg border border-blue-200 hover:border-blue-400 bg-white hover:bg-blue-50 transition-all"
        >
          <div className="flex items-center">
            <div className="p-2 mr-4 bg-blue-100 rounded-lg">
              <GraduationCap size={24} className="text-blue-500" />
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
        </button>

        <button
          onClick={() => onSelect("RESPONSAVEL")}
          className="w-full flex items-center justify-between p-4 rounded-lg border border-blue-200 hover:border-blue-400 bg-white hover:bg-blue-50 transition-all"
        >
          <div className="flex items-center">
            <div className="p-2 mr-4 bg-blue-100 rounded-lg">
              <UserIcon size={24} className="text-blue-500" />
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
        </button>
      </div>
    </div>
  );
}

interface LoginFormProps {
  userType: LocalUserType;
  onBack: () => void;
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  error?: string;
  onRegisterClick: (type: LocalUserType) => void;
}

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
  const isTeacher = userType === "PROFESSORA";

  return (
    <div className="p-8">
      <div className="flex items-center mb-8">
        <button
          onClick={onBack}
          className="p-2 -ml-2 mr-3 rounded-full hover:bg-blue-100 transition-colors"
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
            <path d="M15 18l-6-6-6-6" />
          </svg>
        </button>
        <div>
          <h2 className="text-xl font-bold text-gray-800">
            {isTeacher ? "Login de Professor" : "Login de Responsável"}
          </h2>
          <p className="text-sm text-gray-600">
            {isTeacher
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
          <button
            type="submit"
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-500 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Entrar
          </button>
        </div>
      </form>

      <div className="mt-6 text-center">
        <a
          href="#"
          className="text-sm font-medium text-blue-500 hover:text-blue-700"
        >
          Esqueci minha senha
        </a>
        {userType === "PROFESSORA" && (
          <div className="mt-4">
            <button
              onClick={() => onRegisterClick("PROFESSORA")}
              className="text-sm font-medium text-blue-500 hover:text-blue-700"
            >
              Cadastrar Professor(a)
            </button>
          </div>
        )}
        {userType === "RESPONSAVEL" && (
          <div className="mt-4">
            <button
              onClick={() => onRegisterClick("RESPONSAVEL")}
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
