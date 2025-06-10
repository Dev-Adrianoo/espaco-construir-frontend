import api from './api';

export interface Student {
  id: string;
  name: string;
  birthDate: string;
  responsibleId: string;
  schoolYear: string;
  observations?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStudentData {
  name: string;
  birthDate: string;
  schoolYear: string;
  observations?: string;
}

export interface UpdateStudentData {
  name?: string;
  birthDate?: string;
  schoolYear?: string;
  observations?: string;
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
    const response = await api.post<Student>('/students', data);
    return response.data;
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