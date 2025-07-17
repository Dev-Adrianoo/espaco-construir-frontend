import React, { useState, useEffect } from "react";
import Input from "../components/Input";
import Select from "../components/Select";
import Textarea from "../components/Textarea";
import Button from "../components/Button";
import { apiService } from "../services/api";
import { AxiosError } from "axios";
import authService from "../services/authService";
import LoadingSpinner from "../components/LoadingSpinner";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { date, string, z } from 'zod';
import studentService, { Student, CreateStudentData } from "../services/studentService";
import MaskedInput from "../components/MaskedInput";
import { UserPlus, CalendarDays, GraduationCap, BookOpen, AlertCircle, Brain } from 'lucide-react';
import toast from "react-hot-toast";

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
    guardianId: null
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
  const [erros, setErros] = useState<{ [key: string]: string }>({});

  const [submissionStatus, setSubmissionStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [submissionMessage, setSubmissionMessage] = useState<string | null>(null);

  const [editingChild, setEditingChild] = useState<Student | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [childToDelete, setChildToDelete] = useState<Student | null>(null);

  const navigate = useNavigate();


  const formatDateForAPI = (inputDate: string): string => {
    if (!inputDate) return "";
  
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(inputDate)) {
      return inputDate;
    }
  
    if (/^\d{4}-\d{2}-\d{2}$/.test(inputDate)) {
      const [year, month, day] = inputDate.split('-');
      return `${day}/${month}/${year}`;
    }
    return "";
  };

 
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

      

      if (user?.role === "PROFESSORA") {
       
        setLoadingGuardians(true);
        try {
          const guardiansResponse = await apiService.getResponsibles();
          setGuardians(guardiansResponse.data);
        } catch (err) {
          const error = err as AxiosError<{ message: string }>;
          setGuardiansError(error.response?.data?.message || "Erro ao carregar responsáveis.");
        } finally {
          setLoadingGuardians(false);
      }


        setLoadingChildren(true); 
        try {
          console.log(`[PASSO 1] - KLEITÃO DA MASSA Usuário é professora. Chamada para o Id: ${userId}`)

          const studentsResponse = await apiService.getStudentsRegisteredByMe(Number(userId));

          console.log(`[PASSO 2 ] Resposta recebida da API: `, studentsResponse)
         
          const studentList = studentsResponse.data;


          if(Array.isArray(studentList)){
            console.log(`[PASSO 3] - Sucesso! ${studentList.length} alunos encontrados. `)
            setChildren(studentList)
          }else{
            console.warn("[AVISO] - a resposta para a Api não é um array ou está vazia...", studentList);
            setChildren([])
          }
        } catch (err) {
          const error = err as AxiosError<{ message: string }>;
          setChildrenError(error.response?.data?.message || "Erro ao carregar alunos da professora.");
        } finally {
          setLoadingChildren(false);
        }

      } 
        
        
        else if (user?.role === "RESPONSAVEL") {
          try {
          const response = await apiService.getCurrentGuardian();
            if (!response.data?.id) {
              throw new Error("ID do responsável não encontrado");
            }
            
            const guardianId = response.data.id;
            setLoggedGuardianId(guardianId);
            setLoggedGuardianName(response.data.name);
            
          
            setFormData(prev => ({
              ...prev,
              guardianId: prev.guardianId || guardianId
            }));

          
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
  
    if (name === 'guardianId') {

      const newGuardianId = value === "" ? null : parseInt(value, 10);
      
      setFormData(prev => ({
        ...prev,
        guardianId: newGuardianId
      }));
    } else {
     
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
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

  const alunoSchema = z.object({
    name: z.string().min(3, {message: "O nome deve ter no mínimo 3 caracteres."}),
  
    birthDate: z.string().refine((data) => {
      const regex = /^\d{2}\/\d{2}\/\d{4}$/;
      if (!regex.test(data)) return false;
  
      const [dia, mes, ano] = data.split('/').map(Number);
      const dataObj = new Date(ano, mes -1, dia);
  
      return dataObj.getFullYear() === ano && dataObj.getMonth() === mes -1 && dataObj.getDate() === dia && dataObj < new Date();
    }, {message: 'Data de nascimento inválida ou futura.'}),
  
    grade: z.string().nonempty({message: "A série é obrigatória."}),
    difficulties: z.string().optional(),
    condition: z.string().optional(),
  
  })


const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setSubmissionStatus("loading");

  try{
    alunoSchema.parse(formData);

  }catch (err) {
    if (err instanceof z.ZodError) {
      const fieldErrors: { [key: string]: string } = {};

      for (const issue of err.issues) {

        if (issue.path && typeof issue.path[0] === 'string') {
          fieldErrors[issue.path[0]] = issue.message;

        }
      }
      setErros(fieldErrors);

      toast.error("Por favor, corrija os erros indicados no formulário.");
    }
    setSubmissionStatus("idle");
    return
  }

  if (!user?.id) {
    setSubmissionMessage("Sua sessão expirou. Por favor, faça login novamente.");
    setSubmissionStatus("error");
    return;
  }

  if (!formData.birthDate) {
    setSubmissionMessage("Data de nascimento é obrigatória.");
    setSubmissionStatus("error");
    return;
  }

  try {
    const studentData: CreateStudentData = {
      name: formData.name,
      birthDate: formatDateForAPI(formData.birthDate), 
      grade: formData.grade,
      difficulties: formData.difficulties,
      condition: formData.condition,
      guardianId: Number(user.id)
    };

    if (editingChild) {
      console.log('[handleSubmit] Modo de edição. Enviando:', studentData);
      await studentService.updateStudent(editingChild.id, studentData);
      // setSubmissionMessage("Aluno atualizado com sucesso!");
      toast.success("Aluno atualizado com sucesso!");
    } else {
      console.log('[handleSubmit] Modo de criação. Enviando:', studentData);
      await studentService.createStudent(studentData);
      // setSubmissionMessage("Aluno cadastrado com sucesso!");
      toast.success("Aluno cadastrado com sucesso!")
    }
    
    setSubmissionStatus("success");
    resetForm();

  
    if (user?.role === "RESPONSAVEL") {
      const updatedChildren = await studentService.getStudentsByResponsible(String(user.id));
      setChildren(updatedChildren);
    }else if (user?.role === "PROFESSORA") {
      const updatedStudents = await apiService.getStudentsRegisteredByMe(Number(user.id));
      setChildren(updatedStudents.data)
    }
   
    if (user?.role === "PROFESSORA" && !editingChild) {
        navigate("/students"); 

    }

  } catch (err: any) {
    console.error('[handleSubmit] Erro durante a submissão:', err);
    setSubmissionStatus("error");
    setSubmissionMessage(err.message || "Erro desconhecido. Tente novamente.");

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


      if(user?.role == "PROFESSORA") {
        const updatedStudents = await apiService.getStudentsRegisteredByMe(Number(user.id));
        setChildren(updatedStudents.data);

      } else if (user?.role == "RESPONSAVEL") {
        const updatedChildren = await studentService.getStudentsByResponsible(String(user.id));
        setChildren(updatedChildren);
      }
  
      setIsDeleteModalOpen(false);
      setChildToDelete(null);
      setSubmissionStatus("success");
      // setSubmissionMessage("Aluno removido com sucesso!");
      toast.success("Aluno removido com sucesso!")
      
    } catch (err: any) {
      console.error('Erro ao excluir aluno:', err);
      setSubmissionStatus("error");
      
      setSubmissionMessage(err.message || "Erro ao remover aluno.");

    }
  };

 
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-red-500">Você precisa estar logado para acessar esta página.</div>
      </div>
    );
  }


  if (loadingLoggedGuardian) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <LoadingSpinner />
      </div>
    );
  }


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
              // <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
              //   <p className="text-green-700">{submissionMessage}</p>
              // </div>
              <span></span>
            )}

            {submissionStatus === "error" && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-700">{submissionMessage}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex-col items-center gap-2  text-gray-700 mb-2">
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
                  error={erros.name}
                  />
                  {/* {erros.name && <p className="text-[#B91C1C] border border-[#B91C1C] p-2 text-xs rounded-md">{erros.name}</p>} */}
              </div>

              <div className="flex-col items-center gap-2 text-gray-700 mb-2">
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
                  error={erros.birthDate}
                  />
                  {/* {erros.birthDate && <p className="text-[#B91C1C] border border-[#B91C1C] text-xs">{erros.birthDate}</p>} */}
              </div>

              <div className="flex-row items-center gap-2 text-gray-700 mb-2">
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
                  error={erros.grade}
                />
              </div>

              <div className="flex-row items-center gap-2 text-gray-700 mb-2">
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

              <div className="flex-row items-center gap-2 text-gray-700 mb-2">
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
                {user?.role === "PROFESSORA" ? 'Alunos Cadastrados' : 'Filhos Cadastrados'}
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
                        <p className="text-sm text-gray-600"><strong>Série: </strong>{child.grade}</p>
                        <p className="text-sm text-gray-600">
                          <strong>Data de Nascimento: </strong>{child.birthDate}
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
                          className="flex-1 border border-black sm:flex-none"
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
