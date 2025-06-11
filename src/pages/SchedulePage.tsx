import React, { useState, useEffect } from "react";
import { format, addDays, startOfWeek, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import Button from "../components/Button";
import Card, { CardHeader, CardBody } from "../components/Card";
import Select from "../components/Select";
import { apiService, ScheduleDTO, TeacherDetails } from "../services/api";
import { AxiosError } from "axios";
import Modal from "../components/Modal";
import authService from "../services/authService";
import LoadingSpinner from "../components/LoadingSpinner";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

// Time slots available for booking
const TIME_SLOTS = [
  "09:00",
  "10:00",
  "11:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
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
      const responsavelId = localStorage.getItem("responsavelId");
      if (!responsavelId) {
        setChildrenError(
          "ID do responsável não encontrado. Por favor, faça login novamente."
        );
        setLoadingChildren(false);
        setLoadingSchedule(false);
        setLoadingTeachers(false);
        return;
      }

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

        console.log("Crianças carregadas:", formattedChildren);
        setChildren(formattedChildren);
        setSelectedChild("");
        fetchedChildren = formattedChildren;
      } catch (err) {
        const error = err as AxiosError<{ message: string }>;
        setChildrenError(
          error.response?.data?.message || "Erro ao carregar seus filhos."
        );
        console.error("Erro ao carregar alunos:", err);
      } finally {
        setLoadingChildren(false);
      }

      // Fetch teachers
      try {
        setLoadingTeachers(true);
        const teachersResponse = await apiService.getTeachers();
        setTeachers(teachersResponse.data);
        // Selecionar o primeiro professor por padrão, se houver
        if (teachersResponse.data.length > 0) {
          setSelectedTeacherId(String(teachersResponse.data[0].id));
        }
      } catch (err) {
        const error = err as AxiosError<{ message: string }>;
        setTeachersError(
          error.response?.data?.message || "Erro ao carregar professoras."
        );
        console.error("Erro ao carregar professoras:", err);
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
        } catch (err) {
          const error = err as AxiosError<{ message: string }>;
          console.error("Erro ao carregar agendamentos:", error);
          setScheduleError("Não foi possível carregar os agendamentos.");
        } finally {
          setLoadingSchedule(false);
        }
      } else {
        setLoadingSchedule(false);
        setSchedule(initialSchedule);
      }
    };

    fetchAllData();
  }, []);

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
        if (window.confirm(`Cancelar a aula para ${currentSlot.childName}?`)) {
          handleCancelBooking(date, time, currentSlot.scheduleId);
        }
      } else if (!isBookedByMyChild) {
        alert(`Este horário já está reservado por outro aluno.`);
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
      return;
    }

    const { date, time } = selectedSlot;
    const selectedChildData = children.find(
      (child) => child.id === selectedChild
    );
    const guardianId = authService.getUserId();

    if (!selectedChildData || !guardianId) {
      alert(
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

      alert("Aula agendada com sucesso!");
      setShowBookingModal(false);
      setSelectedSlot(null);
      setSelectedChild("");
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      alert(
        `Erro ao agendar aula: ${
          error.response?.data?.message || "Erro desconhecido"
        }`
      );
      console.error("Erro ao agendar aula:", error);
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
      alert("Aula cancelada com sucesso!");
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      alert(
        `Erro ao cancelar aula: ${
          error.response?.data?.message || "Erro desconhecido"
        }`
      );
      console.error("Erro ao cancelar aula:", error);
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

  if (children.length === 0) {
    return (
      <div className="max-w-4xl mx-auto mt-8 bg-white rounded-xl shadow-md p-8 text-center">
        <h2 className="text-2xl font-bold mb-2">Nenhum filho cadastrado</h2>
        <p className="text-gray-600 mb-4">
          Você precisa cadastrar um filho antes de agendar aulas.
        </p>
        <Button
          onClick={() => alert("Navegar para página de cadastro de filhos")}
        >
          Cadastrar Filho
        </Button>
      </div>
    );
  }

  if (teachers.length === 0) {
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

  return (
    <div className="w-full !important space-y-6">
      <Card className="w-full !important">
        <CardHeader>
          <h1 className="text-2xl font-bold text-gray-800">Agendar Aula</h1>
          <p className="mt-1 text-gray-600">
            Selecione um horário disponível para agendar a aula do seu filho.
          </p>
        </CardHeader>
        <CardBody className="p-0">
          {/* Desktop view */}
          <div className="hidden md:block">
            <div className="grid grid-cols-7 gap-2 text-center text-sm font-semibold text-gray-700 mb-4">
              {weekDays.map((day) => (
                <div key={day}>{day}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 7 }).map((_, i) => {
                const date = addDays(startDate, i);
                const dateStr = format(date, "yyyy-MM-dd");
                return (
                  <div key={i} className="space-y-1">
                    <div className="text-center text-xs text-gray-500">
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
                          className={`relative w-full h-16 rounded-md flex items-center justify-center text-xs font-medium cursor-pointer transition-colors \
                            ${
                              isBooked
                                ? isBookedByMyChild
                                  ? "bg-blue-200 text-blue-800 hover:bg-blue-300"
                                  : "bg-gray-200 text-gray-600 cursor-not-allowed"
                                : "bg-green-100 text-green-700 hover:bg-green-200"
                            }
                          `}
                          onClick={() => handleSlotClick(dateStr, time)}
                        >
                          {time}
                          {isBooked && (
                            <span
                              className={`absolute bottom-1 px-1 py-0.5 rounded-full text-[0.6rem] \
                                ${
                                  isBookedByMyChild
                                    ? "bg-blue-400 text-white"
                                    : "bg-gray-400 text-white"
                                }
                              }
                            `}
                            >
                              {slot?.childName}
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
                    ? children.some(
                        (child) => String(child.id) === slot?.childId
                      )
                    : false;

                  return (
                    <div
                      key={time}
                      className={`relative w-full h-16 rounded-md flex items-center justify-center text-xs font-medium cursor-pointer transition-colors \
                        ${
                          isBooked
                            ? isBookedByMyChild
                              ? "bg-blue-200 text-blue-800 hover:bg-blue-300"
                              : "bg-gray-200 text-gray-600 cursor-not-allowed"
                            : "bg-green-100 text-green-700 hover:bg-green-200"
                        }
                      `}
                      onClick={() => handleSlotClick(dateStr, time)}
                    >
                      {time}
                      {isBooked && (
                        <span
                          className={`absolute bottom-1 px-1 py-0.5 rounded-full text-[0.6rem] \
                            ${
                              isBookedByMyChild
                                ? "bg-blue-400 text-white"
                                : "bg-gray-400 text-white"
                            }
                          }
                        `}
                        >
                          {slot?.childName}
                        </span>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </CardBody>
      </Card>

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
};

export default SchedulePage;
