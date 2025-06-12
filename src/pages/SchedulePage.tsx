import React, { useState, useEffect } from "react";
import { format, addDays, startOfWeek, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import Button from "../components/Button";
// import Card, { CardHeader, CardBody } from "../components/Card"; // Card and CardHeader removed
// import { CardBody } from "../components/Card"; // Only CardBody is kept for now - removed as it's not used
import Select from "../components/Select";
import { apiService, ScheduleDTO, TeacherDetails } from "../services/api";
import { AxiosError } from "axios";
import Modal from "../components/Modal";
import authService from "../services/authService";
import LoadingSpinner from "../components/LoadingSpinner";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";

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
  const [selectedChild, setSelectedChild] = useState<string>("");
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

  useEffect(() => {
    const fetchAllData = async () => {
      if (!user) return;
      // --- Lógica para RESPONSÁVEL ---
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
          setSelectedChild("");
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
              const schedulesResponse =
                await apiService.getSchedulesByStudentId(Number(child.id));
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
      }
      // --- Lógica para PROFESSORA ---
      else if (user.role === "PROFESSORA") {
        try {
          setLoadingSchedule(true);
          // Busca todos os agendamentos da escola
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
    fetchAllData();
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

      if (isBookedByMyChild && currentSlot.scheduleId) {
        toast(
          (t) => (
            <div className="flex flex-col items-center p-4">
              <p className="text-lg font-semibold mb-4 text-center">
                Cancelar a aula para {currentSlot.childName}?
              </p>
              <div className="flex space-x-4">
                <button
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                  onClick={() => {
                    handleCancelBooking(date, time, currentSlot.scheduleId!);
                    toast.dismiss(t.id);
                  }}
                >
                  Sim, cancelar
                </button>
                <button
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors"
                  onClick={() => toast.dismiss(t.id)}
                >
                  Não, manter
                </button>
              </div>
            </div>
          ),
          {
            duration: Infinity,
            style: {
              background: "#fff",
              color: "#000",
            },
          }
        );
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
    if (!selectedSlot || !selectedChild || !selectedTeacherId) {
      console.log("Slot, aluno ou professor não selecionado:", {
        selectedSlot,
        selectedChild,
        selectedTeacherId,
      });
      toast.error("Por favor, selecione um slot, aluno e professor.");
      return;
    }

    const { date, time } = selectedSlot;
    const selectedChildData = children.find(
      (child) => child.id === selectedChild
    );
    const guardianId = authService.getUserId();

    if (!selectedChildData || !guardianId) {
      toast.error(
        "Erro: Por favor, selecione um aluno válido e certifique-se de estar logado."
      );
      return;
    }

    try {
      const response = await apiService.bookClass({
        date,
        time,
        childId: selectedChildData.id,
        childName: selectedChildData.name,
        modality: "IN_PERSON",
        guardianId: guardianId,
        teacherId: Number(selectedTeacherId),
      });

      setSchedule((prev) => {
        const newSchedule = {
          ...prev,
          [date]: {
            ...prev[date],
            [time]: {
              childId: selectedChildData.id,
              childName: selectedChildData.name,
              booked: true,
              scheduleId: response.data.id,
            },
          },
        };
        return newSchedule;
      });

      toast.success("Aula agendada com sucesso!");
      setShowBookingModal(false);
      setSelectedSlot(null);
      setSelectedChild("");
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
    setSelectedChild("");
  };

  const handleChildChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedChild(e.target.value);
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
      <div>
        Nenhum filho cadastrado
        {/* ... */}
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
    // Layout diário igual ao do responsável
    return (
      <div className="w-full h-screen flex flex-col px-4 md:px-8 py-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Agenda da Professora
        </h1>
        <p className="mt-1 text-gray-600 mb-4">
          Veja seus agendamentos da semana.
        </p>
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="outline"
            onClick={() => setCurrentDayIndex((prev) => Math.max(0, prev - 1))}
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
            onClick={() => setCurrentDayIndex((prev) => Math.min(6, prev + 1))}
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
                      ? "bg-blue-200 text-blue-800 hover:bg-blue-300"
                      : "bg-green-100 text-green-700 hover:bg-green-200"
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
                      style={{ wordBreak: "break-word", whiteSpace: "normal" }}
                      title={slot.childName}
                    >
                      {slot.childName}
                    </span>
                  )}
                </div>
              );
            });
          })()}
        </div>
        {/* Week Calendar Modal */}
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
                  <div className="text-lg font-bold">{format(date, "dd")}</div>
                </button>
              );
            })}
          </div>
        </Modal>
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
          <div className="grid grid-cols-8 gap-1">
            {/* Top row for day headers + empty corner */}
            <div className="col-span-1"></div>{" "}
            {/* Empty cell for time column header */}
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
            {/* Time labels column */}
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
            {/* Main calendar grid (7 columns for days) */}
            {Array.from({ length: 7 }).map((_, i) => {
              const date = addDays(startDate, i);
              const dateStr = format(date, "yyyy-MM-dd");
              return (
                <div key={i} className="flex flex-col">
                  <div className="text-center text-xs text-gray-500 py-1">
                    {format(date, "dd/MM")}
                  </div>
                  {TIME_SLOTS.map((time) => {
                    const slot = schedule[dateStr]?.[time];
                    const isBooked = slot?.booked;
                    const isBookedByMyChild = isBooked
                      ? children.some(
                          (child) => String(child.id) === slot?.childId
                        )
                      : false;

                    return (
                      <div
                        key={time}
                        className={`relative w-full h-16 border border-gray-200 flex flex-col items-center justify-between text-xs font-medium cursor-pointer transition-colors ${
                          isBooked
                            ? isBookedByMyChild
                              ? "bg-blue-200 text-blue-800 hover:bg-blue-300"
                              : "bg-gray-200 text-gray-600 cursor-not-allowed"
                            : "bg-green-100 text-green-700 hover:bg-green-200"
                        }`}
                        onClick={() => handleSlotClick(dateStr, time)}
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
                            title={slot.childName}
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
                const slot = schedule[dateStr]?.[time];
                const isBooked = slot?.booked;
                const isBookedByMyChild = isBooked
                  ? children.some((child) => String(child.id) === slot?.childId)
                  : false;

                return (
                  <div
                    key={time}
                    className={`relative w-full h-16 rounded-md flex flex-col items-center justify-between text-xs font-medium cursor-pointer transition-colors ${
                      isBooked
                        ? isBookedByMyChild
                          ? "bg-blue-200 text-blue-800 hover:bg-blue-300"
                          : "bg-gray-200 text-gray-600 cursor-not-allowed"
                        : "bg-green-100 text-green-700 hover:bg-green-200"
                    }`}
                    onClick={() => handleSlotClick(dateStr, time)}
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
                        title={slot.childName}
                      >
                        {slot.childName}
                      </span>
                    )}
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      <Modal
        isOpen={showBookingModal}
        onClose={handleModalClose}
        title="Confirmar Agendamento"
      >
        {selectedSlot && (
          <div className="space-y-4">
            <p className="text-gray-700">
              Você está prestes a agendar uma aula para:
            </p>
            <p className="text-lg font-semibold text-gray-800">
              Data:{" "}
              {format(parseISO(selectedSlot.date), "dd/MM/yyyy", {
                locale: ptBR,
              })}
            </p>
            <p className="text-lg font-semibold text-gray-800">
              Horário: {selectedSlot.time}
            </p>

            <Select
              label="Para qual filho?"
              id="child-select"
              name="child-select"
              options={children.map((child) => ({
                value: child.id,
                label: child.name,
              }))}
              value={selectedChild}
              onChange={handleChildChange}
              placeholder="Selecione um filho"
              required
            />

            <Select
              label="Com qual professora?"
              id="teacher-select"
              name="teacher-select"
              options={teachers.map((teacher) => ({
                value: String(teacher.id),
                label: teacher.name,
              }))}
              value={selectedTeacherId || ""}
              onChange={handleTeacherChange}
              placeholder="Selecione uma professora"
              required
            />

            <Button onClick={handleConfirmBooking} className="w-full">
              Confirmar Agendamento
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SchedulePage;
