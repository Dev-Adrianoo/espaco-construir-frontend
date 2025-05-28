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
  }) => api.post('/children', data),

  getChildren: () => api.get('/children'),
};

export default api; 