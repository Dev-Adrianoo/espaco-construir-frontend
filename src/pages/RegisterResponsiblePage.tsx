import React, { useState } from "react";
import Card, { CardHeader, CardBody, CardFooter } from "../components/Card";
import Input from "../components/Input";
import Button from "../components/Button";

const RegisterResponsiblePage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, send data to backend
    alert(`Responsável cadastrado: ${formData.name}, ${formData.phone}`);
    setFormData({ name: "", phone: "" });
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
            <CardFooter className="flex justify-end">
              <Button type="submit">Cadastrar</Button>
            </CardFooter>
          </form>
        </CardBody>
      </Card>
    </div>
  );
};

export default RegisterResponsiblePage;
