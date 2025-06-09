import React, { useState, useEffect } from "react";
import Input from "../components/Input";
import Select from "../components/Select";
import Textarea from "../components/Textarea";
import Button from "../components/Button";
import Card, { CardHeader, CardBody, CardFooter } from "../components/Card";
import { apiService } from "../services/api";
import { AxiosError } from "axios";

const gradeOptions = [
  { value: "kindergarten", label: "Educação Infantil" },
  { value: "1st", label: "1º ano" },
  { value: "2nd", label: "2º ano" },
  { value: "3rd", label: "3º ano" },
  { value: "4th", label: "4º ano" },
  { value: "5th", label: "5º ano" },
  { value: "6th", label: "6º ano" },
];

interface GuardianOption {
  value: string;
  label: string;
}

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

  const [guardians, setGuardians] = useState<GuardianOption[]>([]);
  const [loadingGuardians, setLoadingGuardians] = useState(true);
  const [guardiansError, setGuardiansError] = useState<string | null>(null);

  const [submissionStatus, setSubmissionStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [submissionMessage, setSubmissionMessage] = useState<string | null>(
    null
  );

  useEffect(() => {
    const fetchGuardians = async () => {
      try {
        const response = await apiService.getResponsibles();
        const options = response.data.map((guardian: any) => ({
          value: String(guardian.id),
          label: guardian.name,
        }));
        setGuardians(options);
      } catch (err) {
        const error = err as AxiosError<{ message: string }>;
        setGuardiansError(
          error.response?.data?.message || "Erro ao carregar responsáveis."
        );
      } finally {
        setLoadingGuardians(false);
      }
    };

    fetchGuardians();
  }, []);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmissionStatus("loading");
    setSubmissionMessage(null);

    try {
      await apiService.registerStudent({
        name: formData.name,
        email: `${formData.name.toLowerCase().replace(/ /g, "")}@example.com`, // Assuming a simple email for now
        password: "password123", // Assuming a default password for now
        phone: "11999999999", // Assuming a default phone for now
        guardianId: Number(formData.parent),
        age: Number(formData.age),
        grade: formData.grade,
        condition: formData.condition,
        difficulties: formData.difficulties,
      });
      setSubmissionStatus("success");
      setSubmissionMessage("Aluno cadastrado com sucesso!");

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
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      setSubmissionStatus("error");
      setSubmissionMessage(
        error.response?.data?.message || "Erro ao cadastrar aluno."
      );
    } finally {
      // Optionally hide message after a few seconds
      setTimeout(() => {
        setSubmissionStatus("idle");
        setSubmissionMessage(null);
      }, 5000);
    }
  };

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

          {loadingGuardians ? (
            <p className="text-center text-gray-500">
              Carregando responsáveis...
            </p>
          ) : guardiansError ? (
            <p className="text-center text-red-500">Erro: {guardiansError}</p>
          ) : (
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
                    <span className="ml-2 text-sm text-gray-700">
                      Presencial
                    </span>
                  </label>
                </div>
              </div>

              <Select
                label="Responsável"
                id="parent"
                name="parent"
                options={guardians}
                value={formData.parent}
                onChange={handleChange}
                placeholder="Vincular ao responsável"
                required
              />

              <CardFooter className="flex justify-end">
                <Button variant="outline" className="mr-3">
                  Cancelar
                </Button>
                <Button type="submit" disabled={submissionStatus === "loading"}>
                  {submissionStatus === "loading"
                    ? "Cadastrando..."
                    : "Cadastrar"}
                </Button>
              </CardFooter>
            </form>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default ChildRegistrationPage;
