import React, { useState } from "react";
import { apiService } from "../services/api";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";

type UserType = "teacher" | "parent";

const LoginPage: React.FC = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [userType, setUserType] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUserTypeSelect = (type: UserType) => {
    setUserType(type);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!userType) {
      toast.error("Por favor, selecione o tipo de usuário");
      setLoading(false);
      return;
    }

    try {
      const response = await apiService.login({ ...formData, userType });

      // Salva o token no localStorage
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("userType", userType);

      // Salva o ID do usuário no localStorage
      if (userType === "teacher") {
        localStorage.setItem("professorId", response.data.id);
      } else if (userType === "parent") {
        localStorage.setItem("responsavelId", response.data.id);
      }

      // Redireciona para o dashboard apropriado
      if (userType === "teacher") {
        navigate("/teacher-dashboard");
      } else {
        navigate("/children");
      }
    } catch (_error) {
      toast.error("Email ou senha inválidos. Por favor, tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 bg-login-svg">
      <Toaster />
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Faça login na sua conta
          </h2>
        </div>

        {/* User Type Selection */}
        <div className="flex justify-center space-x-4 mb-6">
          <button
            type="button"
            onClick={() => handleUserTypeSelect("teacher")}
            className={`px-4 py-2 rounded-md ${
              userType === "teacher"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            Professor
          </button>
          <button
            type="button"
            onClick={() => handleUserTypeSelect("parent")}
            className={`px-4 py-2 rounded-md ${
              userType === "parent"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            Responsável
          </button>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Senha"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
