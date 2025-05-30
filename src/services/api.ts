import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});


api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});


export const apiService = {
 
  login: (data: { email: string; password: string }) => 
    api.post('/api/login', data),
  
  registerResponsible: (data: {
    name: string;
    phone: string;
    email: string;
    password: string;
  }) => api.post('/api/register/guardians', data),
  
  registerTeacher: (data: {
    name: string;
    email: string;
    password: string;
    phone: string;
    cnpj: string;
  }) => api.post('/api/professors', data),

  
  registerChild: (data: {
    name: string;
    age: string;
    grade: string;
    difficulties: string;
    condition: string;
    classType: string;
    parent: string;
  }) => api.post('/api/children', data),

  // Listar filhos do responsável
  getChildrenByResponsible: (responsavelId: string) => api.get(`/api/children?responsavelId=${responsavelId}`),

  
  scheduleClass: (data: {
    date: string;
    time: string;
    studentId: string;
    
  }) => api.post('/api/classes', data),

 
  getClassHistory: (alunoId: string) => api.get(`/api/classes/history?alunoId=${alunoId}`),

  getChildren: () => api.get('/children'),

  
  getCalendar: () => api.get('/calendar'),
  getTeachers: () => api.get('/professors'),
  getResponsibles: () => api.get('/guardians'),
  getRegisters: () => api.get('/registers'),
};

export default api; 