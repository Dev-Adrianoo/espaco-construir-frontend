import axios from 'axios';

export interface ScheduleDTO {
  id: number;
  studentId: number;
  teacherId: number | null;
  startTime: string;
  endTime: string;
  subject: string;
  description: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  meetingLink: string | null;
  modality: 'IN_PERSON' | 'ONLINE' | 'HYBRID';
  studentName?: string;
  difficulties: string;
  condition: string;
}

export interface TeacherStudent {
  id: number;
  name: string;
  age: number;
  grade: string;
  guardian: { name: string };
  parentName: string;
  parentContact: string;
  learningDifficulties: string;
  personalCondition: string;
  classType: 'IN_PERSON' | 'ONLINE' | 'HYBRID';
}

export interface TeacherDetails {
  id: number;
  name: string;
  email: string;
  phone: string;
  cnpj: string;
}

export interface BookClassPayload {
  studentIds: number[];
  date: string;
  time: string;
  modality: string;
  guardianId: string;
  teacherId: number;
  difficulties?: string;
  condition?: string;
}

export interface ClassHistoryDTO {
  id?: number;
  studentId: number;
  teacherId: number;
  classId?: number | null;
  comment: string;
  createdAt?: string;
  guardianId?: number | null;
}

const api = axios.create({
  baseURL: '/api',
  timeout: Number(import.meta.env.VITE_API_TIMEOUT) || 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // IGNORA COMPLETAMENTE qualquer erro do endpoint de verificação
    if (originalRequest.url === '/auth/verify') {
      return Promise.reject(error);
    }

    // Se for erro 401 e for uma tentativa de refresh token
    if (error.response?.status === 401 && originalRequest.url === '/auth/refresh') {
      console.error('[API Interceptor] Erro ao renovar token:', error);
      await handleLogout();
      return Promise.reject(error);
    }

    // Se for erro 401 em outra requisição, tenta renovar o token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('Refresh token não encontrado');
        }

        console.log('[API Interceptor] Tentando renovar token');
        const response = await api.post('/auth/refresh', { refreshToken });
        
        if (!response.data?.accessToken) {
          throw new Error('Novo token não recebido');
        }

        console.log('[API Interceptor] Token renovado com sucesso');
            localStorage.setItem('token', response.data.accessToken);
            localStorage.setItem('refreshToken', response.data.refreshToken);
            originalRequest.headers.Authorization = `Bearer ${response.data.accessToken}`;
            return api(originalRequest);
      } catch (refreshError) {
        console.error('[API Interceptor] Erro ao renovar token:', refreshError);
        await handleLogout();
        return Promise.reject(error);
          }
        }
    return Promise.reject(error);
  }
);

// Função auxiliar para fazer logout
const handleLogout = async () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        localStorage.removeItem('userType');
        localStorage.removeItem('responsavelId');
        localStorage.removeItem('professorId');
        window.location.href = '/';
};

export const apiService = {

  login: (data: { email: string; password: string; userType: string }) => 
    api.post('/auth/login', data),
  
  verifyToken: (token: string) =>
    api.post('/auth/verify', { token }),


  registerResponsible: (data: {
    name: string;
    email: string;
    password: string;
    phone: string;
  }) => api.post('/guardians/register', data),

  getResponsible: (id: number) => api.get(`/guardians/${id}`),
  updateResponsible: (id: number, data: {
    name: string;
    email: string;
    password?: string;
    phone: string;
  }) => api.put(`/guardians/${id}`, data),
  deleteResponsible: (id: number) => api.delete(`/guardians/${id}`),
  getResponsibles: () => api.get('/guardians'),
  getChildrenByResponsible: (responsavelId: number) => 
    api.get(`/guardians/children?responsavelId=${responsavelId}`),

  // Professors
  registerTeacher: (data: {
    name: string;
    email: string;
    password: string;
    phone: string;
    cnpj: string;
  }) => api.post('/teachers/register', data),

  getTeacher: (id: number) => api.get(`/teachers/${id}`),
  updateTeacher: (id: number, data: {
    name: string;
    email: string;
    phone: string;
    cnpj: string;
  }) => api.put(`/teachers/${id}`, data),
  deleteTeacher: (id: number) => api.delete(`/teachers/${id}`),
  getTeachers: () => api.get('/teachers'),

  // Students (Alunos)
  registerStudent: (data: {
    name: string;
    email?: string;
    password?: string;
    phone?: string;
    guardianId: number;
    age: number;
    grade: string;
    condition: string;
    difficulties: string;
  }) => api.post('/students/register', data),

  getStudent: (id: number) => api.get(`/students/${id}`),
  updateStudent: (id: number, data: {
    name: string;
    email: string;
    phone: string;
    age: number;
    grade: string;
    condition: string;
    difficulties: string;
  }) => api.put(`/students/${id}`, data),
  deleteStudent: (id: number) => api.delete(`/students/${id}`),
  getStudents: () => api.get('/students'),

  // New: Get Students by Teacher ID
  getStudentsByTeacherId: (teacherId: number) => 
    api.get<TeacherStudent[]>(`/students/teacher/${teacherId}`),

  // General endpoints
  getChildren: () => api.get('/children'),
  getCalendar: () => api.get('/calendar'),
  getRegisters: () => api.get('/registers'),

  // Current user
  getCurrentGuardian: () => api.get('/guardians/me'),
  getCurrentTeacher: () => api.get('/teachers/me'),

  bookClass: (payload: BookClassPayload) => api.post('/schedules/book', payload),

  getSchedulesByStudentId: (studentId: number) => 
    api.get<ScheduleDTO[]>(`/schedules/student/${studentId}`),

  // New: Get Schedules by Teacher ID
  getSchedulesByTeacherId: (teacherId: number) =>
    api.get<ScheduleDTO[]>(`/schedules/teacher/${teacherId}`),

  deleteSchedule: (scheduleId: number) => api.delete(`/schedules/${scheduleId}`),

  // Método corrigido para cancelar agendamento - usando query parameter
  cancelSchedule: (scheduleId: number) => {
    console.log('[apiService.cancelSchedule] Cancelando agendamento:', scheduleId);
    return api.put(`/schedules/${scheduleId}/status?status=CANCELLED`);
  },

  getAllSchedules: () => api.get<ScheduleDTO[]>('/schedules'),

  // Método para buscar histórico do aluno
  getStudentHistory: (studentId: string | number) => 
    api.get(`/students/${studentId}/history`),

  // Método para salvar histórico do aluno
  saveStudentHistory: (data: ClassHistoryDTO) => 
    api.post<ClassHistoryDTO>('/history', data),
};

export default api;