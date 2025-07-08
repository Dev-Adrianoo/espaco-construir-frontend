import { apiService } from './api';
import { AxiosError } from 'axios';
import { ScheduleDTO } from './api';
import scheduleService from './scheduleService';

export interface Student {
  id: string;
  name: string;
  birthDate: string;
  grade: string;
  difficulties?: string;
  condition?: string;
  guardianId: number;
  age: number;

}

export interface CreateStudentData {
  name: string;
  birthDate: string;  
  grade: string;
  difficulties?: string;
  condition?: string;
  guardianId: number | null;
}

export interface UpdateStudentData {
  name?: string;
  birthDate?: string;
  grade?: string;
  difficulties?: string;
  condition?: string;
  guardianId?: number | null;
}

const handleError = (error: any) => {
  // Erros de permissão
  if (error.response?.status === 403) {
    throw new Error('Você não tem permissão para realizar esta operação.');
  }
  // Erros de validação
  if (error.response?.status === 400) {
    throw new Error(error.response.data?.message || 'Dados inválidos. Por favor, verifique as informações.');
  }
  // Erros de autenticação - não propaga o erro original
  if (error.response?.status === 401) {
    throw new Error('Sua sessão expirou. Por favor, faça login novamente.');
  }
  // Outros erros
  throw new Error(error.response?.data?.message || 'Ocorreu um erro. Por favor, tente novamente.');
};

const studentService = {
  async getStudents(): Promise<Student[]> {
    try {
      const response = await apiService.getStudents();
      return response.data;
    } catch (error) {
      handleError(error);
      throw new Error('Erro ao buscar alunos.');
    }
  },

  async getStudentsByResponsible(responsibleId: string): Promise<Student[]> {
    try {
      const response = await apiService.getChildrenByResponsible(Number(responsibleId));
      return response.data;
    } catch (error) {
      handleError(error);
      throw new Error('Erro ao buscar alunos do responsável.');
    }
  },

  async getStudent(id: string): Promise<Student> {
    try {
      const response = await apiService.getStudent(Number(id));
      return response.data;
    } catch (error) {
      handleError(error);
      throw new Error('Erro ao buscar dados do aluno.');
    }
  },

  async createStudent(data: CreateStudentData): Promise<Student> {
    try {
      const response = await apiService.registerStudent({
        name: data.name,
        email: "",
        password: "",
        phone: "",
        guardianId: data.guardianId || 0, 
        grade: data.grade,
        birthDate: data.birthDate,
        condition: data.condition || "",
        difficulties: data.difficulties || "",
      });
      return response.data;
    } catch (error) {
      handleError(error);
      throw new Error('Erro ao cadastrar aluno.');
    }
  },

  async updateStudent(id: string, data: CreateStudentData): Promise<Student> {
    try {
      const response = await apiService.updateStudent(Number(id), {
        name: data.name,
        birthDate: data.birthDate,
        grade: data.grade,
        condition: data.condition ?? "",
        difficulties: data.difficulties ?? "",
        guardianId: data.guardianId ?? 0
      });
      return response.data;
    } catch (error) {
      handleError(error);
      throw new Error('Erro ao atualizar dados do aluno.');
    }
  },

  async deleteStudent(id: string): Promise<void> {
    try {
      await apiService.deleteStudent(Number(id));
    } catch (error: any) {
      // Se for erro de permissão
      if (error.response?.status === 403) {
        throw new Error('Você não tem permissão para excluir este aluno.');
      }
      // Se o aluno tiver aulas agendadas
      if (error.response?.status === 400) {
        throw new Error('Não é possível excluir o aluno pois ele possui aulas agendadas. Por favor, cancele todas as aulas antes de excluir.');
      }
      // Outros erros
      throw new Error('Erro ao excluir aluno. Por favor, tente novamente.');
    }
  }
};

export default studentService; 