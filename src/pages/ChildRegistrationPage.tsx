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
import studentService, { Student, CreateStudentData } from "../services/studentService";
import MaskedInput from "../components/MaskedInput";
import { UserPlus, CalendarDays, GraduationCap, BookOpen, AlertCircle, Brain } from 'lucide-react';

interface Guardian {
  id: number;
  name: string;
  email: string;
  phone: string;
}

const gradeOptions = [
  { value: "Educação Infantil", label: "Educação Infantil" },
  { value: "1º ano", label: "1º ano" },
  { value: "2º ano", label: "2º ano" },
  { value: "3º ano", label: "3º ano" },
  { value: "4º ano", label: "4º ano" },
  { value: "5º ano", label: "5º ano" },
  { value: "6º ano", label: "6º ano" },
  { value: "7º ano", label: "7º ano" },
  { value: "8º ano", label: "8º ano" },
  { value: "9º ano", label: "9º ano" },
  { value: "1º ano EM", label: "1º ano EM" },
  { value: "2º ano EM", label: "2º ano EM" },
  { value: "3º ano EM", label: "3º ano EM" },
];

const ChildRegistrationPage: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<CreateStudentData>({
    name: "",
    birthDate: "",
    grade: "",
    difficulties: "",
    condition: "",
    guardianId: 0
  });

  const [loggedGuardianId, setLoggedGuardianId] = useState<number | null>(null);
  const [loggedGuardianName, setLoggedGuardianName] = useState<string | null>(null);
  const [loadingLoggedGuardian, setLoadingLoggedGuardian] = useState(true);
  const [loggedGuardianError, setLoggedGuardianError] = useState<string | null>(null);

  const [children, setChildren] = useState<Student[]>([]);
  const [loadingChildren, setLoadingChildren] = useState(false);
  const [childrenError, setChildrenError] = useState<string | null>(null);

  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [loadingGuardians, setLoadingGuardians] = useState(false);
  const [guardiansError, setGuardiansError] = useState<string | null>(null);

  const [submissionStatus, setSubmissionStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [submissionMessage, setSubmissionMessage] = useState<string | null>(null);

  const [editingChild, setEditingChild] = useState<Student | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [childToDelete, setChildToDelete] = useState<Student | null>(null);

  const navigate = useNavigate();

  // Função para formatar a data do input para o formato dd/MM/yyyy
  const formatDateForAPI = (inputDate: string): string => {
    if (!inputDate) return "";
    // Se a data já estiver no formato dd/MM/yyyy, retorna como está
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(inputDate)) {
      return inputDate;
    }
    // Se a data estiver no formato yyyy-MM-dd (formato do input type="date")
    if (/^\d{4}-\d{2}-\d{2}$/.test(inputDate)) {
      const [year, month, day] = inputDate.split('-');
      return `${day}/${month}/${year}`;
    }
    return "";
  };

  // Função para converter a data do formato dd/MM/yyyy para o formato do input date
  const formatDateForInput = (apiDate: string): string => {
    if (!apiDate) return "";
    const [day, month, year] = apiDate.split('/');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      const userId = authService.getUserId();
      if (!userId) {
        setLoggedGuardianError("Você precisa estar logado para cadastrar um aluno.");
        setLoadingLoggedGuardian(false);
        return;
      }

      try {
        setLoadingLoggedGuardian(true);

        // Se for professor, carrega a lista de responsáveis
        if (user?.role === "PROFESSORA") {
          setLoadingGuardians(true);
          try {
            const guardiansResponse = await apiService.getResponsibles();
            setGuardians(guardiansResponse.data);
            // Define guardianId como null para o backend pegar automaticamente
            setFormData(prev => ({ ...prev, guardianId: null }));
            setLoggedGuardianId(Number(userId));
          } catch (err) {
            const error = err as AxiosError<{ message: string }>;
            setGuardiansError(error.response?.data?.message || "Erro ao carregar responsáveis.");
          } finally {
            setLoadingGuardians(false);
          }
        } 
        // Se for responsável, carrega seus próprios dados
        else if (user?.role === "RESPONSAVEL") {
          try {
          const response = await apiService.getCurrentGuardian();
            if (!response.data?.id) {
              throw new Error("ID do responsável não encontrado");
            }
            
            const guardianId = response.data.id;
            setLoggedGuardianId(guardianId);
            setLoggedGuardianName(response.data.name);
            
            // Atualiza o guardianId no formData apenas se não estiver definido
            setFormData(prev => ({
              ...prev,
              guardianId: prev.guardianId || guardianId
            }));

          // Busca os filhos após carregar os dados do responsável
            try {
              setLoadingChildren(true);
              const childrenResponse = await studentService.getStudentsByResponsible(String(guardianId));
              setChildren(childrenResponse);
            } catch (err) {
              const error = err as AxiosError<{ message: string }>;
              setChildrenError(error.response?.data?.message || "Erro ao carregar filhos.");
              console.error("Erro ao carregar filhos:", err);
            } finally {
              setLoadingChildren(false);
            }
          } catch (err) {
            const error = err as AxiosError<{ message: string }>;
            setLoggedGuardianError("Erro ao carregar dados do responsável. Por favor, faça login novamente.");
            console.error("Erro ao carregar dados do responsável:", err);
          }
        }
      } catch (err) {
        const error = err as AxiosError<{ message: string }>;
        setLoggedGuardianError(error.response?.data?.message || "Erro ao carregar dados do usuário logado.");
      } finally {
        setLoadingLoggedGuardian(false);
      }
    };

    fetchInitialData();
  }, [user?.role]);

  // Efeito adicional para garantir que o guardianId seja mantido
  useEffect(() => {
    if (user?.role === "RESPONSAVEL" && loggedGuardianId && !formData.guardianId) {
      console.log('[useEffect] Restaurando guardianId:', loggedGuardianId);
      setFormData(prev => ({
        ...prev,
        guardianId: loggedGuardianId
      }));
    }
  }, [user?.role, loggedGuardianId, formData.guardianId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetForm = () => {
    // Preserva o guardianId atual
    const currentGuardianId = formData.guardianId;
    
    setFormData({
      name: "",
      birthDate: "",
      grade: "",
      difficulties: "",
      condition: "",
      // Mantém o guardianId atual ao invés de resetar
      guardianId: currentGuardianId
    });
    setEditingChild(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('[handleSubmit] Iniciando submissão do formulário');
    console.log('[handleSubmit] Tipo de usuário:', user?.role);
    console.log('[handleSubmit] Dados do formulário:', formData);
    
    // Se for responsável, precisa ter guardianId
    if (user?.role === "RESPONSAVEL") {
      if (!formData.guardianId) {

        try {
          const response = await apiService.getCurrentGuardian();
          if (!response.data?.id) {
            console.error('[handleSubmit] Erro: ID do responsável não encontrado');
            setSubmissionStatus("error");
            setSubmissionMessage("ID do responsável não encontrado. Por favor, faça login novamente.");
            return;
          }
          // Atualiza o guardianId no formData
          setFormData(prev => ({ ...prev, guardianId: response.data.id }));
        } catch (err) {
          console.error('[handleSubmit] Erro ao buscar ID do responsável:', err);
      setSubmissionStatus("error");
          setSubmissionMessage("Erro ao buscar dados do responsável. Por favor, faça login novamente.");
      return;
        }
      }
    }

    // Validação da data de nascimento
    if (!formData.birthDate || !/^\d{2}\/\d{2}\/\d{4}$/.test(formData.birthDate)) {
      console.error('[handleSubmit] Erro: Data de nascimento inválida:', formData.birthDate);
      setSubmissionStatus("error");
      setSubmissionMessage("Data de nascimento inválida. Use o formato DD/MM/AAAA");
      return;
    }

    try {
      console.log('[handleSubmit] Iniciando criação do estudante');
      setSubmissionStatus("loading");
      
      const studentData: CreateStudentData = {
        ...formData,
        birthDate: formData.birthDate
      };

      console.log('[handleSubmit] Dados do estudante a serem enviados:', studentData);

      if (editingChild) {
        console.log('[handleSubmit] Modo de edição - Atualizando estudante:', editingChild.id);
        await studentService.updateStudent(editingChild.id, studentData);
        setSubmissionMessage("Aluno atualizado com sucesso!");
      } else {
        console.log('[handleSubmit] Modo de criação - Criando novo estudante');
        await studentService.createStudent(studentData);
        setSubmissionMessage("Aluno cadastrado com sucesso!");
      }
      
      setSubmissionStatus("success");
      console.log('[handleSubmit] Operação concluída com sucesso');

      // Atualiza a lista de filhos se for responsável
      if (user?.role === "RESPONSAVEL" && loggedGuardianId) {
        console.log('[handleSubmit] Atualizando lista de filhos para o responsável:', loggedGuardianId);
        try {
        const updatedChildren = await studentService.getStudentsByResponsible(String(loggedGuardianId));
        setChildren(updatedChildren);
        } catch (err) {
          console.error('[handleSubmit] Erro ao atualizar lista de filhos:', err);
          // Não interrompe o fluxo se falhar ao atualizar a lista
        }
      }

      // Reseta o formulário mantendo o guardianId
      resetForm();
      
      // Redireciona após o sucesso apenas se for professora
      if (user?.role === "PROFESSORA") {
        console.log('[handleSubmit] Redirecionando para dashboard da professora');
        navigate("/teacher-dashboard");
      }
    } catch (err: any) {
      console.error('[handleSubmit] Erro durante a submissão:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      
      setSubmissionStatus("error");
      setSubmissionMessage(
        err.response?.data?.message || 
        "Erro ao cadastrar aluno. Por favor, tente novamente."
      );
    }
  };

  const handleEdit = (child: Student) => {

    console.log('[handleEdit] - Editando o filho:', child);
    
    setFormData({
      name: child.name,
      birthDate: child.birthDate,
      grade: child.grade,
      difficulties: child.difficulties || "",
      condition: child.condition || "",
      guardianId: child.guardianId
    });
    setEditingChild(child);
  };

  const handleDelete = async (child: Student) => {
    setChildToDelete(child);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!childToDelete) return;

    try {
      await studentService.deleteStudent(childToDelete.id);
      
      // Só atualiza a lista se a exclusão foi bem sucedida
      try {
      if (loggedGuardianId) {
        const updatedChildren = await studentService.getStudentsByResponsible(String(loggedGuardianId));
        setChildren(updatedChildren);
        }
      } catch (refreshError) {
        console.error('Erro ao atualizar lista após exclusão:', refreshError);
        // Não mostra erro para o usuário pois a exclusão foi bem sucedida
      }
      
      setIsDeleteModalOpen(false);
      setChildToDelete(null);
      setSubmissionStatus("success");
      setSubmissionMessage("Aluno removido com sucesso!");
    } catch (err: any) {
      console.error('Erro ao excluir aluno:', err);
      setSubmissionStatus("error");
      // Usa a mensagem de erro personalizada do serviço
      setSubmissionMessage(err.message || "Erro ao remover aluno.");
    }
  };

  // Se não houver usuário logado, mostra mensagem de erro
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-red-500">Você precisa estar logado para acessar esta página.</div>
      </div>
    );
  }

  // Se estiver carregando os dados iniciais
  if (loadingLoggedGuardian) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Se houver erro ao carregar os dados
  if (loggedGuardianError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-red-500">{loggedGuardianError}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6] p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Formulário de Cadastro */}
          <div className="w-full lg:w-1/2 bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-2 mb-2">
              <UserPlus className="w-6 h-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">
                {editingChild ? "Editar Aluno" : "Cadastrar Novo Aluno"}
              </h1>
            </div>

            <p className="text-gray-600 mb-6">
              Por favor, forneça as informações do aluno para personalizar a experiência de tutoria.
            </p>

            {submissionStatus === "success" && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-green-700">{submissionMessage}</p>
              </div>
            )}

            {submissionStatus === "error" && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-700">{submissionMessage}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex items-center gap-2 text-gray-700 mb-2">
                <UserPlus className="w-5 h-5" />
                <Input
                  label="Nome do Aluno"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Digite o nome completo do aluno"
                  className="w-full"
                />
              </div>

              <div className="flex items-center gap-2 text-gray-700 mb-2">
                <CalendarDays className="w-5 h-5" />
                <MaskedInput
                  label="Data de Nascimento"
                  id="birthDate"
                  name="birthDate"
                  value={formData.birthDate}
                  onChange={handleChange}
                  required
                  mask="99/99/9999"
                  placeholder="DD/MM/AAAA"
                  type="date"
                  className="w-full"
                />
              </div>

              <div className="flex items-center gap-2 text-gray-700 mb-2">
                <GraduationCap className="w-5 h-5" />
                <Select
                  label="Série"
                  id="grade"
                  name="grade"
                  value={formData.grade}
                  onChange={handleChange}
                  options={gradeOptions}
                  required
                  placeholder="Selecione a série do aluno"
                  className="w-full"
                />
              </div>

              <div className="flex items-center gap-2 text-gray-700 mb-2">
                <AlertCircle className="w-5 h-5" />
                <Textarea
                  label="Condição Específica (opcional)"
                  id="condition"
                  name="condition"
                  value={formData.condition}
                  onChange={handleChange}
                  placeholder="Descreva qualquer condição específica que o aluno possua"
                  className="w-full"
                />
              </div>

              <div className="flex items-center gap-2 text-gray-700 mb-2">
                <Brain className="w-5 h-5" />
                <Textarea
                  label="Dificuldades Específicas (opcional)"
                  id="difficulties"
                  name="difficulties"
                  value={formData.difficulties}
                  onChange={handleChange}
                  placeholder="Descreva as dificuldades de aprendizagem, se houver"
                  className="w-full"
                />
              </div>

              <div className="flex gap-4 justify-end pt-4">
                {editingChild && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={resetForm}
                  >
                    Cancelar Edição
                  </Button>
                )}
                <Button
                  type="submit"
                  variant="primary"
                  disabled={submissionStatus === "loading"}
                >
                  {submissionStatus === "loading" ? (
                    <div className="flex items-center">
                      <LoadingSpinner />
                      <span className="ml-2">Processando...</span>
                    </div>
                  ) : editingChild ? (
                    "Atualizar Aluno"
                  ) : (
                    "Cadastrar Aluno"
                  )}
                </Button>
              </div>
            </form>
          </div>

          {/* Lista de Alunos */}
          <div className="w-full lg:w-1/2 bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">
                Alunos Cadastrados
              </h2>
            </div>
            
            {loadingChildren ? (
              <div className="flex justify-center items-center h-32">
                <LoadingSpinner />
                <span className="ml-2 text-gray-600">Carregando alunos...</span>
              </div>
            ) : childrenError ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
                {childrenError}
              </div>
            ) : children.length === 0 ? (
              <p className="text-gray-500">Nenhum aluno cadastrado ainda.</p>
            ) : (
              <div className="space-y-4">
                {children.map((child) => (
                  <div
                    key={child.id}
                    className="border border-gray-200 p-4 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                      <div>
                        <h3 className="font-semibold text-gray-900">{child.name}</h3>
                        <p className="text-sm text-gray-600">Série: {child.grade}</p>
                        <p className="text-sm text-gray-600">
                          Data de Nascimento: {child.birthDate}
                        </p>
                        {child.condition && (
                          <p className="text-sm text-gray-600 mt-1">
                            <strong>Condição:</strong> {child.condition}
                          </p>
                        )}
                        {child.difficulties && (
                          <p className="text-sm text-gray-600 mt-1">
                            <strong>Dificuldades:</strong> {child.difficulties}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <Button
                          variant="secondary"
                          onClick={() => handleEdit(child)}
                          className="flex-1 sm:flex-none"
                        >
                          Editar
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() => handleDelete(child)}
                          className="flex-1 sm:flex-none"
                        >
                          Excluir
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de confirmação de exclusão */}
      {isDeleteModalOpen && childToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Confirmar Exclusão
            </h3>
            <p className="text-gray-600 mb-6">
              Tem certeza que deseja excluir o aluno {childToDelete.name}? 
              Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end gap-4">
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
