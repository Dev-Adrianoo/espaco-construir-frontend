import React, { useState, useEffect } from "react";
import Input from "../components/Input";
import Select from "../components/Select";
import Textarea from "../components/Textarea";
import Button from "../components/Button";
import Card, { CardHeader, CardBody } from "../components/Card";
import { apiService } from "../services/api";
import { AxiosError } from "axios";
import authService from "../services/authService";
import LoadingSpinner from "../components/LoadingSpinner";

const gradeOptions = [
  { value: "kindergarten", label: "Educação Infantil" },
  { value: "1st", label: "1º ano" },
  { value: "2nd", label: "2º ano" },
  { value: "3rd", label: "3º ano" },
  { value: "4th", label: "4º ano" },
  { value: "5th", label: "5º ano" },
  { value: "6th", label: "6º ano" },
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

  const [loggedGuardianId, setLoggedGuardianId] = useState<string | null>(null);
  const [loggedGuardianName, setLoggedGuardianName] = useState<string | null>(
    null
  );
  const [loadingLoggedGuardian, setLoadingLoggedGuardian] = useState(true);
  const [loggedGuardianError, setLoggedGuardianError] = useState<string | null>(
    null
  );

  const [submissionStatus, setSubmissionStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [submissionMessage, setSubmissionMessage] = useState<string | null>(
    null
  );

  useEffect(() => {
    const fetchLoggedGuardian = async () => {
      const userId = authService.getUserId();
      if (!userId) {
        setLoggedGuardianError(
          "Você precisa estar logado para cadastrar um filho."
        );
        setLoadingLoggedGuardian(false);
        return;
      }

      try {
        setLoadingLoggedGuardian(true);
        const response = await apiService.getCurrentGuardian();
        setLoggedGuardianId(String(response.data.id));
        setLoggedGuardianName(response.data.name);
        setFormData((prev) => ({ ...prev, parent: String(response.data.id) }));
      } catch (err) {
        const error = err as AxiosError<{ message: string }>;
        setLoggedGuardianError(
          error.response?.data?.message ||
            "Erro ao carregar dados do responsável logado."
        );
      } finally {
        setLoadingLoggedGuardian(false);
      }
    };

    fetchLoggedGuardian();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    if (name === "parent") return;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loggedGuardianId) {
      setSubmissionStatus("error");
      setSubmissionMessage(
        "Responsável não identificado. Por favor, faça login novamente."
      );
      return;
    }

    setSubmissionStatus("loading");
    setSubmissionMessage(null);

    try {
      await apiService.registerStudent({
        name: formData.name,
        email: `${formData.name.toLowerCase().replace(/ /g, "")}@example.com`,
        password: "password123",
        phone: "11999999999",
        guardianId: Number(loggedGuardianId),
        age: Number(formData.age),
        grade: formData.grade,
        condition: formData.condition,
        difficulties: formData.difficulties,
      });
      setSubmissionStatus("success");
      setSubmissionMessage("Aluno cadastrado com sucesso!");

      setFormData({
        name: "",
        age: "",
        grade: "",
        difficulties: "",
        condition: "",
        classType: "in-person",
        parent: String(loggedGuardianId),
      });
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      setSubmissionStatus("error");
      setSubmissionMessage(
        error.response?.data?.message || "Erro ao cadastrar aluno."
      );
    } finally {
      setTimeout(() => {
        setSubmissionStatus("idle");
        setSubmissionMessage(null);
      }, 5000);
    }
  };

  if (loadingLoggedGuardian) {
    return (
      <div className="flex justify-center items-center h-40">
        <LoadingSpinner />
        <p className="ml-2 text-gray-500">Carregando dados do responsável...</p>
      </div>
    );
  }

  if (loggedGuardianError) {
    return (
      <div className="max-w-2xl mx-auto mt-8 bg-white rounded-xl shadow-md p-8 text-center">
        <h2 className="text-2xl font-bold mb-2">
          Erro ao carregar responsável
        </h2>
        <p className="text-gray-600">{loggedGuardianError}</p>
      </div>
    );
  }

  if (!loggedGuardianId) {
    return (
      <div className="max-w-2xl mx-auto mt-8 bg-white rounded-xl shadow-md p-8 text-center">
        <h2 className="text-2xl font-bold mb-2">Faça login como responsável</h2>
        <p className="text-gray-600">
          Você precisa estar logado como responsável para cadastrar um filho.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <h1 className="text-2xl font-bold text-gray-800">Cadastrar Aluno</h1>
          <p className="mt-1 text-gray-600">
            Por favor, forneça informações sobre o aluno para ajudar a
            personalizar a experiência de tutoria.
          </p>
        </CardHeader>

        <CardBody>
          {submissionStatus === "loading" && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-600">Cadastrando aluno...</p>
            </div>
          )}
          {submissionStatus === "success" && submissionMessage && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-600">{submissionMessage}</p>
            </div>
          )}
          {submissionStatus === "error" && submissionMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{submissionMessage}</p>
            </div>
          )}

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

            <Input
              label="Responsável"
              id="parent"
              name="parent"
              value={loggedGuardianName || ""}
              disabled
              readOnly
              required
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

            <Button type="submit" disabled={submissionStatus === "loading"}>
              {submissionStatus === "loading" ? "Cadastrando..." : "Cadastrar"}
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
};

export default ChildRegistrationPage;
