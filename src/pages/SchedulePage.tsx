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

const SchedulePage: React.FC = () => {
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

  const [horariosComAlunos, setHorariosComAlunos] = useState<
    { dia: string; hora: string; alunos: string[] }[]
  >([]);
  const [modalAlunos, setModalAlunos] = useState<string[] | null>(null);

  const [showSlotActionModal, setShowSlotActionModal] = useState(false);
  const [slotActionData, setSlotActionData] = useState<{
    date: string;
    time: string;
    scheduleId: number;
    childName: string;
    filhosNaoAgendados: Child[];
  } | null>(null);

  const fetchSchedule = async () => {
    if (!user) return;
    if (user.role === "RESPONSAVEL") {
      const responsavelId = user.id;
      let fetchedChildren: Child[] = [];
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
        fetchedChildren = formattedChildren;
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
      if (fetchedChildren.length > 0) {
        try {
          setLoadingSchedule(true);
          const currentWeekSchedule: ScheduleType = { ...initialSchedule };
          for (const child of fetchedChildren) {
            const schedulesResponse = await apiService.getSchedulesByStudentId(
              Number(child.id)
            );
            schedulesResponse.data.forEach((scheduleItem: ScheduleDTO) => {
              const startTime = parseISO(scheduleItem.startTime);
              const dateStr = format(startTime, "yyyy-MM-dd");
              const timeStr = format(startTime, "HH:mm");
              if (
                currentWeekSchedule[dateStr] &&
                currentWeekSchedule[dateStr][timeStr]
              ) {
                currentWeekSchedule[dateStr][timeStr] = {
                  childId: String(scheduleItem.studentId),
                  childName: child.name,
                  booked: true,
                  scheduleId: scheduleItem.id,
                };
              }
            });
          }
          setSchedule(currentWeekSchedule);
        } catch {
          setScheduleError("Não foi possível carregar os agendamentos.");
        } finally {
          setLoadingSchedule(false);
        }
      } else {
        setLoadingSchedule(false);
        setSchedule(initialSchedule);
      }
    } else if (user.role === "PROFESSORA") {
      try {
        setLoadingSchedule(true);
        const horariosResponse =
          await scheduleService.getSchedulesWithStudents();
        setHorariosComAlunos(horariosResponse);
        const schedulesResponse = await apiService.getAllSchedules();
        const currentWeekSchedule: ScheduleType = { ...initialSchedule };
        schedulesResponse.data.forEach((scheduleItem: ScheduleDTO) => {
          const startTime = parseISO(scheduleItem.startTime);
          const dateStr = format(startTime, "yyyy-MM-dd");
          const timeStr = format(startTime, "HH:mm");
          if (
            currentWeekSchedule[dateStr] &&
            currentWeekSchedule[dateStr][timeStr]
          ) {
            currentWeekSchedule[dateStr][timeStr] = {
              childId: String(scheduleItem.studentId),
              childName:
                scheduleItem.studentName || String(scheduleItem.studentId),
              booked: true,
              scheduleId: scheduleItem.id,
            };
          }
        });
        setSchedule(currentWeekSchedule);
        setLoadingChildren(false);
        setLoadingTeachers(false);
      } catch {
        setScheduleError(
          "Não foi possível carregar os agendamentos da escola."
        );
      } finally {
        setLoadingSchedule(false);
      }
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, [user]);

  // Handle slot click
  const handleSlotClick = (date: string, time: string) => {
    if (
      loadingChildren ||
      loadingSchedule ||
      loadingTeachers ||
      !!childrenError ||
      !!scheduleError ||
      !!teachersError ||
      children.length === 0 ||
      teachers.length === 0
    ) {
      return;
    }

    const currentSlot = schedule[date]?.[time];

    if (currentSlot && currentSlot.booked) {
      const isBookedByMyChild = children.some(
        (child) => String(child.id) === currentSlot.childId
      );

      // Verificar todos os filhos já agendados nesse slot
      const filhosJaAgendados: string[] = [];
      if (
        schedule[date] &&
        schedule[date][time] &&
        schedule[date][time].booked
      ) {
        filhosJaAgendados.push(schedule[date][time].childId);
      }
      const meusFilhosNaoAgendados = children.filter(
        (child) => !filhosJaAgendados.includes(child.id)
      );

      if (isBookedByMyChild && currentSlot.scheduleId) {
        setSlotActionData({
          date,
          time,
          scheduleId: currentSlot.scheduleId,
          childName: currentSlot.childName,
          filhosNaoAgendados: meusFilhosNaoAgendados,
        });
        setShowSlotActionModal(true);
      } else if (!isBookedByMyChild) {
        toast.error(`Este horário já está reservado por outro aluno.`);
      }
    } else {
      setSelectedSlot({ date, time });
      setShowBookingModal(true);
    }
  };

  // Handle booking confirmation
  const handleConfirmBooking = async () => {
    if (!selectedSlot || selectedChildren.length === 0 || !selectedTeacherId) {
      toast.error(
        "Por favor, selecione um slot, pelo menos um aluno e professor."
      );
      return;
    }

    const { date, time } = selectedSlot;
    const guardianId = authService.getUserId();
    if (!guardianId) {
      toast.error("Erro: Certifique-se de estar logado.");
      return;
    }

    try {
      // Garante que studentIds são IDs de alunos (Student), vindos de children
      const studentIds = selectedChildren
        .map((id) => children.find((child) => child.id === id))
        .filter((child) => !!child)
        .map((child) => Number(child!.id));
      // Pega dados do primeiro aluno só para difficulties/condition (ajuste se necessário)
      const firstChild = children.find(
        (child) => child.id === selectedChildren[0]
      );
      await apiService.bookClass({
        studentIds,
        date,
        time,
        modality: "IN_PERSON",
        guardianId: guardianId,
        teacherId: Number(selectedTeacherId),
        difficulties: firstChild?.difficulties || "",
        condition: firstChild?.condition || "",
      });

      toast.success("Aula agendada com sucesso!");
      setShowBookingModal(false);
      setSelectedSlot(null);
      setSelectedChildren([]);

      await fetchSchedule();
    } catch {
      setScheduleError("Não foi possível agendar aula.");
    }
  };

  const handleCancelBooking = async (
    date: string,
    time: string,
    scheduleId: number
  ) => {
    try {
      await apiService.deleteSchedule(scheduleId);
      setSchedule((prev) => {
        const newSchedule = { ...prev };
        if (newSchedule[date] && newSchedule[date][time]) {
          newSchedule[date][time] = {
            childId: "",
            childName: "",
            booked: false,
          };
        }
        return newSchedule;
      });
      toast.success("Aula cancelada com sucesso!");
    } catch {
      setScheduleError("Não foi possível cancelar aula.");
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

  if (loadingChildren || loadingSchedule || loadingTeachers) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingSpinner />
        <p className="ml-2 text-gray-500">Carregando dados...</p>
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
    if (loadingSchedule) {
      return (
        <div className="flex justify-center items-center h-screen">
          <LoadingSpinner />
          <p className="ml-2 text-gray-500">
            Carregando agenda da professora...
          </p>
        </div>
      );
    }
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
                    className="h-16 flex items-center justify-end pr-2 text-xs text-gray-500 border-r border-gray-200"
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
                      const alunosSlot =
                        horariosComAlunos.find(
                          (h) => h.dia === dateStr && h.hora === time
                        )?.alunos || [];
                      const isBooked = alunosSlot.length > 0;
                      return (
                        <div
                          key={time}
                          className={`relative w-full h-16 border border-gray-200 flex flex-col items-center justify-between text-xs font-medium transition-colors ${
                            isBooked
                              ? "bg-blue-200 text-blue-800"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          <span
                            className={`pt-2 text-sm ${
                              isBooked ? "text-gray-800" : ""
                            }`}
                          >
                            {time}
                          </span>
                          {isBooked && (
                            <span
                              className="w-full px-2 py-1 rounded-full text-sm mb-2 bg-blue-500 text-white text-center break-words"
                              style={{
                                wordBreak: "break-word",
                                whiteSpace: "normal",
                              }}
                            >
                              {alunosSlot.length > 1 ? (
                                <button
                                  className="text-white underline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setModalAlunos(alunosSlot);
                                  }}
                                >
                                  {`${alunosSlot.length} alunos agendados`}
                                </button>
                              ) : (
                                alunosSlot[0]
                              )}
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
                variant="outline"
                onClick={() =>
                  setCurrentDayIndex((prev) => Math.max(0, prev - 1))
                }
                disabled={currentDayIndex === 0}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <button
                onClick={() => setShowWeekCalendarModal(true)}
                className="flex items-center gap-2 text-lg font-semibold text-gray-800 hover:text-primary transition-colors"
              >
                <Calendar className="h-5 w-5" />
                {format(addDays(startDate, currentDayIndex), "EEEE, dd/MM", {
                  locale: ptBR,
                })}
              </button>
              <Button
                variant="outline"
                onClick={() =>
                  setCurrentDayIndex((prev) => Math.min(6, prev + 1))
                }
                disabled={currentDayIndex === 6}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
            <div className="space-y-1">
              {(() => {
                const date = addDays(startDate, currentDayIndex);
                const dateStr = format(date, "yyyy-MM-dd");
                return TIME_SLOTS.map((time) => {
                  const slot = schedule[dateStr]?.[time];
                  const isBooked = slot?.booked;
                  return (
                    <div
                      key={time}
                      className={`relative w-full h-16 rounded-md flex flex-col items-center justify-between text-xs font-medium transition-colors ${
                        isBooked
                          ? "bg-blue-200 text-blue-800"
                          : "bg-green-100 text-green-700"
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSlotClick(dateStr, time);
                      }}
                    >
                      <span
                        className={`pt-2 text-sm ${
                          isBooked ? "text-gray-800" : ""
                        }`}
                      >
                        {time}
                      </span>
                      {isBooked && slot.childName && (
                        <span
                          className="w-full px-2 py-1 rounded-full text-sm mb-2 bg-blue-500 text-white text-center break-words"
                          style={{
                            wordBreak: "break-word",
                            whiteSpace: "normal",
                          }}
                        >
                          {slot.childName}
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
                  className="h-16 flex items-center justify-end pr-2 text-xs text-gray-500 border-r border-gray-200"
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
                    // Para responsáveis, mostrar o nome do aluno agendado
                    const slot = schedule[dateStr]?.[time];
                    const isBooked = slot?.booked;
                    return (
                      <div
                        key={time}
                        className={`relative w-full h-16 border border-gray-200 flex flex-col items-center justify-between text-xs font-medium cursor-pointer transition-colors ${
                          isBooked
                            ? "bg-blue-200 text-blue-800 hover:bg-blue-300"
                            : "bg-green-100 text-green-700 hover:bg-green-200"
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSlotClick(dateStr, time);
                        }}
                      >
                        <span
                          className={`pt-2 text-sm ${
                            isBooked ? "text-gray-800" : ""
                          }`}
                        >
                          {time}
                        </span>
                        {isBooked && slot.childName && (
                          <span
                            className="w-full px-2 py-1 rounded-full text-sm mb-2 bg-blue-500 text-white text-center break-words"
                            style={{
                              wordBreak: "break-word",
                              whiteSpace: "normal",
                            }}
                          >
                            {slot.childName}
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
              variant="outline"
              onClick={() =>
                setCurrentDayIndex((prev) => Math.max(0, prev - 1))
              }
              disabled={currentDayIndex === 0}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <button
              onClick={() => setShowWeekCalendarModal(true)}
              className="flex items-center gap-2 text-lg font-semibold text-gray-800 hover:text-primary transition-colors"
            >
              <Calendar className="h-5 w-5" />
              {format(addDays(startDate, currentDayIndex), "EEEE, dd/MM", {
                locale: ptBR,
              })}
            </button>
            <Button
              variant="outline"
              onClick={() =>
                setCurrentDayIndex((prev) => Math.min(6, prev + 1))
              }
              disabled={currentDayIndex === 6}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
          <div className="space-y-1">
            {(() => {
              const date = addDays(startDate, currentDayIndex);
              const dateStr = format(date, "yyyy-MM-dd");
              return TIME_SLOTS.map((time) => {
                // Para responsáveis, mostrar o nome do aluno agendado
                const slot = schedule[dateStr]?.[time];
                const isBooked = slot?.booked;
                return (
                  <div
                    key={time}
                    className={`relative w-full h-16 rounded-md flex flex-col items-center justify-between text-xs font-medium transition-colors ${
                      isBooked
                        ? "bg-blue-200 text-blue-800"
                        : "bg-green-100 text-green-700"
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSlotClick(dateStr, time);
                    }}
                  >
                    <span
                      className={`pt-2 text-sm ${
                        isBooked ? "text-gray-800" : ""
                      }`}
                    >
                      {time}
                    </span>
                    {isBooked && slot.childName && (
                      <span
                        className="w-full px-2 py-1 rounded-full text-sm mb-2 bg-blue-500 text-white text-center break-words"
                        style={{
                          wordBreak: "break-word",
                          whiteSpace: "normal",
                        }}
                      >
                        {slot.childName}
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
      <Modal isOpen={showBookingModal} onClose={handleModalClose} title={null}>
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
                  {format(parseISO(selectedSlot.date), "dd/MM/yyyy", {
                    locale: ptBR,
                  })}
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
                    const filhosJaAgendados: string[] = Object.values(
                      schedule[selectedSlot.date] || {}
                    )
                      .filter((slot) => slot.booked)
                      .map((slot) => slot.childId);
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

      {modalAlunos && (
        <Modal
          isOpen={!!modalAlunos}
          onClose={() => setModalAlunos(null)}
          title="Alunos agendados"
        >
          <ul>
            {modalAlunos.map((nome, idx) => (
              <li key={idx}>{nome}</li>
            ))}
          </ul>
          <button
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
            onClick={() => setModalAlunos(null)}
          >
            Fechar
          </button>
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
                  handleCancelBooking(
                    slotActionData.date,
                    slotActionData.time,
                    slotActionData.scheduleId
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
