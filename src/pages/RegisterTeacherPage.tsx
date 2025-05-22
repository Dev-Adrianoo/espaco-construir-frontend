import React, { useState } from "react";
import Card, { CardHeader, CardBody, CardFooter } from "../components/Card";
import Input from "../components/Input";
import Button from "../components/Button";

const RegisterTeacherPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, send data to backend
    alert(`Professor(a) cadastrado(a): ${formData.name}, ${formData.email}`);
    setFormData({ name: "", email: "" });
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
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Nome do Professor(a)"
              id="name"
              name="name"
              placeholder="Digite o nome"
              value={formData.name}
              onChange={handleChange}
              required
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

export default RegisterTeacherPage;
