import React, { useState } from "react";
import { format, addDays, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import Button from "../components/Button";
import Card, { CardHeader, CardBody } from "../components/Card";
import { Calendar, Clock, X } from "lucide-react";

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

// Mock data for children
const CHILDREN = [
  { id: "child1", name: "Maria Silva" },
  { id: "child2", name: "Pedro Santos" },
];

type ScheduleType = {
  [key: string]: {
    [key: string]: {
      childId: string;
      childName: string;
      booked: boolean;
    };
  };
};

const SchedulePage: React.FC = () => {
  const today = new Date();
  const startDate = startOfWeek(today, { weekStartsOn: 1 }); // Start from Monday

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
  const [selectedChild, setSelectedChild] = useState(CHILDREN[0].id);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{
    date: string;
    time: string;
  } | null>(null);

  // Handle slot click
  const handleSlotClick = (date: string, time: string) => {
    // If already booked by this user, ask to cancel
    if (schedule[date][time].booked) {
      if (
        window.confirm(
          `Cancelar a aula para ${schedule[date][time].childName}?`
        )
      ) {
        handleCancelBooking(date, time);
      }
    } else {
      // Open booking modal
      setSelectedSlot({ date, time });
      setShowBookingModal(true);
    }
  };

  // Handle booking confirmation
  const handleConfirmBooking = () => {
    if (!selectedSlot) return;

    const { date, time } = selectedSlot;
    const selectedChildName =
      CHILDREN.find((child) => child.id === selectedChild)?.name || "";

    // Update the schedule
    setSchedule((prev) => ({
      ...prev,
      [date]: {
        ...prev[date],
        [time]: {
          childId: selectedChild,
          childName: selectedChildName,
          booked: true,
        },
      },
    }));

    
    setShowBookingModal(false);
    setSelectedSlot(null);

    // Aqui é onde vai ser agendado a aula via whatsapp, ainda decidindo como vai ser a função
    alert(
      `Aula agendada com sucesso para ${selectedChildName} em ${format(
        new Date(date),
        "dd/MM/yyyy"
      )} às ${time}. Uma confirmação será enviada via WhatsApp.`
    );
  };

  // Handle booking cancellation
  const handleCancelBooking = (date: string, time: string) => {
    // Update the schedule
    setSchedule((prev) => ({
      ...prev,
      [date]: {
        ...prev[date],
        [time]: {
          childId: "",
          childName: "",
          booked: false,
        },
      },
    }));

    // na aula depois de cancelar, vai ser enviado uma notificação via whatsapp
    alert(`Aula cancelada. Uma notificação será enviada via WhatsApp.`);
  };

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
                    {Object.keys(schedule).map((date, idx) => (
                      <td
                        key={`${date}-${time}`}
                        className={
                          `px-6 py-4 whitespace-nowrap text-center text-sm ` +
                          (schedule[date][time].booked
                            ? "bg-indigo-50"
                            : "cursor-pointer hover:bg-indigo-100") +
                          " transition-colors duration-150" +
                          (idx === 0 ? " hidden sm:table-cell" : "")
                        }
                        onClick={() => handleSlotClick(date, time)}
                      >
                        {schedule[date][time].booked ? (
                          <div className="flex flex-col items-center">
                            <span className="font-medium text-indigo-600">
                              {schedule[date][time].childName}
                            </span>
                            <button
                              className="mt-1 text-xs text-red-500 hover:text-red-700"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCancelBooking(date, time);
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
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {/* Booking Modal */}
      {showBookingModal && selectedSlot && (
        <div
          className="fixed inset-0 z-10 overflow-y-auto"
          aria-labelledby="modal-title"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              aria-hidden="true"
            ></div>
            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="absolute top-0 right-0 pt-4 pr-4">
                <button
                  type="button"
                  className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                  onClick={() => setShowBookingModal(false)}
                >
                  <span className="sr-only">Fechar</span>
                  <X size={20} aria-hidden="true" />
                </button>
              </div>

              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 sm:mx-0 sm:h-10 sm:w-10">
                    <Calendar
                      className="h-6 w-6 text-indigo-600"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3
                      className="text-lg leading-6 font-medium text-gray-900"
                      id="modal-title"
                    >
                      Agendar Aula
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Você está agendando uma aula para{" "}
                        <span className="font-semibold">
                          {format(new Date(selectedSlot.date), "dd/MM/yyyy")}
                        </span>{" "}
                        às{" "}
                        <span className="font-semibold">
                          {selectedSlot.time}
                        </span>
                        .
                      </p>

                      <div className="mt-4">
                        <label
                          htmlFor="child-select"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Selecione o Aluno
                        </label>
                        <select
                          id="child-select"
                          value={selectedChild}
                          onChange={(e) => setSelectedChild(e.target.value)}
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        >
                          {CHILDREN.map((child) => (
                            <option key={child.id} value={child.id}>
                              {child.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="mt-4 flex items-center">
                        <Clock className="h-5 w-5 text-gray-400 mr-2" />
                        <p className="text-sm text-gray-600">Duração: 1 hora</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <Button
                  onClick={handleConfirmBooking}
                  className="w-full sm:w-auto sm:ml-3"
                >
                  Confirmar via WhatsApp
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowBookingModal(false)}
                  className="mt-3 w-full sm:mt-0 sm:w-auto"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchedulePage;
