import React, { useState } from "react";
import Card, { CardHeader, CardBody } from "../components/Card";
import Input from "../components/Input";
import Button from "../components/Button";
import { apiService } from "../services/api";
import Modal from "../components/Modal";

const RegisterTeacherPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    cnpj: "",
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [passwordError, setPasswordError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.name || formData.name.length < 3) {
      newErrors.name = "Nome deve ter pelo menos 3 caracteres";
    }
    if (!formData.email.match(/^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/)) {
      newErrors.email = "E-mail inválido";
    }
    if (!formData.password || formData.password.length < 8) {
      newErrors.password = "Senha deve ter pelo menos 8 caracteres";
    }
    if (!formData.phone.match(/^\\+?[1-9][0-9]{10,14}$/)) {
      newErrors.phone =
        "Telefone inválido. Deve conter entre 10 e 14 dígitos, opcionalmente com + no início e sem começar com zero após o +. Ex: +5511987654321";
    }
    if (!formData.cnpj.match(/^\\d{14}$/)) {
      newErrors.cnpj =
        "CNPJ inválido. Deve conter exatamente 14 dígitos numéricos.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

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

  // ADICIONAR TRY CATCH
  // FEEDBACK PARA O USUARIO DEPOIS DO CADASTRO
  // VALIDACAO DOS DADOS

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    try {
      const response = await apiService.registerTeacher({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        cnpj: formData.cnpj,
      });
      console.log(response);
      setFormData({ name: "", email: "", password: "", phone: "", cnpj: "" });
      setIsModalOpen(false);
      setErrors({});
    } catch (error) {
      console.error("Error registering teacher:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8">
      <Card>
        <CardHeader>
          <h1 className="text-2xl font-bold text-gray-800">
            Cadastrar Professor(a)
          </h1>
          <p className="mt-1 text-gray-600">
            Preencha os dados do professor(a).
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
        title="Cadastro de Professor(a)"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Nome do Professor(a)"
            id="name"
            name="name"
            placeholder="Digite o nome"
            value={formData.name}
            onChange={handleChange}
            required
            error={errors.name}
          />
          <Input
            label="E-mail"
            id="email"
            name="email"
            placeholder="Digite o e-mail"
            value={formData.email}
            onChange={handleChange}
            required
            type="email"
            error={errors.email}
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
            error={errors.password}
          />
          {passwordError && (
            <div className="text-red-600 text-sm mt-1">{passwordError}</div>
          )}
          <Input
            label="CNPJ"
            id="cnpj"
            name="cnpj"
            placeholder="Digite o CNPJ"
            value={formData.cnpj}
            onChange={handleChange}
            required
            error={errors.cnpj}
          />
          <Input
            label="Telefone"
            id="phone"
            name="phone"
            placeholder="Digite o telefone"
            value={formData.phone}
            onChange={handleChange}
            required
            error={errors.phone}
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading || !!passwordError}>
              {isLoading ? "Cadastrando..." : "Cadastrar"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default RegisterTeacherPage;
