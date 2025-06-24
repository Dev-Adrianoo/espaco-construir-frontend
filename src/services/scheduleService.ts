import api from './api';
import { ScheduleDTO } from './api';

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

export interface ScheduleWithStudents {
  dia: string;
  hora: string;
  alunos: string[];
  studentIds: string[];
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

  async getSchedulesWithStudents(guardianId?: string, teacherId?: string): Promise<ScheduleWithStudents[]> {
    try {
      let agendamentos;

      if (guardianId) {
        // Se temos um guardianId, primeiro buscamos os filhos deste responsável
        const childrenResponse = await api.get(`/guardians/children?responsavelId=${guardianId}`);
        const children = childrenResponse.data;
        
        // Depois buscamos os agendamentos de cada filho
        const schedulesPromises = children.map((child: any) => 
          api.get<ScheduleDTO[]>(`/schedules/student/${child.id}`)
        );
        
        const schedulesResponses = await Promise.all(schedulesPromises);
        agendamentos = schedulesResponses.flatMap(response => response.data);
      } else if (teacherId) {
        // Se temos um teacherId, buscamos os agendamentos da professora
        const response = await api.get<ScheduleDTO[]>(`/schedules/teacher/${teacherId}`);
        agendamentos = response.data;
      } else {
        // Se não temos guardianId nem teacherId, buscamos todos os agendamentos
        const response = await api.get('/schedules');
        agendamentos = response.data;
      }

      console.log('Resposta dos agendamentos:', agendamentos);

      // Vamos transformar os dados no formato que precisamos
      const horariosAgrupados = agendamentos.reduce((acc: ScheduleWithStudents[], agendamento: any) => {
        const dia = agendamento.startTime.split('T')[0];
        const hora = agendamento.startTime.split('T')[1].substring(0, 5);
        
        // Procura se já existe um horário para este dia/hora
        const horarioExistente = acc.find(h => h.dia === dia && h.hora === hora);
        
        if (horarioExistente) {
          // Se existe, adiciona o aluno à lista
          if (agendamento.studentName && !horarioExistente.alunos.includes(agendamento.studentName)) {
            horarioExistente.alunos.push(agendamento.studentName);
            horarioExistente.studentIds.push(String(agendamento.studentId));
          }
        } else {
          // Se não existe, cria um novo horário
          acc.push({
            dia,
            hora,
            alunos: agendamento.studentName ? [agendamento.studentName] : [],
            studentIds: agendamento.studentId ? [String(agendamento.studentId)] : []
          });
        }
        
        return acc;
      }, []);

      console.log('Horários agrupados:', horariosAgrupados);
      return horariosAgrupados;
    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error);
      return [];
    }
  }
};

export default scheduleService; 