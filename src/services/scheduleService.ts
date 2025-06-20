import api from './api';

export interface Schedule {
  id: string;
  studentId: string;
  teacherId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateScheduleData {
  studentId: string;
  teacherId: string;
  date: string;
  startTime: string;
  endTime: string;
  notes?: string;
}

export interface UpdateScheduleData {
  status?: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
}

const scheduleService = {
  async getTeacherSchedules(teacherId: string, startDate?: string, endDate?: string): Promise<Schedule[]> {
    const response = await api.get<Schedule[]>('/schedules/teacher/' + teacherId, {
      params: { startDate, endDate }
    });
    return response.data;
  },

  async getStudentSchedules(studentId: string, startDate?: string, endDate?: string): Promise<Schedule[]> {
    const response = await api.get<Schedule[]>('/schedules/student/' + studentId, {
      params: { startDate, endDate }
    });
    return response.data;
  },

  async createSchedule(data: CreateScheduleData): Promise<Schedule> {
    const response = await api.post<Schedule>('/schedules', data);
    return response.data;
  },

  async updateSchedule(id: string, data: UpdateScheduleData): Promise<Schedule> {
    const response = await api.put<Schedule>(`/schedules/${id}`, data);
    return response.data;
  },

  async cancelSchedule(id: string): Promise<Schedule> {
    const response = await api.put<Schedule>(`/schedules/${id}/cancel`);
    return response.data;
  },

  async getAvailableSlots(teacherId: string, date: string): Promise<string[]> {
    const response = await api.get<string[]>(`/schedules/available-slots/${teacherId}`, {
      params: { date }
    });
    return response.data;
  },

  async getSchedulesWithStudents(): Promise<{ dia: string; hora: string; alunos: string[] }[]> {
    const response = await api.get<{ dia: string; hora: string; alunos: string[] }[]>(
      '/api/schedules/with-students'
    );
    return response.data;
  }
};

export default scheduleService; 