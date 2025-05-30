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
    Phone: "",
    CPNJ: "",
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.name || formData.name.length < 3) {
      newErrors.name = "Nome deve ter pelo menos 3 caracteres";
    }
    if (!formData.email.match(/^[^@\s]+@[^@\s]+\.[^@\s]+$/)) {
      newErrors.email = "E-mail inválido";
    }
    if (!formData.password || formData.password.length < 8) {
      newErrors.password = "Senha deve ter pelo menos 8 caracteres";
    }
    if (!formData.Phone.match(/^\d{10,}$/)) {
      newErrors.Phone = "Telefone deve ter pelo menos 10 dígitos";
    }
    if (!formData.CPNJ.match(/^\d{14}$/)) {
      newErrors.CPNJ = "CNPJ deve ter 14 dígitos";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ADICIONAR TRY CATCH
  // FEEDBACK PARA O USUARIO DEPOIS DO CADASTRO
  // VALIDACAO DOS DADOS

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      const response = await apiService.registerTeacher({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.Phone,
        cnpj: formData.CPNJ,
      });
      console.log(response);
      setFormData({ name: "", email: "", password: "", Phone: "", CPNJ: "" });
      setIsModalOpen(false);
      setErrors({});
    } catch (error) {
      console.error("Error registering teacher:", error);
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
          <Input
            label="CPNJ"
            id="CPNJ"
            name="CPNJ"
            placeholder="Digite o CPNJ"
            value={formData.CPNJ}
            onChange={handleChange}
            required
            error={errors.CPNJ}
          />
          <Input
            label="Telefone"
            id="Phone"
            name="Phone"
            placeholder="Digite o telefone"
            value={formData.Phone}
            onChange={handleChange}
            required
            error={errors.Phone}
          />
          <div className="flex justify-end">
            <Button type="submit">Cadastrar</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default RegisterTeacherPage;
