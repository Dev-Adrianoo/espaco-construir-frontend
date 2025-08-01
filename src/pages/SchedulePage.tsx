import React, { useState, useEffect } from "react";
import { format, addDays, startOfWeek } from "date-fns";
import { ja, ptBR } from "date-fns/locale";
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

// Tempos disponíveis para agendamento
const TIME_SLOTS = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
  "22:00",
  "23:00",
];

interface Child {
  id: string;
  name: string;
  age: number;
  grade: string;
  classType: string;
  difficulties: string;
  condition: string;
  guardianId?: number;
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
  studentIds: number[];
  scheduleIds: number[];  
}

interface AlunoAgendado {
  id: string;
  studentName: string;
  scheduleId: string;
}

const SchedulePage: React.FC = (): JSX.Element => {
  const { user } = useAuth();
  const today = new Date();
  const startDate = startOfWeek(today, { weekStartsOn: 1 });

  // Inicializa o agendamento com slots vazios
  const initialSchedule: ScheduleType = {};

  // Cria 7 dias começando de segunda-feira
  for (let i = 0; i < 7; i++) {
    const date = addDays(startDate, i);
    const dateStr = format(date, "yyyy-MM-dd");
    initialSchedule[dateStr] = {};


    TIME_SLOTS.forEach((time) => {
      initialSchedule[dateStr][time] = {
        childId: "",
        childName: "",
        booked: false,
      };
    });
  }

  const [schedule, setSchedule] = useState<ScheduleType>(initialSchedule);
  const [userAssociatedPeople, setUserAssociatedPeople] = useState<Child[]>([]);
  const [loadingChildren, setLoadingChildren] = useState(true);
  const [childrenError, setChildrenError] = useState<string | null>(null);
  const [selectedChildren, setSelectedChildren] = useState<string[]>([]);
  const [showIntentModal, setShowIntentModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [teacherRegisteredStudents, setTeacherRegisteredStudents] = useState<Child[]>([]);
  const [allStudents, setAllStudents] = useState<Child[]>([])
  const [bookingMode, setBookingMode] = useState<'parent' | 'teacher'>('parent');
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
  const [modalAlunos, setModalAlunos] = useState<AlunoAgendado[] | null>(null);

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

  const [confirmingCancelId, setConfirmingCancelId] = useState<string | null>(null) 

  const fetchSchedule = async () => {
    if (!user) return;
    setLoadingSchedule(true);
    setScheduleError(null);

    try {
    if (user.role === "RESPONSAVEL") {
        const responsavelId = user.id;
        try {
          setLoadingChildren(true);
          const response = await apiService.getChildrenByResponsible(Number(responsavelId));
          const formattedChildren = response.data.map((child: ApiChild) => ({
            ...child,
            id: String(child.id),
          }));
          setUserAssociatedPeople(formattedChildren);
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
      } else if (user.role === "PROFESSORA") {
        try {
          setLoadingChildren(true);
          const registeredStudentsResponse = await apiService.getStudentsRegisteredByMe(Number(user.id));
          const taughtStudentsResponse = await apiService.getStudentsByTeacherId(Number(user.id));

          // Popula teacherRegisteredStudents com os alunos que a professora cadastrou
          setTeacherRegisteredStudents(registeredStudentsResponse.data.map((student: any) => ({
            ...student,
            id: String(student.id),
          })));

          const combinedStudents = [...registeredStudentsResponse.data, ...taughtStudentsResponse.data];

          // Remove duplicatas baseadas no ID do aluno
          const uniqueStudents = Array.from(new Map(combinedStudents.map(student => [student.id, student])).values());

          const formattedStudents = uniqueStudents.map((student: any) => ({
            ...student,
            id: String(student.id),
          }));
          setUserAssociatedPeople(formattedStudents);
        } catch (err) {
          setChildrenError("Erro ao carregar seus alunos.");
        } finally {
          setLoadingChildren(false);
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

  useEffect(() => {
    if (!user) return;

   
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

    // Atualiza a cada 60 segundos
    const interval = setInterval(fetchData, 60000);

    // Cleanup
    return () => clearInterval(interval);
  }, [user]);


  // Função utilitária para pegar todos os alunos agendados em um slot
  function getAlunosAgendados(date: string, time: string): AlunoAgendado[] {
    
    if(!horariosComAlunos || !Array.isArray(horariosComAlunos)){
      return [];
    }
    
 
    const horario = horariosComAlunos.find(h => h.dia === date && h.hora === time);

    if (!horario) {
      return []
    }

    const alunosCompletos = horario.alunos.map((nome, index) => {
      return {
        studentName: nome,
        id: horario.studentIds[index].toString(),
        scheduleId: horario.scheduleIds[index].toString(),
      }
    })
    return alunosCompletos
  }

  const handleSlotClick = (date: string, time: string) => {
    if (!user) {
      console.log('[ AVISO ] Usuário não encontrado ao clicar no slot');
      return;
    }

    // const { alunos: alunosAgendados } = getAlunosAgendados(date, time);

    const alunosAgendados = getAlunosAgendados(date, time)

    console.log(`[ AVISO ] Slot clicado: ${date} ${time} | user.role: ${user.role}`);
    console.log(`[ AVISO ] Alunos agendados nesse slot:`, alunosAgendados);

    setSelectedSlot({ date, time });
    console.log('[ AVISO ] setSelectedSlot chamado');

    if (alunosAgendados.length > 0) {
      setModalAlunos(alunosAgendados);
      setShowBookingModal(false);
      console.log('[ AVISO ] setModalAlunos chamado, setShowBookingModal(false)');
    } else {
      setShowBookingModal(true);
      setModalAlunos(null);
      console.log('[ AVISO ] setShowBookingModal(true) chamado, setModalAlunos(null)');
    }
  };
  

  const handleConfirmBooking = async () => {
    if (!selectedSlot || !user) return;

    try {
      if (user.role === 'RESPONSAVEL') {
        if (!selectedTeacherId || selectedChildren.length === 0) {
          toast.error("Por favor, selecione um slot, pelo menos um aluno e uma professora.");
          return;
        }
        const guardianId = authService.getUserId();
        if (!guardianId) {
          toast.error("Erro: Certifique-se de estar logado.");
          return;
        }
        const studentIds = selectedChildren.map(id => Number(id));
        const firstChild = userAssociatedPeople.find(child => child.id === selectedChildren[0]);

        await apiService.bookClass({
          studentIds,
          date: selectedSlot.date,
          time: selectedSlot.time,
          modality: "IN_PERSON",
          guardianId: String(guardianId),
          teacherId: Number(selectedTeacherId),
          difficulties: firstChild?.difficulties || "",
          condition: firstChild?.condition || "",
        });
        toast.success("Aula agendada com sucesso!");

      } else if (user.role === 'PROFESSORA') {
        if (!selectedStudentId) {
          toast.error("Por favor, selecione um aluno para agendar.");
          return;
        }
        
        const studentToBook = userAssociatedPeople.find(student => student.id === selectedStudentId);

        if (!studentToBook || !user.id) {
          toast.error("Não foi possível encontrar os dados do aluno ou do professor.");
          return;
        }

        await apiService.bookClass({
          studentIds: [Number(selectedStudentId)],
          date: selectedSlot.date,
          time: selectedSlot.time,
          modality: "IN_PERSON",
          guardianId: String(user.id), // O guardianId da professora é o ID dela mesma
          teacherId: Number(user.id),
          difficulties: studentToBook.difficulties || "",
          condition: studentToBook.condition || "",
        });
        toast.success("Aula agendada com sucesso!");
      }

      await fetchSchedule();
      setShowBookingModal(false);
      setSelectedSlot(null);
      setSelectedChildren([]);
      setSelectedStudentId('');

    } catch (error) {
      const err = error as AxiosError<{ message: string }>;
      toast.error(err.response?.data?.message || "Erro ao tentar agendar a aula.");
    }
  };

  // Função para verificar filhos disponíveis para agendamento
  const getFilhosDisponiveis = () => {

    if (!modalAlunos || !userAssociatedPeople) return [];

    return !modalAlunos.filter(child => {

      const JaEstaAgendado = modalAlunos.some(alunoAgendado => alunoAgendado.studentName === child.studentName)

      return !JaEstaAgendado
    });
  };

  const handleCancelSchedule = async (scheduleIdToCancel: string) => {
    try {
      console.log('[handleCancelSchedule] Iniciando cancelamento para:', scheduleIdToCancel);
      setIsCanceling(true);


     await scheduleService.cancelSchedule(scheduleIdToCancel)

     console.log('[handleCancelSchedule] Agendamento cancelado com sucesso no backend');
     toast.success(`Aula cancelada com sucesso!`);
 
      await fetchSchedule();

      setModalAlunos(null)
      setShowCancelConfirmModal({show: false})

    } catch (error: any){
      console.error("[handleCancelSchedule] Erro ao cancelar: ", error)
      toast.error(error.message || 'Erro ao cancelar agendamento.')
    } finally {
      setIsCanceling(false)
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

  if (user?.role === "RESPONSAVEL" && userAssociatedPeople.length === 0) {
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
      <div className="flex-col h-max items-center justify-center max-w-4xl mx-auto mt-8 bg-white rounded-xl shadow-md p-8 text-center">
        <h2 className="text-2xl text-center items-center justify-center font-bold mb-2">
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

  return (
    <>
      {user?.role === "PROFESSORA" ? (
        <div className="w-full h-screen flex bg-slate-50 flex-col px-4 md:px-8 py-6">
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
                       const alunosAgendados = getAlunosAgendados(dateStr, time)
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
                            <span
                              className={`pt-2 text-sm ${
                                isBooked
                                  ? "text-blue-800"
                                  : "text-emerald-800"
                              }`}
                            >
                              {time}
                            </span>
                            {isBooked ? (
                              <span
                                className="w-full px-2 py-1.5 rounded-md text-sm mb-2 bg-blue-500 text-white text-center break-words shadow-sm hover:bg-blue-600 transition-colors"
                                style={{
                                  wordBreak: "break-word",
                                  whiteSpace: "normal",
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setModalAlunos(alunosAgendados)
                    
                                }}
                              >
                                {alunosAgendados.length === 0 ? (
                                  <span>Nenhum aluno agendado</span>
                                ) : alunosAgendados.length > 1 ? (
                                  <div className="flex flex-col gap-1">
                                    <span className="font-medium">
                                      {user?.role === "RESPONSAVEL"
                                        ? `${alunosAgendados.length} filhos agendados`
                                        : `${alunosAgendados.length} alunos agendados`}
                                    </span>
                                    <button
                                      onClick={(e) => {
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
                                    <span className="font-medium">
                                      {alunosAgendados[0].studentName}
                                    </span>
                                    <button className="text-xs bg-blue-600 hover:bg-blue-700 px-2 py-1.5 rounded transition-colors w-full sm:w-auto">
                                      (Opções)
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
                    const alunosAgendados = getAlunosAgendados(dateStr, time)
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
                        <span
                          className={`pt-2 text-sm ${
                            isBooked ? "text-blue-800" : "text-emerald-800"
                          }`}
                        >
                          {time}
                        </span>
                        {isBooked ? (
                          <span
                            className="w-full px-2 py-1.5 rounded-md text-sm mb-2 bg-blue-500 text-white text-center break-words shadow-sm hover:bg-blue-600 transition-colors"
                            style={{
                              wordBreak: "break-word",
                              whiteSpace: "normal",
                            }}
                          >
                            {alunosAgendados.length === 0 ? (
                              <span>Nenhum aluno agendado</span>
                            ) : alunosAgendados.length > 1 ? (
                              <div className="flex flex-col gap-1">
                                <span className="font-medium">
                                  {user?.role === "RESPONSAVEL"
                                    ? `${alunosAgendados.length} filhos agendados`
                                    : `${alunosAgendados.length} alunos agendados`}
                                </span>
                                <button
                                  onClick={(e) => {
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
                                <span className="font-medium">
                                  {alunosAgendados[0].studentName}
                                </span>
                                <button className="text-xs bg-blue-600 hover:bg-blue-700 px-2 py-1.5 rounded transition-colors w-full sm:w-auto">
                                  (Opções)
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
                          {format(date, "EEE", { locale: ptBR }).substring(
                            0,
                            3
                          )}
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
      ) : (
        <div className="w-full h-screen flex bg-slate-50 flex-col px-4 md:px-8 py-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Agendar Aula
          </h1>
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
                    format(date, "yyyy-MM-dd") ===
                    format(today, "yyyy-MM-dd");
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
                          const alunosAgendados = getAlunosAgendados(dateStr, time)
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
                            <span
                              className={`pt-2 text-sm ${
                                isBooked
                                  ? "text-blue-800"
                                  : "text-emerald-800"
                              }`}
                            >
                              {time}
                            </span>
                            {isBooked ? (
                              <span
                                className="w-full px-2 py-1.5 rounded-md text-sm mb-2 bg-blue-500 text-white text-center break-words shadow-sm hover:bg-blue-600 transition-colors"
                                style={{
                                  wordBreak: "break-word",
                                  whiteSpace: "normal",
                                }}
                              >
                                {alunosAgendados.length === 0 ? (
                                  <span>Nenhum aluno agendado</span>
                                ) : alunosAgendados.length > 1 ? (
                                  <div className="flex flex-col gap-1">
                                    <span className="font-medium">
                                      {user?.role === "RESPONSAVEL"
                                        ? `${alunosAgendados.length} filhos agendados`
                                        : `${alunosAgendados.length} alunos agendados`}
                                    </span>
                                    <button
                                      onClick={(e) => {
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
                                    <span className="font-medium">
                                      {alunosAgendados[0].studentName}
                                    </span>
                                    <button className="text-xs bg-blue-600 hover:bg-blue-700 px-2 py-1.5 rounded transition-colors w-full sm:w-auto">
                                      (Opções)
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
                    const alunosAgendados = getAlunosAgendados(dateStr, time)
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
                        <span
                          className={`pt-2 text-sm ${
                            isBooked ? "text-blue-800" : "text-emerald-800"
                          }`}
                        >
                          {time}
                        </span>
                        {isBooked ? (
                          <span
                            className="w-full px-2 py-1.5 rounded-md text-sm mb-2 bg-blue-500 text-white text-center break-words shadow-sm hover:bg-blue-600 transition-colors"
                            style={{
                              wordBreak: "break-word",
                              whiteSpace: "normal",
                            }}
                          >
                            {alunosAgendados.length === 0 ? (
                              <span>Nenhum aluno agendado</span>
                            ) : alunosAgendados.length > 1 ? (
                              <div className="flex flex-col gap-1">
                                <span className="font-medium">
                                  {user?.role === "RESPONSAVEL"
                                    ? `${alunosAgendados.length} filhos agendados`
                                    : `${alunosAgendados.length} alunos agendados`}
                                </span>
                                <button
                                  onClick={(e) => {
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
                                <span className="font-medium">
                                  {alunosAgendados[0].studentName}
                                </span>
                                <button className="text-xs bg-blue-600 hover:bg-blue-700 px-2 py-1.5 rounded transition-colors w-full sm:w-auto">
                                  (Opções)
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
                          {format(date, "EEE", { locale: ptBR }).substring(
                            0,
                            3
                          )}
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
      )}

      {/* Booking Modal */}
      <Modal
        isOpen={showBookingModal}
        onClose={handleModalClose}
        title={user?.role === "RESPONSAVEL" ? "Filhos Agendados" : "Alunos Agendados"}
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
                {user?.role === "RESPONSAVEL" ? 'Para qual filho?' : 'Para qual aluno?'}
              </label>
              <select
                id="child-select"
                name="child-select"
                multiple={String(user?.role) === 'PROFESSORA' ? false : true}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 min-h-[70px]"
                value={String(user?.role) === 'PROFESSORA' ? selectedStudentId : selectedChildren}
                onChange={(e) => {
                  if(String(user?.role) === "PROFESSORA"){
                    setSelectedStudentId(e.target.value)
                  } else {
                    const options = Array.from(e.target.selectedOptions).map(opt => opt.value)
                    setSelectedChildren(options)
                  }
                }}
                required
              >
                {(() => {
                  const listaDePessoas: Child[] = user?.role === 'PROFESSORA' ? teacherRegisteredStudents : userAssociatedPeople;
                  if (!selectedSlot || !listaDePessoas) return null;

                  const alunosJaAgendados = getAlunosAgendados(selectedSlot.date, selectedSlot.time)

                  const pessoasDisponiveis = listaDePessoas.filter((p: Child) => 
                    !alunosJaAgendados.some(alunoAgendado => alunoAgendado.studentName === p.name)
                  )

                  if (pessoasDisponiveis.length === 0) {
                    return <option disabled>Nenhum Aluno/filho disponível</option>;
                  }
                 
                  const defaultOption = String(user?.role) === "PROFESSORA" ? [<option key="disabled" value="" disabled>Selecione um aluno</option>] : [];
                  const options = pessoasDisponiveis.map((pessoa: Child) => (
                    <option key={pessoa.id} value={pessoa.id}>{pessoa.name}</option>
                  ));
                  return [...defaultOption, ...options];
                })()}
              </select>
              {/* MUDANÇA: A dica de seleção múltipla só aparece para o responsável */}
              {String(user?.role) !== 'PROFESSORA' && (
                <span className="text-xs text-gray-500 block mt-1">
                  Segure <b>Ctrl</b> (Windows) ou <b>Command</b> (Mac) para selecionar mais de um.
                </span>
              )}
            </div>

            {/* MUDANÇA: O seletor de professora só aparece se quem agenda NÃO é uma professora */}
            {String(user?.role) !== 'PROFESSORA' && (
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
                  <option value="" disabled>Selecione uma professora</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={String(teacher.id)}>
                      {teacher.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

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
                  if (!showCancelConfirmModal.date || !showCancelConfirmModal.time || !showCancelConfirmModal.studentName) {
                    console.error('[CancelButton] Dados incompletos:', showCancelConfirmModal);
                    toast.error('Erro: Dados incompletos para cancelamento');
                    return;
                  }

                  try {
                    setIsCanceling(true);
                    console.log('[CancelButton] Iniciando cancelamento com dados:', {
                      date: showCancelConfirmModal.date,
                      time: showCancelConfirmModal.time,
                      studentName: showCancelConfirmModal.studentName
                    });

                      await handleCancelSchedule(String(confirmingCancelId));

                    // Fecha o modal apenas se o cancelamento foi bem sucedido
                      setShowCancelConfirmModal({ show: false });
                    setModalAlunos(null); // Fecha também o modal de alunos
                    
                    // Atualiza a lista de agendamentos
                    await fetchSchedule();
                  } catch (error) {
                    console.error('[CancelButton] Erro ao cancelar:', error);
                    toast.error('Erro ao cancelar agendamento. Tente novamente.');
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
                      {aluno.studentName.split(" ").map((word: string) => word[0]).join("").toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-800">{aluno.studentName}</span>
                      <span className="text-sm text-gray-500">
                        {selectedSlot && `${formatDate(selectedSlot.date)} - ${selectedSlot.time}`}
                      </span>
                    </div>
                  </div>
                  {(user?.role === "RESPONSAVEL" || user?.role === "PROFESSORA") && (
                    <button
                      onClick={() => {
                        console.log('Preparando para cancelar o agendamento com ID:', aluno.scheduleId);

                        const horarioComAluno = horariosComAlunos.find(h => h.scheduleIds.includes(Number(aluno.scheduleId)))

                        if (horarioComAluno) {
                          setShowCancelConfirmModal({
                            show: true,
                            date: horarioComAluno.dia,
                            time: horarioComAluno.hora,
                            studentName: aluno.studentName
                          })
                          setModalAlunos(null);
                        } else{
                          toast.error("Não foi possivel encontrar horários da aula");
                        }

                        setConfirmingCancelId(aluno.scheduleId);

                        setShowSlotActionModal(true);


                        // Encontra o horário do aluno para o dia atual
                        // const horarioComAluno = horariosComAlunos.find(h => {
                        //   const match = h.alunos.includes(aluno.id);
                        //   console.log('[CancelButton] Verificando horário:', {
                        //     horario: h,
                        //     aluno,
                        //     match
                        //   });
                        //   return match;
                        // });
                        
                        // if (horarioComAluno) {
                        // console.log('[CancelButton] Horário encontrado:', horarioComAluno);
                    
                        //   // Atualiza a interface imediatamente
                        //   setModalAlunos(prev => prev ? prev.filter(a => a !== aluno) : null);
                          
                        // setShowCancelConfirmModal({
                        //   show: true,
                        //     date: horarioComAluno.dia,
                        //     time: horarioComAluno.hora,
                        //   studentName: aluno.studentName
                        // });
                        // } else {
                        //   console.error('[CancelButton] Horário não encontrado para:', aluno);
                        //   toast.error('Não foi possível encontrar o horário da aula');
                        // }
                       
                      }}
                      className="px-3 py-1.5 bg-red-500 text-white rounded hover:bg-red-600 transition-colors flex items-center gap-1 text-sm"
                    >
                      {/* <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg> */}
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
                      if (slotActionData) {
                        setModalAlunos(null);
                        setSelectedSlot({
                          date: slotActionData.date,
                          time: slotActionData.time
                        });
                        setShowSlotActionModal(false);
                        setShowBookingModal(true);
                      }
                    }}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors w-full"
                  >
                    Adicionar outro filho a esta aula
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
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors disabled:opacity-50"
                disabled={isCanceling}
                onClick={async () => {
                  if (!confirmingCancelId) return;

                  try {
                    setIsCanceling(true);
                    toast.loading('Cancelando agendamento...');   
                    await handleCancelSchedule(confirmingCancelId);                
                  // setShowSlotActionModal(false);
                  //   toast.success(`Aula de ${slotActionData.childName} cancelada com sucesso!`);
                  } catch (error) {
                    console.error('[SlotActionModal] Erro ao cancelar:', error);
                    toast.error('Erro ao cancelar agendamento. Tente novamente.');
                  } finally {
                    setIsCanceling(false);
                    setConfirmingCancelId(null)
                  }
                }}
               
              >
                {isCanceling ? (
                  <div className="flex items-center">
                    <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Cancelando...
                  </div>
                ) : (
                  'Sim, cancelar'
                )}
              </button>
              <button
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors"
                onClick={() => setShowSlotActionModal(false)}
                disabled={isCanceling}
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
    </>
  );
};

export default SchedulePage;
