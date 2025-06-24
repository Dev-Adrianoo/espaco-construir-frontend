import React, { useState, useEffect } from "react";
import Input from "../components/Input";
import Select from "../components/Select";
import Textarea from "../components/Textarea";
import Button from "../components/Button";
// import Card, { CardHeader, CardBody } from "../components/Card";
import { apiService } from "../services/api";
import { AxiosError } from "axios";
import authService from "../services/authService";
import LoadingSpinner from "../components/LoadingSpinner";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import studentService from "../services/studentService";

interface Child {
  id: string;
  name: string;
  age: number;
  grade: string;
  difficulties?: string;
  condition?: string;
}

const gradeOptions = [
  { value: "kindergarten", label: "Educação Infantil" },
  { value: "1", label: "1º ano" },
  { value: "2", label: "2º ano" },
  { value: "3", label: "3º ano" },
  { value: "4", label: "4º ano" },
  { value: "5", label: "5º ano" },
  { value: "6", label: "6º ano" },
  { value: "7", label: "7º ano" },
  { value: "8", label: "8º ano" },
  { value: "9", label: "9º ano" },
  { value: "10", label: "1º ano EM" },
  { value: "11", label: "2º ano EM" },
  { value: "12", label: "3º ano EM" },
];

const gradeMap: { [key: string]: string } = {
  'kindergarten': 'Educação Infantil',
  '1': '1º ano',
  '2': '2º ano',
  '3': '3º ano',
  '4': '4º ano',
  '5': '5º ano',
  '6': '6º ano',
  '7': '7º ano',
  '8': '8º ano',
  '9': '9º ano',
  '10': '1º ano EM',
  '11': '2º ano EM',
  '12': '3º ano EM',
};

const ChildRegistrationPage: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    birthDate: "",
    grade: "",
    difficulties: "",
    condition: "",
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

  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [childToDelete, setChildToDelete] = useState<Child | null>(null);

  const navigate = useNavigate();

  const calculateAge = (birthDate: string): number => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

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
            const formattedChildren = childrenResponse.data.map((child: any) => ({
              id: String(child.id),
              name: child.name,
              age: child.age,
              grade: child.grade,
              difficulties: child.difficulties,
              condition: child.condition
            }));
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

  const resetForm = () => {
    setFormData({
      name: "",
      birthDate: "",
      grade: "",
      difficulties: "",
      condition: "",
      parent: String(loggedGuardianId),
    });
    setEditingChild(null);
  };

  const handleEdit = (child: Child) => {
    // Convert grade back to select value
    const gradeValue = Object.entries(gradeMap).find(([_, value]) => value === child.grade)?.[0] || "";
    
    // Calculate birthdate from age
    const today = new Date();
    const birthYear = today.getFullYear() - child.age;
    const birthDate = new Date(birthYear, 0, 1).toISOString().split('T')[0];

    setFormData({
      name: child.name,
      birthDate,
      grade: gradeValue,
      difficulties: child.difficulties || "",
      condition: child.condition || "",
      parent: String(loggedGuardianId),
    });
    setEditingChild(child);
  };

  const handleDelete = async (child: Child) => {
    setChildToDelete(child);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!childToDelete) return;

    try {
      await studentService.deleteStudent(childToDelete.id);
      
      // Refresh the children list
      const updatedChildren = await apiService.getChildrenByResponsible(Number(loggedGuardianId));
      const formattedChildren = updatedChildren.data.map((child: any) => ({
        id: String(child.id),
        name: child.name,
        age: child.age,
        grade: child.grade,
        difficulties: child.difficulties,
        condition: child.condition
      }));
      setChildren(formattedChildren);
      
      setSubmissionStatus("success");
      setSubmissionMessage("Aluno excluído com sucesso!");
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      setSubmissionStatus("error");
      setSubmissionMessage(error.response?.data?.message || "Erro ao excluir aluno.");
    } finally {
      setIsDeleteModalOpen(false);
      setChildToDelete(null);
      setTimeout(() => {
        setSubmissionStatus("idle");
        setSubmissionMessage(null);
      }, 5000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loggedGuardianId) {
      setSubmissionStatus("error");
      setSubmissionMessage("Responsável não identificado. Por favor, faça login novamente.");
      return;
    }

    setSubmissionStatus("loading");
    setSubmissionMessage(null);

    try {
      const age = calculateAge(formData.birthDate);
      const studentData = {
        name: formData.name,
        age: age,
        grade: gradeMap[formData.grade] || formData.grade,
        difficulties: formData.difficulties,
        condition: formData.condition,
        guardianId: Number(loggedGuardianId)
      };

      if (editingChild) {
        await studentService.updateStudent(editingChild.id, studentData);
        setSubmissionMessage("Aluno atualizado com sucesso!");
      } else {
        await studentService.createStudent(studentData);
        setSubmissionMessage("Aluno cadastrado com sucesso!");
      }
      
      setSubmissionStatus("success");
      resetForm();

      // Refresh the children list
      const updatedChildren = await apiService.getChildrenByResponsible(Number(loggedGuardianId));
      const formattedChildren = updatedChildren.data.map((child: any) => ({
        id: String(child.id),
        name: child.name,
        age: child.age,
        grade: child.grade,
        difficulties: child.difficulties,
        condition: child.condition
      }));
      setChildren(formattedChildren);
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      setSubmissionStatus("error");
      setSubmissionMessage(error.response?.data?.message || `Erro ao ${editingChild ? 'atualizar' : 'cadastrar'} aluno.`);
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
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Formulário */}
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {editingChild ? "Editar Aluno" : (user?.role === "RESPONSAVEL" ? "Cadastrar Filho" : "Cadastrar Aluno")}
            </h1>
            
            <p className="text-gray-600 mb-6">
              {user?.role === "RESPONSAVEL" 
                ? "Por favor, forneça informações sobre seu filho para ajudar a personalizar a experiência de tutoria."
                : "Por favor, forneça informações sobre o aluno para ajudar a personalizar a experiência de tutoria."
              }
            </p>

            {submissionStatus === "loading" && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-blue-700">Cadastrando aluno...</p>
              </div>
            )}

            {submissionStatus === "success" && submissionMessage && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-green-700">{submissionMessage}</p>
              </div>
            )}

            {submissionStatus === "error" && submissionMessage && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-700">{submissionMessage}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                label="Nome Completo"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Digite o nome completo"
              />

              <Input
                label="Data de Nascimento"
                id="birthDate"
                name="birthDate"
                type="date"
                value={formData.birthDate}
                onChange={handleChange}
                required
              />

              <Select
                label="Série Escolar"
                id="grade"
                name="grade"
                value={formData.grade}
                onChange={handleChange}
                required
                options={gradeOptions}
              />

              <Textarea
                label="Dificuldades de Aprendizagem (se houver)"
                id="difficulties"
                name="difficulties"
                value={formData.difficulties}
                onChange={handleChange}
                placeholder="Descreva quaisquer dificuldades de aprendizagem ou necessidades educacionais especiais"
              />

              <Textarea
                label="Condição Pessoal"
                id="condition"
                name="condition"
                value={formData.condition}
                onChange={handleChange}
                placeholder="Qualquer condição médica, alergias ou preferências pessoais que devemos conhecer"
              />

              <div className="flex justify-end space-x-4">
                {editingChild && (
                  <Button 
                    type="button" 
                    onClick={resetForm}
                    variant="secondary"
                  >
                    Cancelar
                  </Button>
                )}
                <Button type="submit" disabled={submissionStatus === "loading"}>
                  {submissionStatus === "loading" 
                    ? "Salvando..." 
                    : editingChild 
                      ? "Salvar Alterações" 
                      : "Cadastrar"
                  }
                </Button>
              </div>
            </form>
          </div>

          {/* Lista de Alunos */}
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Alunos Cadastrados</h2>
            {children.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Nenhum aluno cadastrado ainda.</p>
            ) : (
              <div className="space-y-4">
                {children.map((child) => (
                  <div
                    key={child.id}
                    className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-900">{child.name}</h3>
                        <p className="text-sm text-gray-600">
                          {child.age} anos, {child.grade}
                        </p>
                        {child.difficulties && (
                          <p className="text-sm text-gray-500 mt-1">
                            <strong>Dificuldades:</strong> {child.difficulties}
                          </p>
                        )}
                        {child.condition && (
                          <p className="text-sm text-gray-500">
                            <strong>Condições:</strong> {child.condition}
                          </p>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(child)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(child)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && childToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Confirmar Exclusão</h3>
            <p className="text-gray-600 mb-6">
              Tem certeza que deseja excluir o aluno {childToDelete.name}? Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end space-x-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setChildToDelete(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                onClick={confirmDelete}
              >
                Excluir
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChildRegistrationPage;
