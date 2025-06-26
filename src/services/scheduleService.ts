import api, { apiService } from './api';
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
  studentIds: number[];
  scheduleIds: number[];  // IDs dos agendamentos retornados pela API
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

  async cancelSchedule(id: string): Promise<void> {
    try {
      console.log('[scheduleService.cancelSchedule] Iniciando cancelamento do agendamento:', id);
      
      if (!id) {
        throw new Error('ID do agendamento não fornecido');
      }

      const scheduleId = Number(id);
      if (isNaN(scheduleId)) {
        throw new Error('ID do agendamento inválido');
      }
      
      // Tenta cancelar o agendamento usando o endpoint correto
      console.log('[scheduleService.cancelSchedule] Enviando requisição de cancelamento para ID:', scheduleId);
      await apiService.cancelSchedule(scheduleId);
      console.log('[scheduleService.cancelSchedule] Agendamento cancelado com sucesso');
    } catch (error: any) {
      console.error('[scheduleService.cancelSchedule] Erro ao cancelar agendamento:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });

      // Se for erro 403, adiciona uma mensagem mais clara
      if (error.response?.status === 403) {
        error.message = 'Você não tem permissão para cancelar este agendamento';
      }

      throw error;
    }
  },

  async getAvailableSlots(teacherId: string, date: string): Promise<string[]> {
    const response = await api.get<string[]>(`/schedules/available-slots/${teacherId}`, {
      params: { date }
    });
    return response.data;
  },

  async getSchedulesWithStudents(guardianId?: string, teacherId?: string): Promise<ScheduleWithStudents[]> {
    try {
      console.log('[getSchedulesWithStudents] Iniciando busca com:', { guardianId, teacherId });
      let agendamentos;

      if (guardianId) {
        // Se temos um guardianId, primeiro buscamos os filhos deste responsável
        const childrenResponse = await api.get(`/guardians/children?responsavelId=${guardianId}`);
        const children = childrenResponse.data;
        console.log('[getSchedulesWithStudents] Filhos encontrados:', children);
        
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

      console.log('[getSchedulesWithStudents] Agendamentos encontrados:', agendamentos);

      // Filtra os agendamentos cancelados
      agendamentos = agendamentos.filter((agendamento: any) => agendamento.status !== 'CANCELLED');
      console.log('[getSchedulesWithStudents] Agendamentos após filtro de cancelados:', agendamentos);

      // Vamos transformar os dados no formato que precisamos
      const horariosAgrupados = agendamentos.reduce((acc: ScheduleWithStudents[], agendamento: any) => {
        if (!agendamento.startTime) {
          console.warn('[getSchedulesWithStudents] Agendamento sem startTime:', agendamento);
          return acc;
        }

        const dia = agendamento.startTime.split('T')[0];
        const hora = agendamento.startTime.split('T')[1].substring(0, 5);
        
        // Procura se já existe um horário para este dia/hora
        const horarioExistente = acc.find(h => h.dia === dia && h.hora === hora);
        
        if (horarioExistente) {
          // Se existe e temos um novo aluno, adiciona à lista
          if (agendamento.studentName && !horarioExistente.alunos.includes(agendamento.studentName)) {
            horarioExistente.alunos.push(agendamento.studentName);
            horarioExistente.studentIds.push(Number(agendamento.studentId));
            horarioExistente.scheduleIds.push(Number(agendamento.id));  // ID do agendamento
          }
        } else {
          // Se não existe, cria um novo horário
          if (agendamento.studentName) {
          acc.push({
            dia,
            hora,
              alunos: [agendamento.studentName],
              studentIds: [Number(agendamento.studentId)],
              scheduleIds: [Number(agendamento.id)]  // ID do agendamento
          });
          }
        }
        
        return acc;
      }, []);

      console.log('[getSchedulesWithStudents] Horários agrupados:', horariosAgrupados);
      return horariosAgrupados;
    } catch (error) {
      console.error('[getSchedulesWithStudents] Erro ao buscar agendamentos:', error);
      throw error;
    }
  }
};

export default scheduleService; 