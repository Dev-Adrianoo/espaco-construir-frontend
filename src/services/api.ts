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
  }) => api.post('/api/guardians/register', data),
  
  registerTeacher: (data: {
    name: string;
    email: string;
    password: string;
    phone: string;
    cnpj: string;
  }) => api.post('/api/professors/register', data),

  
  registerChild: (data: {
    name: string;
    age: string;
    grade: string;
    difficulties: string;
    condition: string;
    classType: string;
    parent: string;
  }) => api.post('/api/children/register', data),

  

  // Listar filhos do responsável
  getChildrenByResponsible: (responsavelId: string) => 
    api.get(`/api/guardians/children?responsavelId=${responsavelId}`),

  
  scheduleClass: (data: {
    date: string;
    time: string;
    studentId: string;
    teacherId: string;
    duration: number;
    subject: string;
    notes?: string;
  }) => api.post('/api/classes/schedule', data),

 
  getClassHistory: (alunoId: string) => 
    api.get(`/api/guardians/history?alunoId=${alunoId}`),

  getChildren: () => api.get('/api/children'),

  
  getCalendar: () => api.get('/api/calendar'),
  getTeachers: () => api.get('/api/professors'),
  getResponsibles: () => api.get('/api/guardians'),
  getRegisters: () => api.get('/api/registers'),

  getTeacher: (id: string) => api.get(`/api/professors/${id}`),
  
  updateTeacher: (id: string, data: {
    name: string;
    email: string;
    phone: string;
    cnpj: string;
  }) => api.put(`/api/professors/${id}`, data),

  deleteTeacher: (id: string) => api.delete(`/api/professors/${id}`),
};

export default api; 