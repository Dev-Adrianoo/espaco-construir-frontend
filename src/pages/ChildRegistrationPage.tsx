import React, { useState, useEffect, useContext } from "react";
import Input from "../components/Input";
import Select from "../components/Select";
import Textarea from "../components/Textarea";
import Button from "../components/Button";
// import Card, { CardHeader, CardBody } from "../components/Card";
import { apiService } from "../services/api";
import { AxiosError } from "axios";
import authService from "../services/authService";
import LoadingSpinner from "../components/LoadingSpinner";
import { AuthContext } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface Child {
  id: string;
  name: string;
  age: number;
  grade: string;
  classType: string;
}

const gradeOptions = [
  { value: "kindergarten", label: "Educação Infantil" },
  { value: "1st", label: "1º ano" },
  { value: "2nd", label: "2º ano" },
  { value: "3rd", label: "3º ano" },
  { value: "4th", label: "4º ano" },
  { value: "5th", label: "5º ano" },
  { value: "6th", label: "6º ano" },
  { value: "7th", label: "7º ano" },
  { value: "8th", label: "8º ano" },
  { value: "9th", label: "9º ano" },
  { value: "10th", label: "1º ano do Ensino Médio" },
  { value: "11th", label: "2º ano do Ensino Médio" },
  { value: "12th", label: "3º ano do Ensino Médio" },
];

const ChildRegistrationPage: React.FC = () => {
  const { user } = useContext(AuthContext);
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

  const [children, setChildren] = useState<Child[]>([]);
  const [loadingChildren, setLoadingChildren] = useState(true);
  const [childrenError, setChildrenError] = useState<string | null>(null);

  const [submissionStatus, setSubmissionStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [submissionMessage, setSubmissionMessage] = useState<string | null>(
    null
  );

  const navigate = useNavigate();

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

        // Fetch children after guardian data is loaded
        if (response.data.id) {
          try {
            setLoadingChildren(true);
            const childrenResponse = await apiService.getChildrenByResponsible(
              Number(response.data.id)
            );
            const formattedChildren = childrenResponse.data.map(
              (child: {
                id: number;
                name: string;
                age: number;
                grade: string;
                classType: string;
              }) => ({
                ...child,
                id: String(child.id),
              })
            );
            setChildren(formattedChildren);
          } catch (err) {
            const error = err as AxiosError<{ message: string }>;
            setChildrenError(
              error.response?.data?.message || "Erro ao carregar filhos."
            );
            console.error("Erro ao carregar filhos:", err);
          } finally {
            setLoadingChildren(false);
          }
        }
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

  if (loadingLoggedGuardian || loadingChildren) {
    return (
      <div className="flex justify-center items-center h-40">
        <LoadingSpinner />
        <p className="ml-2 text-gray-500">Carregando dados do responsável...</p>
      </div>
    );
  }

  if (loggedGuardianError || childrenError) {
    return (
      <div className="max-w-2xl mx-auto mt-8 bg-white rounded-xl shadow-md p-8 text-center">
        <h2 className="text-2xl font-bold mb-2">
          Erro ao carregar responsável
        </h2>
        <p className="text-gray-600">{loggedGuardianError}</p>
        {childrenError && <p className="text-gray-600">{childrenError}</p>}
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
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {user?.role === "RESPONSAVEL" ? "Cadastrar Filho" : "Cadastrar Aluno"}
          </h1>
          
          <p className="text-gray-600 mb-6">
            {user?.role === "RESPONSAVEL" 
              ? "Por favor, forneça informações sobre seu filho para ajudar a personalizar a experiência de tutoria."
              : "Por favor, forneça informações sobre o aluno para ajudar a personalizar a experiência de tutoria."
            }
          </p>

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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {user?.role === "RESPONSAVEL" ? "Nome Completo do Filho" : "Nome Completo do Aluno"} *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder={user?.role === "RESPONSAVEL" ? "Digite o nome do seu filho" : "Digite o nome do aluno"}
                className="w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Idade *
              </label>
              <input
                type="number"
                value={formData.age}
                onChange={handleChange}
                placeholder="Digite a idade"
                className="w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                required
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Série Escolar *
              </label>
              <select
                value={formData.grade}
                onChange={handleChange}
                className="w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Selecione a série</option>
                <option value="kindergarten">Educação Infantil</option>
                <option value="1st">1º ano</option>
                <option value="2nd">2º ano</option>
                <option value="3rd">3º ano</option>
                <option value="4th">4º ano</option>
                <option value="5th">5º ano</option>
                <option value="6th">6º ano</option>
                <option value="7th">7º ano</option>
                <option value="8th">8º ano</option>
                <option value="9th">9º ano</option>
                <option value="10th">1º ano do Ensino Médio</option>
                <option value="11th">2º ano do Ensino Médio</option>
                <option value="12th">3º ano do Ensino Médio</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dificuldades de Aprendizagem (se houver)
              </label>
              <textarea
                value={formData.difficulties}
                onChange={handleChange}
                placeholder="Descreva quaisquer dificuldades de aprendizagem ou necessidades educacionais especiais"
                className="w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 min-h-[100px]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Condição Pessoal
              </label>
              <textarea
                value={formData.condition}
                onChange={handleChange}
                placeholder="Qualquer condição médica, alergias ou preferências pessoais que devemos conhecer"
                className="w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 min-h-[100px]"
              />
            </div>

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

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submissionStatus === "loading"}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex items-center gap-2"
              >
                {submissionStatus === "loading" ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Cadastrando...</span>
                  </>
                ) : (
                  <span>Cadastrar</span>
                )}
              </button>
            </div>
          </form>

          {children.length > 0 && (
            <div className="mt-4 p-3 bg-white rounded-md">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Filhos Cadastrados
              </h2>
              <div className="flex flex-col gap-4">
                {children.map((child) => (
                  <div
                    key={child.id}
                    className="p-5 border border-gray-200 rounded-lg bg-white shadow-sm flex items-center justify-between transition-all duration-200 hover:shadow-md"
                  >
                    <div>
                      <p className="font-semibold text-lg text-gray-800 mb-1">
                        {child.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {child.age} anos,{" "}
                        {child.grade === "kindergarten"
                          ? "Educação Infantil"
                          : `${child.grade}º ano`}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="primary" size="sm">
                        Editar
                      </Button>
                      <Button variant="danger" size="sm">
                        Excluir
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChildRegistrationPage;
