import React, { useState } from "react";
import Card, { CardHeader, CardBody } from "../components/Card";
import Input from "../components/Input";
import Button from "../components/Button";
import { apiService } from "../services/api";
import { AxiosError } from "axios";
import Modal from "../components/Modal";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import SuccessModal from "../components/SuccessModal";
import ErrorModal from "../components/ErrorModal";

const RegisterResponsiblePage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);

  function isPasswordValid(password: string) {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/.test(password);
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === "password") {
      if (!isPasswordValid(value)) {
        setPasswordError(
          "A senha deve ter pelo menos 8 caracteres, uma letra maiúscula, uma minúscula e um número."
        );
      } else {
        setPasswordError("");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setIsLoading(true);

    try {
      console.log(
        "Sending registration request to:",
        import.meta.env.VITE_API_URL
      );
      const response = await apiService.registerResponsible(formData);
      console.log("Registration successful:", response.data);
      setSuccess(true);
      setFormData({ name: "", phone: "", email: "", password: "" });
      setIsModalOpen(false);
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 2000);
    } catch (err) {
      setShowErrorModal(true);
      setTimeout(() => setShowErrorModal(false), 2000);
      const error = err as AxiosError<{ message: string }>;
      console.error("Registration error:", error);

      if (error.code === "ERR_NETWORK") {
        setError(
          "Não foi possível conectar ao servidor. Verifique se o backend está rodando em http://localhost:8081"
        );
      } else {
        setError(
          error.response?.data?.message || "Ocorreu um erro durante o cadastro"
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8">
      <Card>
        <CardHeader>
          <h1 className="text-2xl font-bold text-gray-800">
            Cadastrar Responsável
          </h1>
          <p className="mt-1 text-gray-600">
            Preencha os dados do responsável. O número de telefone será usado
            para mensagens automáticas de agendamento.
          </p>
        </CardHeader>
        <CardBody>
          <Button onClick={() => setIsModalOpen(true)}>
            Abrir Formulário de Cadastro
          </Button>
        </CardBody>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Cadastro de Responsável"
      >
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Nome do Responsável"
            id="name"
            name="name"
            placeholder="Digite o nome"
            value={formData.name}
            onChange={handleChange}
            required
          />
          <Input
            label="Telefone"
            id="phone"
            name="phone"
            placeholder="Digite o telefone"
            value={formData.phone}
            onChange={handleChange}
            required
            type="tel"
          />
          <Input
            label="Email"
            id="email"
            name="email"
            placeholder="Digite o email"
            value={formData.email}
            onChange={handleChange}
            required
            type="email"
          />
          <Input
            label="Senha"
            id="password"
            name="password"
            placeholder="Digite a senha"
            value={formData.password}
            onChange={handleChange}
            required
            type="password"
          />
          {passwordError && (
            <div className="text-red-600 text-sm mt-1">{passwordError}</div>
          )}

          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading || !!passwordError}>
              {isLoading ? "Cadastrando..." : "Cadastrar"}
            </Button>
          </div>
        </form>
      </Modal>
      <ToastContainer position="top-right" autoClose={3000} />
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        message="Cadastro realizado com sucesso!"
      />
      <ErrorModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        message={error || "Ocorreu um erro durante o cadastro."}
      />
    </div>
  );
};

export default RegisterResponsiblePage;
