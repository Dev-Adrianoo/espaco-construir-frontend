import api from './api';

export interface LoginCredentials {
  email: string;
  password: string;
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

interface BackendAuthResponse {
  token: string;
  id: number;
  name: string;
  email: string;
  role: 'TEACHER' | 'GUARDIAN' | 'STUDENT';
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    userType: 'teacher' | 'responsible' | 'student';
  };
}

const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<BackendAuthResponse>('/auth/login', credentials); 
    
    const { token, id, name, email, role } = response.data; 

    const userTypeMap: Record<string, 'teacher' | 'responsible' | 'student'> = {
      'TEACHER': 'teacher',
      'GUARDIAN': 'responsible',
      'STUDENT': 'student' 
    };

    const userType = userTypeMap[role] || 'unknown'; 

    const authResponse: AuthResponse = {
      token,
      user: {
        id: String(id),
        name,
        email,
        userType: userType as 'teacher' | 'responsible' | 'student'
      }
    };

    localStorage.setItem(import.meta.env.VITE_AUTH_TOKEN_KEY || 'espaco_construir_token', authResponse.token);
    localStorage.setItem('userType', authResponse.user.userType);
    localStorage.setItem('userId', authResponse.user.id);
    
    return authResponse;
  },

  async registerTeacher(data: RegisterTeacherData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/teachers/register', data);
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
    const responsavelId = localStorage.getItem('responsavelId');
    if (responsavelId) {
      return responsavelId;
    }
    return localStorage.getItem('userId');
  }
};

export default authService; 