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

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Tenta renovar o token
        const token = localStorage.getItem('token');
        if (token) {
          const response = await apiService.verifyToken(token);
          if (response.data?.token) {
            // Atualiza o token no localStorage
            localStorage.setItem('token', response.data.token);
            
            // Atualiza o header da requisição original
            originalRequest.headers.Authorization = `Bearer ${response.data.token}`;
            
            // Tenta a requisição original novamente
            return api(originalRequest);
          }
        }
      } catch {
        // Se não conseguir renovar o token, faz logout
        localStorage.removeItem('token');
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
  }) => api.post('/professors/register', data),

  getTeacher: (id: number) => api.get(`/professors/${id}`),
  updateTeacher: (id: number, data: {
    name: string;
    email: string;
    phone: string;
    cnpj: string;
  }) => api.put(`/professors/${id}`, data),
  deleteTeacher: (id: number) => api.delete(`/professors/${id}`),
  getTeachers: () => api.get('/professors'),

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

  // General endpoints
  getChildren: () => api.get('/children'),
  getCalendar: () => api.get('/calendar'),
  getRegisters: () => api.get('/registers'),

  // Current user
  getCurrentGuardian: () => api.get('/guardians/me'),
  getCurrentTeacher: () => api.get('/professors/me'),
};

export default api; 