import React, { useState } from "react";
import Input from "../components/Input";
import Select from "../components/Select";
import Textarea from "../components/Textarea";
import Button from "../components/Button";
import Card, { CardHeader, CardBody, CardFooter } from "../components/Card";

const gradeOptions = [
  { value: "kindergarten", label: "Educação Infantil" },
  { value: "1st", label: "1º ano" },
  { value: "2nd", label: "2º ano" },
  { value: "3rd", label: "3º ano" },
  { value: "4th", label: "4º ano" },
  { value: "5th", label: "5º ano" },
  { value: "6th", label: "6º ano" },
];

const parentOptions = [
  { value: "parent1", label: "João Silva" },
  { value: "parent2", label: "Maria Santos" },
];

// Mock children data for demonstration
const MOCK_CHILDREN = [
  {
    id: "1",
    name: "Lucas Silva",
    age: 8,
    grade: "3º ano",
    classType: "Presencial",
  },
  {
    id: "2",
    name: "Maria Souza",
    age: 10,
    grade: "5º ano",
    classType: "Online",
  },
];

const ChildRegistrationPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    grade: "",
    difficulties: "",
    condition: "",
    classType: "in-person",
    parent: "",
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      classType: e.target.value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would send the data to a backend
    console.log("Form submitted:", formData);

    // Reset form after submission
    setFormData({
      name: "",
      age: "",
      grade: "",
      difficulties: "",
      condition: "",
      classType: "in-person",
      parent: "",
    });

    // Show success message or redirect
    alert("Child registered successfully!");
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <h1 className="text-2xl font-bold text-gray-800">Cadastrar Aluno</h1>
          <p className="mt-1 text-gray-600">
            Por favor, forneça informações sobre o aluno para ajudar a personalizar a experiência de tutoria.
          </p>
        </CardHeader>

        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Nome Completo do Aluno"
                id="name"
                name="name"
                placeholder="Digite o nome do aluno"
                value={formData.name}
                onChange={handleChange}
                required
              />

              <Input
                label="Idade"
                id="age"
                name="age"
                type="number"
                placeholder="Digite a idade do aluno"
                value={formData.age}
                onChange={handleChange}
                required
              />
            </div>

            <Select
              label="Série Escolar"
              id="grade"
              name="grade"
              options={gradeOptions}
              value={formData.grade}
              onChange={handleChange}
              placeholder="Selecione a série"
              required
            />

            <Textarea
              label="Dificuldades de Aprendizagem (se houver)"
              id="difficulties"
              name="difficulties"
              placeholder="Descreva quaisquer dificuldades de aprendizagem ou necessidades educacionais especiais"
              value={formData.difficulties}
              onChange={handleChange}
            />

            <Textarea
              label="Condição Pessoal"
              id="condition"
              name="condition"
              placeholder="Qualquer condição médica, alergias ou preferências pessoais que devemos conhecer"
              value={formData.condition}
              onChange={handleChange}
            />

            <div className="space-y-2">
              <p className="block text-sm font-medium text-gray-700">
                Tipo de Aula
              </p>
              <div className="flex space-x-6">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio h-4 w-4 text-indigo-600"
                    name="classType"
                    value="online"
                    checked={formData.classType === "online"}
                    onChange={handleRadioChange}
                  />
                  <span className="ml-2 text-sm text-gray-700">Online</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio h-4 w-4 text-indigo-600"
                    name="classType"
                    value="in-person"
                    checked={formData.classType === "in-person"}
                    onChange={handleRadioChange}
                  />
                  <span className="ml-2 text-sm text-gray-700">Presencial</span>
                </label>
              </div>
            </div>

            <Select
              label="Responsável"
              id="parent"
              name="parent"
              options={parentOptions}
              value={formData.parent}
              onChange={handleChange}
              placeholder="Vincular ao responsável"
              required
            />
          </form>
        </CardBody>

        <CardFooter className="flex justify-end">
          <Button variant="outline" className="mr-3">
            Cancelar
          </Button>
          <Button type="submit">
            Cadastrar
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ChildRegistrationPage;
