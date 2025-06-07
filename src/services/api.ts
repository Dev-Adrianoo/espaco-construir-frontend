import axios, { AxiosError } from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('userType');
      localStorage.removeItem('responsavelId');
      localStorage.removeItem('professorId');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export const apiService = {
  // Auth endpoints
  login: (data: { email: string; password: string }) => 
    api.post('/api/auth/login', data),
  
  verifyToken: (token: string) =>
    api.post('/api/auth/verify', { token }),

  // Guardians (Responsáveis)
  registerResponsible: (data: {
    name: string;
    email: string;
    password: string;
    phone: string;
  }) => api.post('/api/guardians/register', data),

  getResponsible: (id: number) => api.get(`/api/guardians/${id}`),
  updateResponsible: (id: number, data: {
    name: string;
    email: string;
    password?: string;
    phone: string;
  }) => api.put(`/api/guardians/${id}`, data),
  deleteResponsible: (id: number) => api.delete(`/api/guardians/${id}`),
  getResponsibles: () => api.get('/api/guardians'),
  getChildrenByResponsible: (responsavelId: number) => 
    api.get(`/api/guardians/children?responsavelId=${responsavelId}`),

  // Professors
  registerTeacher: (data: {
    name: string;
    email: string;
    password: string;
    phone: string;
    cnpj: string;
  }) => api.post('/api/professors/register', data),

  getTeacher: (id: number) => api.get(`/api/professors/${id}`),
  updateTeacher: (id: number, data: {
    name: string;
    email: string;
    phone: string;
    cnpj: string;
  }) => api.put(`/api/professors/${id}`, data),
  deleteTeacher: (id: number) => api.delete(`/api/professors/${id}`),
  getTeachers: () => api.get('/api/professors'),

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
  }) => api.post('/api/students/register', data),

  getStudent: (id: number) => api.get(`/api/students/${id}`),
  updateStudent: (id: number, data: {
    name: string;
    email: string;
    phone: string;
    age: number;
    grade: string;
    condition: string;
    difficulties: string;
  }) => api.put(`/api/students/${id}`, data),
  deleteStudent: (id: number) => api.delete(`/api/students/${id}`),
  getStudents: () => api.get('/api/students'),

  // General endpoints
  getChildren: () => api.get('/api/children'),
  getCalendar: () => api.get('/api/calendar'),
  getRegisters: () => api.get('/api/registers'),

  // Current user
  getCurrentGuardian: () => api.get('/api/guardians/me'),
};

export default api; 