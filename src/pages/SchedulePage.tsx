import React, { useState, useEffect } from "react";
import { format, addDays, startOfWeek, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import Button from "../components/Button";
import Card, { CardHeader, CardBody } from "../components/Card";
import { Clock } from "lucide-react";
import Select from "../components/Select";
import { apiService, ScheduleDTO } from "../services/api";
import { AxiosError } from "axios";
import Modal from "../components/Modal";
import authService from "../services/authService";
import LoadingSpinner from "../components/LoadingSpinner";

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

  useEffect(() => {
    const fetchAllData = async () => {
      const responsavelId = localStorage.getItem("responsavelId");
      if (!responsavelId) {
        setChildrenError(
          "ID do responsável não encontrado. Por favor, faça login novamente."
        );
        setLoadingChildren(false);
        setLoadingSchedule(false);
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
      !!childrenError ||
      !!scheduleError ||
      children.length === 0
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
    if (!selectedSlot || !selectedChild) {
      console.log("Slot ou aluno não selecionado:", {
        selectedSlot,
        selectedChild,
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

      setShowBookingModal(false);
      setSelectedSlot(null);

      alert(
        `Aula agendada com sucesso para ${selectedChildData.name} em ${format(
          new Date(date),
          "dd/MM/yyyy"
        )} às ${time}. Uma confirmação será enviada via WhatsApp.`
      );
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      if (error.response?.status === 409) {
        alert("Conflito: já existe uma aula agendada para esse horário.");
      } else if (error.response?.status === 404) {
        alert("Aluno não encontrado.");
      } else {
        alert("Erro ao agendar aula. Tente novamente.");
      }
    }
  };

  // Handle booking cancellation
  const handleCancelBooking = async (
    date: string,
    time: string,
    scheduleId: number
  ) => {
    if (
      !window.confirm(
        `Tem certeza que deseja cancelar o agendamento ${scheduleId}?`
      )
    ) {
      return;
    }

    try {
      await apiService.deleteSchedule(scheduleId);

      setSchedule((prev) => ({
        ...prev,
        [date]: {
          ...prev[date],
          [time]: {
            childId: "",
            childName: "",
            booked: false,
            scheduleId: undefined,
          },
        },
      }));

      alert(`Aula ${scheduleId} cancelada com sucesso.`);
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      console.error("Erro ao cancelar aula:", error);
      alert("Erro ao cancelar aula. Tente novamente.");
    }
  };

  const handleModalClose = () => {
    setShowBookingModal(false);
    setSelectedSlot(null);
  };

  const handleChildChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value;
    console.log("Mudando seleção de aluno para:", newValue);
    const selectedChild = children.find(
      (child) => String(child.id) === newValue
    );
    console.log("Dados do aluno selecionado:", selectedChild);
    setSelectedChild(newValue);
  };

  if (loadingChildren || loadingSchedule) {
    return (
      <div className="flex justify-center items-center h-40">
        <LoadingSpinner />
        <p className="ml-2 text-gray-500">Carregando calendário...</p>
      </div>
    );
  }

  if (childrenError || scheduleError) {
    return (
      <p className="text-center text-red-500 mt-8">
        Erro ao carregar o calendário: {childrenError || scheduleError}
      </p>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <Card className="overflow-visible rounded-t-2xl bg-white">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-t-2xl">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Agendar Aula</h1>
            <p className="mt-1 text-gray-600">
              Clique em um horário disponível para agendar uma aula
            </p>
          </div>
          <div className="mt-3 sm:mt-0">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span className="inline-block w-3 h-3 bg-indigo-500 rounded-full"></span>
              <span>Reservado</span>
              <span className="ml-4 inline-block w-3 h-3 bg-gray-200 rounded-full"></span>
              <span>Disponível</span>
            </div>
          </div>
        </CardHeader>
        <p className="block sm:hidden text-center text-xs text-gray-700 bg-gray-100 rounded-md py-2 px-4 mb-3 mt-3 mx-4 flex items-center justify-center gap-1">
          <span className="text-base">⇄</span>
          Role para o lado para ver todos os dias disponíveis.
        </p>
        <CardBody className="overflow-x-auto">
          <div className="min-w-[700px]">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-8 py-3 w-28 min-w-[110px] text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 z-10 bg-white !bg-white shadow-[4px_0_12px_-4px_rgba(0,0,0,0.06)] border-r border-gray-100 overflow-hidden h-full whitespace-nowrap">
                    Horário
                  </th>
                  {Object.keys(schedule).map((date, idx) => (
                    <th
                      key={date}
                      className={
                        `px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider` +
                        (idx === 0 ? " hidden sm:table-cell" : "")
                      }
                    >
                      <div className="flex flex-col items-center">
                        <span>
                          {format(new Date(date), "EEEE", { locale: ptBR })}
                        </span>
                        <span>{format(new Date(date), "dd/MM")}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {TIME_SLOTS.map((time) => (
                  <tr key={time} className="hover:bg-gray-50">
                    <td className="px-8 py-4 w-28 min-w-[110px] font-bold text-gray-900 sticky left-0 z-10 bg-white !bg-white shadow-[4px_0_12px_-4px_rgba(0,0,0,0.06)] border-r border-gray-100 overflow-hidden h-full whitespace-nowrap">
                      {time}
                    </td>
                    {Object.keys(schedule).map((date, idx) => {
                      const slot = schedule[date][time];
                      return (
                        <td
                          key={`${date}-${time}`}
                          className={`px-6 py-4 whitespace-nowrap text-center text-sm ${
                            slot.booked
                              ? "bg-indigo-50"
                              : "cursor-pointer hover:bg-indigo-100"
                          } transition-colors duration-150 ${
                            idx === 0 ? "hidden sm:table-cell" : ""
                          }`}
                          onClick={() => handleSlotClick(date, time)}
                        >
                          {slot.booked ? (
                            <div className="flex flex-col items-center">
                              <span className="font-medium text-indigo-600">
                                {slot.childName}
                              </span>
                              <button
                                className="mt-1 text-xs text-red-500 hover:text-red-700"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (slot.scheduleId) {
                                    handleCancelBooking(
                                      date,
                                      time,
                                      slot.scheduleId
                                    );
                                  }
                                }}
                              >
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <div className="h-6 flex items-center justify-center text-gray-400">
                              <span>Disponível</span>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {/* Booking Modal */}
      {showBookingModal && selectedSlot && (
        <Modal
          isOpen={showBookingModal}
          onClose={handleModalClose}
          title="Agendar Aula"
        >
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-4">
              Você está agendando uma aula para{" "}
              <span className="font-semibold">
                {format(new Date(selectedSlot.date), "dd/MM/yyyy")}
              </span>{" "}
              às <span className="font-semibold">{selectedSlot.time}</span>.
            </p>

            <div className="mb-4">
              <Select
                label="Selecione o Aluno"
                id="select-child"
                name="select-child"
                options={children.map((child) => ({
                  value: child.id,
                  label: child.name,
                }))}
                value={selectedChild}
                onChange={handleChildChange}
                placeholder="Selecione um aluno"
                required
                disabled={
                  loadingChildren || !!childrenError || children.length === 0
                }
              />
              {loadingChildren && (
                <p className="text-sm text-gray-500 mt-2">
                  Carregando alunos...
                </p>
              )}
              {childrenError && (
                <p className="text-sm text-red-500 mt-2">
                  Erro ao carregar alunos: {childrenError}
                </p>
              )}
              {!loadingChildren && !childrenError && children.length === 0 && (
                <p className="text-sm text-red-500 mt-2">
                  Nenhum aluno cadastrado para este responsável.
                </p>
              )}
            </div>

            <div className="mt-4 flex items-center justify-center">
              <Clock className="h-5 w-5 text-gray-400 mr-2" />
              <p className="text-sm text-gray-600">Duração: 1 hora</p>
            </div>
          </div>

          <div className="mt-5 sm:mt-6">
            <Button
              type="button"
              onClick={handleConfirmBooking}
              disabled={!selectedChild || loadingChildren}
              className="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm"
            >
              Confirmar via WhatsApp
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default SchedulePage;
