import api from './api';

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
  birthDate: string;  // formato "dd/MM/yyyy"
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

const studentService = {
  async getStudents(): Promise<Student[]> {
    const response = await api.get<Student[]>('/students');
    return response.data;
  },

  async getStudentsByResponsible(responsibleId: string): Promise<Student[]> {
    const response = await api.get<Student[]>(`/guardians/children?responsavelId=${responsibleId}`);
    return response.data;
  },

  async getStudent(id: string): Promise<Student> {
    const response = await api.get<Student>(`/students/${id}`);
    return response.data;
  },

  async createStudent(data: CreateStudentData): Promise<Student> {
    try {
      // Obtém o tipo de usuário do localStorage
      const userType = localStorage.getItem('userType');
      console.log('[createStudent] Tipo de usuário:', userType);
      console.log('[createStudent] Dados recebidos:', data);
      
      // Define o endpoint baseado no tipo de usuário
      const endpoint = userType === 'PROFESSORA' 
        ? '/students/register/teacher'
        : '/students/register';
      console.log('[createStudent] Endpoint selecionado:', endpoint);
      
      // Remove guardianId se for professora
      const payload = userType === 'PROFESSORA' 
        ? {
            name: data.name,
            birthDate: data.birthDate,
            grade: data.grade,
            difficulties: data.difficulties,
            condition: data.condition
          }
        : data;
      
      console.log('[createStudent] Payload a ser enviado:', payload);
      
      const response = await api.post<Student>(endpoint, payload);
      console.log('[createStudent] Resposta do servidor:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('[createStudent] Erro ao criar estudante:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers
      });
      throw error;
    }
  },

  async updateStudent(id: string, data: UpdateStudentData): Promise<Student> {
    const response = await api.put<Student>(`/students/${id}`, data);
    return response.data;
  },

  async deleteStudent(id: string): Promise<void> {
    await api.delete(`/students/${id}`);
  }
};

export default studentService; 