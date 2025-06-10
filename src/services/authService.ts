import api from './api';

export interface LoginCredentials {
  email: string;
  password: string;
  userType: 'teacher' | 'responsible';
}

export interface RegisterTeacherData {
  name: string;
  email: string;
  password: string;
  phone: string;
  specialization: string;
}

export interface RegisterResponsibleData {
  name: string;
  email: string;
  password: string;
  phone: string;
  address: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    userType: 'teacher' | 'responsible';
  };
}

const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    const { token, user } = response.data;
    
    // Store auth data
    localStorage.setItem(import.meta.env.VITE_AUTH_TOKEN_KEY || 'espaco_construir_token', token);
    localStorage.setItem('userType', user.userType);
    localStorage.setItem('userId', user.id);
    
    return response.data;
  },

  async registerTeacher(data: RegisterTeacherData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/professors/register', data);
    return response.data;
  },

  async registerResponsible(data: RegisterResponsibleData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/guardians/register', data);
    return response.data;
  },

  async logout(): Promise<void> {
    localStorage.removeItem(import.meta.env.VITE_AUTH_TOKEN_KEY || 'espaco_construir_token');
    localStorage.removeItem('userType');
    localStorage.removeItem('userId');
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem(import.meta.env.VITE_AUTH_TOKEN_KEY || 'espaco_construir_token');
  },

  getUserType(): string | null {
    return localStorage.getItem('userType');
  },

  getUserId(): string | null {
    return localStorage.getItem('userId');
  }
};

export default authService; 