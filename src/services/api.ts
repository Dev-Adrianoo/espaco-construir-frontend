import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
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


api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await apiService.refreshToken(refreshToken);
          if (response.data?.accessToken) {
            // Atualiza os tokens no localStorage
            localStorage.setItem('token', response.data.accessToken);
            localStorage.setItem('refreshToken', response.data.refreshToken);
            // Atualiza o header da requisição original
            originalRequest.headers.Authorization = `Bearer ${response.data.accessToken}`;
            // Tenta a requisição original novamente
            return api(originalRequest);
          }
        }
      } catch {
        // Se não conseguir renovar o token, faz logout
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        localStorage.removeItem('userType');
        localStorage.removeItem('responsavelId');
        localStorage.removeItem('professorId');
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

export const apiService = {
  // Auth endpoints
  login: (data: { email: string; password: string }) => 
    api.post('/auth/login', data),
  
  verifyToken: (token: string) =>
    api.post('/auth/verify', { token }),

  // Guardians (Responsáveis)
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
    email: string;
    password: string;
    phone: string;
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

  bookClass: (data: { date: string; time: string; childId: string; childName: string; modality: string; guardianId: string; teacherId: number }) =>
    api.post<ScheduleDTO>('/schedules/book', data),

  getSchedulesByStudentId: (studentId: number) => 
    api.get<ScheduleDTO[]>(`/schedules/student/${studentId}`),

  // New: Get Schedules by Teacher ID
  getSchedulesByTeacherId: (teacherId: number) =>
    api.get<ScheduleDTO[]>(`/schedules/teacher/${teacherId}`),

  deleteSchedule: (scheduleId: number) => api.delete(`/schedules/${scheduleId}`),

  
  getAllSchedules: () => api.get<ScheduleDTO[]>(`/schedules`),

  // Novo endpoint para refresh token
  refreshToken: (refreshToken: string) => api.post('/auth/refresh', { refreshToken }),
};

export default api;

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
}

export interface TeacherStudent {
  id: number;
  name: string;
  age: number;
  grade: string;
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