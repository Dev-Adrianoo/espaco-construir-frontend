import React, { useState, useEffect } from "react";
import { format, addDays, startOfWeek, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import Button from "../components/Button";
import { apiService, ScheduleDTO, TeacherDetails } from "../services/api";
import { AxiosError } from "axios";
import Modal from "../components/Modal";
import authService from "../services/authService";
import LoadingSpinner from "../components/LoadingSpinner";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";
import logoEspacoConstruir from "../images/espaco-construir-logo.jpeg";
import scheduleService from "../services/scheduleService";

// Time slots available for booking
const TIME_SLOTS = [
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
];

interface Child {
  id: string;
  name: string;
  age: number;
  grade: string;
  classType: string;
  difficulties: string;
  condition: string;
}

interface ApiChild {
  id: number;
  name: string;
  age: number;
  grade: string;
  classType: string;
}

// interface ScheduledClass {
//   date: string;
//   time: string;
//   childId: string;
//   childName: string;
// } // Keep commented for now

type ScheduleType = {
  [key: string]: {
    [key: string]: {
      childId: string;
      childName: string;
      booked: boolean;
      scheduleId?: number;
    };
  };
};

interface ScheduleWithStudents {
  dia: string;
  hora: string;
  alunos: string[];
  studentIds: string[];
}

const SchedulePage: React.FC = (): JSX.Element => {
  const { user } = useAuth();
  const today = new Date();
  const startDate = startOfWeek(today, { weekStartsOn: 1 });

  // Initialize schedule with empty slots
  const initialSchedule: ScheduleType = {};

  // Create 7 days starting from Monday
  for (let i = 0; i < 7; i++) {
    const date = addDays(startDate, i);
    const dateStr = format(date, "yyyy-MM-dd");
    initialSchedule[dateStr] = {};

    // Add time slots for each day
    TIME_SLOTS.forEach((time) => {
      initialSchedule[dateStr][time] = {
        childId: "",
        childName: "",
        booked: false,
      };
    });
  }

  const [schedule, setSchedule] = useState<ScheduleType>(initialSchedule);
  const [children, setChildren] = useState<Child[]>([]);
  const [loadingChildren, setLoadingChildren] = useState(true);
  const [childrenError, setChildrenError] = useState<string | null>(null);
  const [selectedChildren, setSelectedChildren] = useState<string[]>([]);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{
    date: string;
    time: string;
  } | null>(null);
  const [loadingSchedule, setLoadingSchedule] = useState(true);
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  // Novos estados para professores
  const [teachers, setTeachers] = useState<TeacherDetails[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(
    null
  );
  const [loadingTeachers, setLoadingTeachers] = useState(true);
  const [teachersError, setTeachersError] = useState<string | null>(null);

  // Estado para o dia visível no mobile
  const [currentDayIndex, setCurrentDayIndex] = useState(0);

  const [showWeekCalendarModal, setShowWeekCalendarModal] = useState(false);

  const [horariosComAlunos, setHorariosComAlunos] = useState<ScheduleWithStudents[]>([]);
  const [modalAlunos, setModalAlunos] = useState<string[] | null>(null);

  const [showSlotActionModal, setShowSlotActionModal] = useState(false);
  const [slotActionData, setSlotActionData] = useState<{
    date: string;
    time: string;
    scheduleId: number;
    childName: string;
    filhosNaoAgendados: Child[];
  } | null>(null);

  const [showCancelConfirmModal, setShowCancelConfirmModal] = useState<{
    show: boolean;
    date?: string;
    time?: string;
    studentName?: string;
  }>({ show: false });

  const [isCanceling, setIsCanceling] = useState(false);

  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split("-");
    return `${day}/${month}/${year}`;
  };

  const fetchSchedule = async () => {
    if (!user) return;
    
    try {
      setLoadingSchedule(true);
      setScheduleError(null);

      if (user.role === "RESPONSAVEL") {
        const responsavelId = user.id;
        try {
          setLoadingChildren(true);
          const response = await apiService.getChildrenByResponsible(
            Number(responsavelId)
          );
          const formattedChildren = response.data.map((child: ApiChild) => ({
            ...child,
            id: String(child.id),
          }));
          setChildren(formattedChildren);
          setSelectedChildren([]);
        } catch (err) {
          const error = err as AxiosError<{ message: string }>;
          setChildrenError(
            error.response?.data?.message || "Erro ao carregar seus filhos."
          );
        } finally {
          setLoadingChildren(false);
        }

        try {
          setLoadingTeachers(true);
          const teachersResponse = await apiService.getTeachers();
          setTeachers(teachersResponse.data);
          if (teachersResponse.data.length > 0) {
            setSelectedTeacherId(String(teachersResponse.data[0].id));
          }
        } catch (err) {
          const error = err as AxiosError<{ message: string }>;
          setTeachersError(
            error.response?.data?.message || "Erro ao carregar professoras."
          );
        } finally {
          setLoadingTeachers(false);
        }
      }

      // Busca os agendamentos para todos os tipos de usuário
      try {
        const horariosResponse = await scheduleService.getSchedulesWithStudents(
          user.role === "RESPONSAVEL" ? user.id : undefined,
          user.role === "PROFESSORA" ? user.id : undefined
        );
        console.log('Horários recebidos:', horariosResponse);
        setHorariosComAlunos(horariosResponse);
      } catch (error) {
        console.error('Erro ao buscar horários:', error);
        setScheduleError("Não foi possível carregar os agendamentos.");
      }
    } catch (error) {
      console.error('Erro geral:', error);
      setScheduleError("Ocorreu um erro ao carregar os dados.");
    } finally {
      setLoadingSchedule(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, [user]);

  // Atualiza o useEffect que busca dados periodicamente
  useEffect(() => {
    if (!user) return;

    // Função para buscar os dados
    const fetchData = async () => {
      try {
        const horariosResponse = await scheduleService.getSchedulesWithStudents(
          user.role === "RESPONSAVEL" ? user.id : undefined,
          user.role === "PROFESSORA" ? user.id : undefined
        );
        setHorariosComAlunos(horariosResponse);
      } catch (error) {
        console.error('Erro ao atualizar agendamentos:', error);
      }
    };

    // Busca inicial
    fetchData();

    // Atualiza a cada 30 segundos
    const interval = setInterval(fetchData, 30000);

    // Cleanup
    return () => clearInterval(interval);
  }, [user]);

  // Função utilitária para pegar todos os alunos agendados em um slot
  function getAlunosAgendados(date: string, time: string): { alunos: string[]; studentIds: string[] } {
    // Se não tiver dados, retorna array vazio
    if (!horariosComAlunos || !Array.isArray(horariosComAlunos)) {
      console.log('Sem horários:', horariosComAlunos);
      return { alunos: [], studentIds: [] };
    }

    // Procura o horário específico
    const horario = horariosComAlunos.find(h => h.dia === date && h.hora === time);
    return horario ? { alunos: horario.alunos, studentIds: horario.studentIds } : { alunos: [], studentIds: [] };
  }

  // Adiciona useEffect para monitorar mudanças nos agendamentos
  useEffect(() => {
    if (horariosComAlunos.length > 0) {
      console.log('Horários com alunos atualizados:', horariosComAlunos);
    }
  }, [horariosComAlunos]);

  // Adiciona useEffect para debug
  useEffect(() => {
    console.log('Estado atual dos horários:', horariosComAlunos);
  }, [horariosComAlunos]);

  // Handle slot click
  const handleSlotClick = (date: string, time: string) => {
    if (!user) return;

    const { alunos: alunosAgendados, studentIds } = getAlunosAgendados(date, time);
    
    // Se for responsável, só pode interagir com seus próprios filhos
    if (user.role === "RESPONSAVEL") {
      const meusFilhos = children.map(child => child.name);
      const alunosAgendadosQuePodemosVer = alunosAgendados.filter(aluno => 
        meusFilhos.includes(aluno)
      );

      if (alunosAgendadosQuePodemosVer.length > 0) {
        // Se tem filhos agendados neste horário, mostra as opções
        setSlotActionData({
          date,
          time,
          scheduleId: Number(studentIds[0]), // Assumindo que o ID está na mesma ordem dos nomes
          childName: alunosAgendadosQuePodemosVer[0],
          filhosNaoAgendados: children.filter(child => !alunosAgendados.includes(child.name))
        });
        setShowSlotActionModal(true);
        return;
      }

      // Se não tem filhos agendados, verifica se pode agendar
      const filhosDisponiveis = children.filter(child => !alunosAgendados.includes(child.name));
      if (filhosDisponiveis.length === 0) {
        toast.error("Todos os seus filhos já estão agendados neste horário.");
        return;
      }
    } else {
      // Para professores, mostra todos os alunos
      if (alunosAgendados.length > 0) {
        setModalAlunos(alunosAgendados);
        return;
      }
    }

    // Se chegou aqui, pode agendar
    setSelectedSlot({ date, time });
    setShowBookingModal(true);
  };

  // Handle booking confirmation
  const handleConfirmBooking = async () => {
    if (!selectedSlot || !selectedTeacherId || selectedChildren.length === 0) {
      toast.error("Por favor, selecione um slot, pelo menos um aluno e professor.");
      return;
    }

    const guardianId = authService.getUserId();
    if (!guardianId) {
      toast.error("Erro: Certifique-se de estar logado.");
      return;
    }

    try {
      // Verifica se já tem alunos agendados neste horário
      const { alunos: alunosJaAgendados } = getAlunosAgendados(selectedSlot.date, selectedSlot.time);

      // Filtra os IDs dos filhos que ainda não estão agendados
      const studentIds = selectedChildren
        .map((id) => children.find((child) => child.id === id))
        .filter((child) => !!child && !alunosJaAgendados.includes(child!.name))
        .map((child) => Number(child!.id));

      if (studentIds.length === 0) {
        toast.error("Nenhum aluno selecionado ou todos já estão agendados neste horário.");
        return;
      }

      const firstChild = children.find((child) => child.id === selectedChildren[0]);

      await apiService.bookClass({
        studentIds,
        date: selectedSlot.date,
        time: selectedSlot.time,
        modality: "IN_PERSON",
        guardianId,
        teacherId: Number(selectedTeacherId),
        difficulties: firstChild?.difficulties || "",
        condition: firstChild?.condition || "",
      });

      // Atualiza os dados
      await fetchSchedule();

      // Fecha o modal e limpa a seleção
      setShowBookingModal(false);
      setSelectedSlot(null);
      setSelectedChildren([]);

      toast.success("Aula agendada com sucesso!");
    } catch (error) {
      const err = error as AxiosError<{ message: string }>;
      toast.error(
        err.response?.data?.message || "Erro ao tentar agendar a aula."
      );
    }
  };

  // Função para verificar filhos disponíveis para agendamento
  const getFilhosDisponiveis = (horario: string) => {
    if (!modalAlunos || !children) return [];
    return children.filter(child => !modalAlunos.includes(child.name));
  };

  const handleCancelSchedule = async (
    date: string,
    time: string,
    studentName: string
  ) => {
    try {
      console.log('Iniciando cancelamento para:', { date, time, studentName });
      
      // Busca o ID do aluno pelo nome
      const student = children.find(child => child.name === studentName);
      if (!student) {
        console.error('Aluno não encontrado:', studentName);
        toast.error('Aluno não encontrado');
        return;
      }
      console.log('Aluno encontrado:', student);

      // Busca todos os agendamentos
      const response = await apiService.getAllSchedules();
      const schedules = response.data;
      console.log('Todos os agendamentos:', schedules);
      
      // Encontra o agendamento específico
      const schedule = schedules.find((s: ScheduleDTO) => {
        const scheduleDate = s.startTime.split('T')[0];
        const scheduleTime = s.startTime.split('T')[1].substring(0, 5);
        const match = s.studentId === Number(student.id) &&
               scheduleDate === date &&
               scheduleTime === time;
        if (match) {
          console.log('Agendamento encontrado:', s);
        }
        return match;
      });

      if (!schedule) {
        console.error('Agendamento não encontrado para:', { date, time, studentId: student.id });
        toast.error('Agendamento não encontrado');
        return;
      }

      console.log('Deletando agendamento:', schedule.id);
      // Deleta o agendamento
      await apiService.deleteSchedule(schedule.id);
      console.log('Agendamento deletado com sucesso');
      
      // Atualiza os dados
      await fetchSchedule(); // Atualiza todos os dados, incluindo filhos e agendamentos
      const horariosResponse = await scheduleService.getSchedulesWithStudents();
      setHorariosComAlunos(horariosResponse);
      
      // Atualiza a lista do modal
      if (modalAlunos) {
        const updatedAlunos = modalAlunos.filter(a => a !== studentName);
        if (updatedAlunos.length === 0) {
          setModalAlunos(null);
          setShowCancelConfirmModal({ show: false });
        } else {
          setModalAlunos(updatedAlunos);
        }
      }

      toast.success(`Aula de ${studentName} desagendada com sucesso!`);
    } catch (error) {
      console.error('Erro ao desagendar:', error);
      toast.error(`Erro ao desagendar aula de ${studentName}. Tente novamente.`);
      throw error;
    }
  };

  const handleModalClose = () => {
    setShowBookingModal(false);
    setSelectedSlot(null);
    setSelectedChildren([]);
  };

  const handleTeacherChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTeacherId(e.target.value);
  };

  const handlePreviousDay = () => {
    setCurrentDayIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNextDay = () => {
    setCurrentDayIndex((prev) => Math.min(6, prev + 1));
  };

  // Atualiza a condição de loading baseada no papel do usuário
  const isLoading = user?.role === "RESPONSAVEL" 
    ? loadingChildren || loadingSchedule || loadingTeachers
    : loadingSchedule;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingSpinner />
        <p className="ml-2 text-gray-500">
          {user?.role === "RESPONSAVEL" 
            ? "Carregando dados..."
            : "Carregando agenda da professora..."
          }
        </p>
      </div>
    );
  }

  if (childrenError || scheduleError || teachersError) {
    return (
      <div className="max-w-4xl mx-auto mt-8 text-center text-red-500">
        <p>Erro ao carregar dados:</p>
        {childrenError && <p>{childrenError}</p>}
        {scheduleError && <p>{scheduleError}</p>}
        {teachersError && <p>{teachersError}</p>}
        <p>Por favor, tente novamente mais tarde.</p>
      </div>
    );
  }

  if (user?.role === "RESPONSAVEL" && children.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <img
          src={logoEspacoConstruir}
          alt="Logo Espaço Construir"
          style={{ width: 120, marginBottom: 20, borderRadius: 12 }}
        />
        <h2 className="text-2xl font-bold mb-2">
          Você ainda não cadastrou nenhum filho
        </h2>
        <p className="text-gray-600 mb-4 max-w-md">
          Para agendar uma aula, é necessário cadastrar pelo menos um filho.
          Clique no botão abaixo para cadastrar agora mesmo!
        </p>
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded transition-colors"
          onClick={() => (window.location.href = "/children")}
        >
          Cadastrar Filho
        </button>
      </div>
    );
  }

  if (user?.role === "RESPONSAVEL" && teachers.length === 0) {
    return (
      <div className="max-w-4xl mx-auto mt-8 bg-white rounded-xl shadow-md p-8 text-center">
        <h2 className="text-2xl font-bold mb-2">
          Nenhuma professora disponível
        </h2>
        <p className="text-gray-600 mb-4">
          Não há professoras cadastradas no momento. Por favor, tente novamente
          mais tarde.
        </p>
      </div>
    );
  }

  const weekDays = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

  if (user?.role === "PROFESSORA") {
    if (scheduleError) {
      return (
        <div className="max-w-4xl mx-auto mt-8 text-center text-red-500">
          <p>Erro ao carregar dados:</p>
          <p>{scheduleError}</p>
          <p>Por favor, tente novamente mais tarde.</p>
        </div>
      );
    }
    return (
      <div className="w-full h-screen flex flex-col px-4 md:px-8 py-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Agenda da Professora
        </h1>
        <p className="mt-1 text-gray-600 mb-4">
          Veja todos os agendamentos da semana.
        </p>
        <div className="flex-grow overflow-y-auto">
          {/* Desktop view */}
          <div className="hidden md:block w-full">
            {/* Cabeçalho: horários + dias da semana */}
            <div className="grid grid-cols-8 gap-1">
              <div></div> {/* Empty cell for time column header */}
              {weekDays.map((day, index) => {
                const date = addDays(startDate, index);
                const isToday =
                  format(date, "yyyy-MM-dd") === format(today, "yyyy-MM-dd");
                return (
                  <div
                    key={day}
                    className={`text-center text-sm font-semibold text-gray-700 ${
                      isToday ? "bg-blue-500 text-white rounded-md p-1" : ""
                    }`}
                  >
                    {day}
                  </div>
                );
              })}
            </div>
            {/* Grade principal: horários + slots */}
            <div className="grid grid-cols-8 gap-1">
              {/* Coluna de horários */}
              <div className="flex flex-col">
                {TIME_SLOTS.map((time) => (
                  <div
                    key={time}
                    className="h-24 flex items-center justify-end pr-2 text-xs text-gray-500 border-r border-gray-200"
                  >
                    {time}
                  </div>
                ))}
              </div>
              {/* 7 colunas para os dias */}
              {Array.from({ length: 7 }).map((_, i) => {
                const date = addDays(startDate, i);
                const dateStr = format(date, "yyyy-MM-dd");
                return (
                  <div key={i} className="flex flex-col">
                    {TIME_SLOTS.map((time) => {
                      const { alunos: alunosAgendados } = getAlunosAgendados(dateStr, time);
                      const isBooked = alunosAgendados.length > 0;
                      return (
                        <div
                          key={time}
                          className={`relative w-full h-24 border border-gray-200 flex flex-col items-center justify-between text-xs font-medium transition-colors ${
                            isBooked
                              ? "bg-blue-50 hover:bg-blue-100"
                              : "bg-emerald-100/70 hover:bg-emerald-100 cursor-pointer"
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSlotClick(dateStr, time);
                          }}
                        >
                          <span className={`pt-2 text-sm ${isBooked ? "text-blue-800" : "text-emerald-800"}`}>
                            {time}
                          </span>
                          {isBooked ? (
                            <span
                              className="w-full px-2 py-1.5 rounded-md text-sm mb-2 bg-blue-500 text-white text-center break-words shadow-sm hover:bg-blue-600 transition-colors"
                              style={{ wordBreak: "break-word", whiteSpace: "normal" }}
                            >
                              {alunosAgendados.length === 0 ? (
                                <span>Nenhum aluno agendado</span>
                              ) : alunosAgendados.length > 1 ? (
                                <div className="flex flex-col gap-1">
                                  <span className="font-medium">
                                    {user?.role === "RESPONSAVEL" 
                                      ? `${alunosAgendados.length} filhos agendados`
                                      : `${alunosAgendados.length} alunos agendados`
                                    }
                                  </span>
                                <button
                                    onClick={e => {
                                    e.stopPropagation();
                                      setModalAlunos(alunosAgendados);
                                  }}
                                    className="text-xs bg-blue-600 hover:bg-blue-700 px-2 py-1.5 rounded transition-colors mx-auto"
                                >
                                    Ver nomes
                                </button>
                                </div>
                              ) : (
                                <div 
                                  className="flex flex-col sm:flex-row items-center justify-center gap-1.5 cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setModalAlunos(alunosAgendados);
                                  }}
                                >
                                  <span className="font-medium">{alunosAgendados[0]}</span>
                                  <button
                                    className="text-xs bg-blue-600 hover:bg-blue-700 px-2 py-1.5 rounded transition-colors w-full sm:w-auto"
                                  >
                                    Opções
                                  </button>
                                </div>
                              )}
                            </span>
                          ) : (
                            <span className="text-emerald-800 font-medium mb-2">
                              Horário disponível
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
          {/* Mobile view */}
          <div className="md:hidden">
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="secondary"
                onClick={() => handlePreviousDay()}
                disabled={currentDayIndex === 0}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowWeekCalendarModal(true)}
                className="flex items-center gap-2 text-lg font-semibold"
              >
                <Calendar className="w-5 h-5" />
                {format(addDays(startDate, currentDayIndex), "EEEE, dd/MM", {
                  locale: ptBR,
                })}
              </Button>
              <Button
                variant="secondary"
                onClick={() => handleNextDay()}
                disabled={currentDayIndex === 6}
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
            <div className="space-y-1">
              {(() => {
                const date = addDays(startDate, currentDayIndex);
                const dateStr = format(date, "yyyy-MM-dd");
                return TIME_SLOTS.map((time) => {
                  const { alunos: alunosAgendados } = getAlunosAgendados(dateStr, time);
                  const isBooked = alunosAgendados.length > 0;
                  return (
                    <div
                      key={time}
                      className={`relative w-full h-24 rounded-md flex flex-col items-center justify-between text-xs font-medium transition-colors ${
                        isBooked
                          ? "bg-blue-50 hover:bg-blue-100"
                          : "bg-emerald-100/70 hover:bg-emerald-100 cursor-pointer"
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSlotClick(dateStr, time);
                      }}
                    >
                      <span className={`pt-2 text-sm ${isBooked ? "text-blue-800" : "text-emerald-800"}`}>
                        {time}
                      </span>
                      {isBooked ? (
                        <span
                          className="w-full px-2 py-1.5 rounded-md text-sm mb-2 bg-blue-500 text-white text-center break-words shadow-sm hover:bg-blue-600 transition-colors"
                          style={{ wordBreak: "break-word", whiteSpace: "normal" }}
                        >
                          {alunosAgendados.length === 0 ? (
                            <span>Nenhum aluno agendado</span>
                          ) : alunosAgendados.length > 1 ? (
                            <div className="flex flex-col gap-1">
                              <span className="font-medium">
                                {user?.role === "RESPONSAVEL" 
                                  ? `${alunosAgendados.length} filhos agendados`
                                  : `${alunosAgendados.length} alunos agendados`
                                }
                              </span>
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  setModalAlunos(alunosAgendados);
                                }}
                                className="text-xs bg-blue-600 hover:bg-blue-700 px-2 py-1.5 rounded transition-colors mx-auto"
                              >
                                Ver nomes
                              </button>
                            </div>
                          ) : (
                            <div 
                              className="flex flex-col sm:flex-row items-center justify-center gap-1.5 cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                setModalAlunos(alunosAgendados);
                              }}
                            >
                              <span className="font-medium">{alunosAgendados[0]}</span>
                              <button
                                className="text-xs bg-blue-600 hover:bg-blue-700 px-2 py-1.5 rounded transition-colors w-full sm:w-auto"
                              >
                                Opções
                              </button>
                            </div>
                          )}
                        </span>
                      ) : (
                        <span className="text-emerald-800 font-medium mb-2">
                          Horário disponível
                        </span>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
            {/* Modal de seleção de dia da semana para mobile */}
            <Modal
              isOpen={showWeekCalendarModal}
              onClose={() => setShowWeekCalendarModal(false)}
              title="Selecione o dia da semana"
            >
              <div className="grid grid-cols-4 gap-3">
                {Array.from({ length: 7 }).map((_, i) => {
                  const date = addDays(startDate, i);
                  const isSelected = i === currentDayIndex;
                  return (
                    <button
                      key={i}
                      onClick={() => {
                        setCurrentDayIndex(i);
                        setShowWeekCalendarModal(false);
                      }}
                      className={`p-6 rounded-lg text-center transition-colors ${
                        isSelected
                          ? "bg-primary text-white"
                          : "bg-gray-100 hover:bg-gray-200 text-gray-800"
                      }`}
                    >
                      <div className="text-[0.6rem] font-medium">
                        {format(date, "EEE", { locale: ptBR }).substring(0, 3)}
                      </div>
                      <div className="text-lg font-bold">
                        {format(date, "dd")}
                      </div>
                    </button>
                  );
                })}
              </div>
            </Modal>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen flex flex-col px-4 md:px-8 py-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Agendar Aula</h1>
      <p className="mt-1 text-gray-600 mb-4">
        Selecione um horário disponível para agendar a aula do seu filho.
      </p>

      <div className="flex-grow overflow-y-auto">
        {/* Desktop view */}
        <div className="hidden md:block w-full">
          {/* Cabeçalho: horários + dias da semana */}
          <div className="grid grid-cols-8 gap-1">
            <div></div> {/* Empty cell for time column header */}
            {weekDays.map((day, index) => {
              const date = addDays(startDate, index);
              const isToday =
                format(date, "yyyy-MM-dd") === format(today, "yyyy-MM-dd");
              return (
                <div
                  key={day}
                  className={`text-center text-sm font-semibold text-gray-700 ${
                    isToday ? "bg-blue-500 text-white rounded-md p-1" : ""
                  }`}
                >
                  {day}
                </div>
              );
            })}
          </div>
          {/* Grade principal: horários + slots */}
          <div className="grid grid-cols-8 gap-1">
            {/* Coluna de horários */}
            <div className="flex flex-col">
              {TIME_SLOTS.map((time) => (
                <div
                  key={time}
                  className="h-24 flex items-center justify-end pr-2 text-xs text-gray-500 border-r border-gray-200"
                >
                  {time}
                </div>
              ))}
            </div>
            {/* 7 colunas para os dias */}
            {Array.from({ length: 7 }).map((_, i) => {
              const date = addDays(startDate, i);
              const dateStr = format(date, "yyyy-MM-dd");
              return (
                <div key={i} className="flex flex-col">
                  {TIME_SLOTS.map((time) => {
                    const { alunos: alunosAgendados } = getAlunosAgendados(dateStr, time);
                    const isBooked = alunosAgendados.length > 0;
                    return (
                      <div
                        key={time}
                        className={`relative w-full h-24 border border-gray-200 flex flex-col items-center justify-between text-xs font-medium transition-colors ${
                          isBooked
                            ? "bg-blue-50 hover:bg-blue-100"
                            : "bg-emerald-100/70 hover:bg-emerald-100 cursor-pointer"
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSlotClick(dateStr, time);
                        }}
                      >
                        <span className={`pt-2 text-sm ${isBooked ? "text-blue-800" : "text-emerald-800"}`}>
                          {time}
                        </span>
                        {isBooked ? (
                          <span
                            className="w-full px-2 py-1.5 rounded-md text-sm mb-2 bg-blue-500 text-white text-center break-words shadow-sm hover:bg-blue-600 transition-colors"
                            style={{ wordBreak: "break-word", whiteSpace: "normal" }}
                          >
                            {alunosAgendados.length === 0 ? (
                              <span>Nenhum aluno agendado</span>
                            ) : alunosAgendados.length > 1 ? (
                              <div className="flex flex-col gap-1">
                                <span className="font-medium">
                                  {user?.role === "RESPONSAVEL" 
                                    ? `${alunosAgendados.length} filhos agendados`
                                    : `${alunosAgendados.length} alunos agendados`
                                  }
                                </span>
                                <button
                                  onClick={e => {
                                    e.stopPropagation();
                                    setModalAlunos(alunosAgendados);
                                  }}
                                  className="text-xs bg-blue-600 hover:bg-blue-700 px-2 py-1.5 rounded transition-colors mx-auto"
                                >
                                  Ver nomes
                                </button>
                              </div>
                            ) : (
                              <div 
                                className="flex flex-col sm:flex-row items-center justify-center gap-1.5 cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setModalAlunos(alunosAgendados);
                                }}
                              >
                                <span className="font-medium">{alunosAgendados[0]}</span>
                                <button
                                  className="text-xs bg-blue-600 hover:bg-blue-700 px-2 py-1.5 rounded transition-colors w-full sm:w-auto"
                                >
                                  Opções
                                </button>
                              </div>
                            )}
                          </span>
                        ) : (
                          <span className="text-emerald-800 font-medium mb-2">
                            Horário disponível
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile view */}
        <div className="md:hidden">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="secondary"
              onClick={() => handlePreviousDay()}
              disabled={currentDayIndex === 0}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button
              variant="secondary"
              onClick={() => setShowWeekCalendarModal(true)}
              className="flex items-center gap-2 text-lg font-semibold"
            >
              <Calendar className="w-5 h-5" />
              {format(addDays(startDate, currentDayIndex), "EEEE, dd/MM", {
                locale: ptBR,
              })}
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleNextDay()}
              disabled={currentDayIndex === 6}
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
          <div className="space-y-1">
            {(() => {
              const date = addDays(startDate, currentDayIndex);
              const dateStr = format(date, "yyyy-MM-dd");
              return TIME_SLOTS.map((time) => {
                const { alunos: alunosAgendados } = getAlunosAgendados(dateStr, time);
                const isBooked = alunosAgendados.length > 0;
                return (
                  <div
                    key={time}
                    className={`relative w-full h-24 rounded-md flex flex-col items-center justify-between text-xs font-medium transition-colors ${
                      isBooked
                        ? "bg-blue-50 hover:bg-blue-100"
                        : "bg-emerald-100/70 hover:bg-emerald-100 cursor-pointer"
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSlotClick(dateStr, time);
                    }}
                  >
                    <span className={`pt-2 text-sm ${isBooked ? "text-blue-800" : "text-emerald-800"}`}>
                      {time}
                    </span>
                    {isBooked ? (
                      <span
                        className="w-full px-2 py-1.5 rounded-md text-sm mb-2 bg-blue-500 text-white text-center break-words shadow-sm hover:bg-blue-600 transition-colors"
                        style={{ wordBreak: "break-word", whiteSpace: "normal" }}
                      >
                        {alunosAgendados.length === 0 ? (
                          <span>Nenhum aluno agendado</span>
                        ) : alunosAgendados.length > 1 ? (
                          <div className="flex flex-col gap-1">
                            <span className="font-medium">
                              {user?.role === "RESPONSAVEL" 
                                ? `${alunosAgendados.length} filhos agendados`
                                : `${alunosAgendados.length} alunos agendados`
                              }
                            </span>
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                setModalAlunos(alunosAgendados);
                              }}
                              className="text-xs bg-blue-600 hover:bg-blue-700 px-2 py-1.5 rounded transition-colors mx-auto"
                            >
                              Ver nomes
                            </button>
                          </div>
                        ) : (
                          <div 
                            className="flex flex-col sm:flex-row items-center justify-center gap-1.5 cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              setModalAlunos(alunosAgendados);
                            }}
                          >
                            <span className="font-medium">{alunosAgendados[0]}</span>
                            <button
                              className="text-xs bg-blue-600 hover:bg-blue-700 px-2 py-1.5 rounded transition-colors w-full sm:w-auto"
                            >
                              Opções
                            </button>
                          </div>
                        )}
                      </span>
                    ) : (
                      <span className="text-emerald-800 font-medium mb-2">
                        Horário disponível
                      </span>
                    )}
                  </div>
                );
              });
            })()}
          </div>
          {/* Modal de seleção de dia da semana para mobile */}
          <Modal
            isOpen={showWeekCalendarModal}
            onClose={() => setShowWeekCalendarModal(false)}
            title="Selecione o dia da semana"
          >
            <div className="grid grid-cols-4 gap-3">
              {Array.from({ length: 7 }).map((_, i) => {
                const date = addDays(startDate, i);
                const isSelected = i === currentDayIndex;
                return (
                  <button
                    key={i}
                    onClick={() => {
                      setCurrentDayIndex(i);
                      setShowWeekCalendarModal(false);
                    }}
                    className={`p-6 rounded-lg text-center transition-colors ${
                      isSelected
                        ? "bg-primary text-white"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-800"
                    }`}
                  >
                    <div className="text-[0.6rem] font-medium">
                      {format(date, "EEE", { locale: ptBR }).substring(0, 3)}
                    </div>
                    <div className="text-lg font-bold">
                      {format(date, "dd")}
                    </div>
                  </button>
                );
              })}
            </div>
          </Modal>
        </div>
      </div>

      {/* Booking Modal */}
      <Modal
        isOpen={showBookingModal}
        onClose={handleModalClose}
        title="Agendar Aula"
        zIndex={1000}
      >
        {selectedSlot && (
          <div className="space-y-6 p-2 md:p-4">
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
              Confirmar Agendamento
            </h2>
            <p className="text-center text-gray-600 mb-4">
              Você está prestes a agendar uma aula para:
            </p>
            <div className="flex flex-col md:flex-row md:space-x-8 md:justify-center mb-2">
              <div className="mb-2 md:mb-0">
                <span className="block text-sm text-gray-500">Data:</span>
                <span className="text-lg font-semibold text-gray-800">
                  {formatDate(selectedSlot.date)}
                </span>
              </div>
              <div>
                <span className="block text-sm text-gray-500">Horário:</span>
                <span className="text-lg font-semibold text-gray-800">
                  {selectedSlot.time}
                </span>
              </div>
            </div>

            <div className="mb-4">
              <label
                htmlFor="child-select"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Para quais filhos?
              </label>
              <select
                id="child-select"
                name="child-select"
                multiple
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 min-h-[70px]"
                value={selectedChildren}
                onChange={(e) => {
                  const options = Array.from(e.target.selectedOptions).map(
                    (opt) => opt.value
                  );
                  setSelectedChildren(options);
                }}
                required
              >
                {(() => {
                  if (selectedSlot) {
                    // Busca todos os filhos já agendados para aquele dia/horário
                    const filhosJaAgendados: string[] = getAlunosAgendados(selectedSlot.date, selectedSlot.time).alunos.map(nome => {
                      // Busca o id do filho pelo nome
                      const found = children.find(child => child.name === nome);
                      return found ? found.id : null;
                    }).filter(Boolean) as string[];
                    return children
                      .filter((child) => !filhosJaAgendados.includes(child.id))
                      .map((child) => (
                        <option key={child.id} value={child.id}>
                          {child.name}
                        </option>
                      ));
                  }
                  return children.map((child) => (
                    <option key={child.id} value={child.id}>
                      {child.name}
                    </option>
                  ));
                })()}
              </select>
              <span className="text-xs text-gray-500 block mt-1">
                Segure <b>Ctrl</b> (Windows) ou <b>Command</b> (Mac) para
                selecionar mais de um.
              </span>
            </div>

            <div className="mb-4">
              <label
                htmlFor="teacher-select"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Com qual professora?
              </label>
              <select
                id="teacher-select"
                name="teacher-select"
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                value={String(selectedTeacherId ?? "")}
                onChange={handleTeacherChange}
                required
              >
                <option value="" disabled>
                  Selecione uma professora
                </option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={String(teacher.id)}>
                    {teacher.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleConfirmBooking}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors text-lg shadow-md mt-2"
            >
              Confirmar Agendamento
            </button>
          </div>
        )}
      </Modal>

      {/* Modal de confirmação de cancelamento */}
      {showCancelConfirmModal.show && (
        <Modal
          isOpen={showCancelConfirmModal.show}
          onClose={() => !isCanceling && setShowCancelConfirmModal({ show: false })}
          title="Confirmar Cancelamento"
          zIndex={2000}
        >
          <div className="p-4">
            <div className="flex items-center gap-3 p-3 bg-red-50 rounded border border-red-100 mb-4">
              <div className="w-10 h-10 rounded bg-red-100 flex items-center justify-center flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p className="text-red-600">
                Tem certeza que deseja cancelar a aula de {showCancelConfirmModal.studentName}?
              </p>
            </div>
            
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowCancelConfirmModal({ show: false })}
                disabled={isCanceling}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Não, manter
              </button>
              <button
                onClick={async () => {
                  try {
                    setIsCanceling(true);
                    if (showCancelConfirmModal.date && showCancelConfirmModal.time && showCancelConfirmModal.studentName) {
                      await handleCancelSchedule(
                        showCancelConfirmModal.date,
                        showCancelConfirmModal.time,
                        showCancelConfirmModal.studentName
                      );
                      setShowCancelConfirmModal({ show: false });
                    }
                  } catch (error) {
                    console.error('Erro ao cancelar agendamento:', error);
                  } finally {
                    setIsCanceling(false);
                  }
                }}
                disabled={isCanceling}
                className="px-3 py-1.5 bg-red-500 text-white rounded hover:bg-red-600 transition-colors flex items-center gap-1 disabled:opacity-50"
              >
                {isCanceling ? (
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
                {isCanceling ? 'Cancelando...' : 'Sim, cancelar'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal de alunos agendados */}
      {modalAlunos && (
        <Modal
          isOpen={!!modalAlunos}
          onClose={() => setModalAlunos(null)}
          title={user?.role === "RESPONSAVEL" ? "Filhos Agendados" : "Alunos Agendados"}
          zIndex={1000}
        >
          <div className="p-4">
            <div className="space-y-3">
              {modalAlunos.map((aluno, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-white p-3 rounded border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded text-white flex items-center justify-center font-medium text-lg"
                      style={{ 
                        background: 'linear-gradient(135deg, #FF7F6B 0%, #FF9B8D 100%)'
                      }}
                    >
                      {aluno.split(" ").map(word => word[0]).join("").toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-800">{aluno}</span>
                      <span className="text-sm text-gray-500">
                        {selectedSlot && `${formatDate(selectedSlot.date)} - ${selectedSlot.time}`}
                      </span>
                    </div>
                  </div>
                  {user?.role === "RESPONSAVEL" && (
                    <button
                      onClick={() => {
                        setShowCancelConfirmModal({
                          show: true,
                          date: selectedSlot?.date,
                          time: selectedSlot?.time,
                          studentName: aluno
                        });
                      }}
                      className="px-3 py-1.5 bg-red-500 text-white rounded hover:bg-red-600 transition-colors flex items-center gap-1 text-sm"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Cancelar
                    </button>
                  )}
                </div>
            ))}
            </div>
            {user?.role === "RESPONSAVEL" && (
              <div className="mt-4 flex justify-end">
                {getFilhosDisponiveis(selectedSlot?.time || '').length > 0 ? (
                  <button
                    onClick={() => {
                      if (selectedSlot) {
                        setModalAlunos(null);
                        setSelectedSlot(selectedSlot);
                        setShowBookingModal(true);
                      }
                    }}
                    className="px-3 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex items-center gap-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Agendar outro filho
                  </button>
                ) : (
                  <span className="text-sm text-gray-500">
                    Todos os seus filhos já estão agendados neste horário
                  </span>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}

      {showSlotActionModal && slotActionData && (
        <Modal
          isOpen={showSlotActionModal}
          onClose={() => setShowSlotActionModal(false)}
          title={`Cancelar a aula para ${slotActionData.childName}?`}
        >
          <div className="flex flex-col items-center p-4">
            <div className="flex space-x-4 mb-2">
              <button
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                onClick={() => {
                  handleCancelSchedule(
                    slotActionData.date,
                    slotActionData.time,
                    slotActionData.childName
                  );
                  setShowSlotActionModal(false);
                }}
              >
                Sim, cancelar
              </button>
              <button
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors"
                onClick={() => setShowSlotActionModal(false)}
              >
                Não, manter
              </button>
            </div>
            {slotActionData.filhosNaoAgendados.length > 0 ? (
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors w-full"
                onClick={() => {
                  setSelectedSlot({
                    date: slotActionData.date,
                    time: slotActionData.time,
                  });
                  setSelectedChildren([]);
                  setShowBookingModal(true);
                  setShowSlotActionModal(false);
                }}
              >
                Adicionar outro filho a esta aula
              </button>
            ) : (
              <span className="text-xs text-gray-500 mt-2">
                Todos os seus filhos já estão agendados neste horário.
              </span>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default SchedulePage;
