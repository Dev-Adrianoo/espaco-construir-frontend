import React, { useState } from "react";
import Card, { CardHeader, CardBody, CardFooter } from "../components/Card";
import Input from "../components/Input";
import Button from "../components/Button";
import { apiService } from "../services/api";

const RegisterTeacherPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    Phone: "",
    CPNJ: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ADICIONAR TRY CATCH
  // FEEDBACK PARA O USUARIO DEPOIS DO CADASTRO
  // VALIDACAO DOS DADOS
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const response  = await apiService.registerTeacher(
      {
      name: formData.name, 
      email: formData.email,
      password: formData.password,
      phone: formData.Phone, 
      cnpj: formData.CPNJ
    }
    );
    console.log(response);
    setFormData({ name: "", email: "", password: "", Phone: "", CPNJ: "" });
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
            <Input
              label="CPNJ"
              id="CPNJ"
              name="CPNJ"
              placeholder="Digite o CPNJ"
              value={formData.CPNJ}
              onChange={handleChange}
              required
            />
            <Input 
              label="Telefone"
              id="Phone"
              name="Phone"
              placeholder="Digite o telefone" 
              value={formData.Phone}
              onChange={handleChange}
              required
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
