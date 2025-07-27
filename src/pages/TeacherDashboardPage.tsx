import React, { useState, useEffect } from "react";
import Tooltip from "@tippyjs/react";
import { format, addDays, startOfWeek, isSameDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import Card, { CardHeader, CardBody } from "../components/Card";
import Button from "../components/Button";
import {
  Calendar,
  Clock,
  Mail,
  Phone,
  User,
  FileText,
  MessageSquare,
  Book,
  Plus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { apiService } from "../services/api";

import LoadingSpinner from "../components/LoadingSpinner";
import { AxiosError } from "axios";
import { useAuth } from "../contexts/AuthContext";
import Textarea from "../components/Textarea";
import SuccessModal from "../components/SuccessModal";
import studentService from "../services/studentService";

// Interface para as aulas agendadas (incluindo dados basicos do aluno para exibicao rapida)
interface ScheduledClass {
  id: string;
  studentId: number;
  studentName: string;
  age: number;
  grade: string;
  date: string;
  time: string;
  duration: number;
  type: "presencial" | "online";
  parentName: string;
  parentContact: string;
  subject: string;
  description: string;
  difficulties: string;
  condition: string;
}

// Interface para os detalhes completos do aluno (TeacherStudent do backend)
interface StudentDetails {
  id: number;
  name: string;
  age: number;
  grade: string;
  parentName: string;
  parentContact: string;
  learningDifficulties: string;
  personalCondition: string;
  classType: "IN_PERSON" | "ONLINE" | "HYBRID";
}

const TeacherDashboardPage: React.FC = () => {
  const today = new Date();
  const startDate = startOfWeek(today, { weekStartsOn: 1 });

  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(startDate);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Novos estados para dados reais e carregamento
  const [teacherSchedules, setTeacherSchedules] = useState<ScheduledClass[]>(
    []
  );
  const [teacherStudents, setTeacherStudents] = useState<StudentDetails[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  const { user, loading: authLoading } = useAuth();

  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyStudentId, setHistoryStudentId] = useState<string | null>(null);
  const [historyClassId, setHistoryClassId] = useState<string | null>(null);
  const [historyText, setHistoryText] = useState("");

  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [studentDetailsModalData, setStudentDetailsModalData] =
    useState<StudentDetails | null>(null);

  const [currentGuardianId, setCurrentGuardianId] = useState<number | null>(
    null
  );

  useEffect(() => {
    console.log(
      "[TeacherDashboardPage] useEffect - user:",
      user,
      "authLoading:",
      authLoading
    );
    const fetchTeacherData = async () => {
      if (authLoading) {
        setLoadingData(true);
        return;
      }

      if (!user || user.role !== "PROFESSORA") {
        setDataError(
          "Você precisa estar logado como professor para ver este painel."
        );
        setLoadingData(false);
        return;
      }

      try {
        setLoadingData(true);
        const numTeacherId = Number(user.id);

        // Fetch students for the teacher
        const studentsResponse = await apiService.getStudentsByTeacherId(
          numTeacherId
        );
        const mappedStudents: StudentDetails[] = studentsResponse.data.map(
          (s) => ({
            id: Number(s.id),
            name: s.name,
            age: s.age !== null && s.age !== undefined ? Number(s.age) : 0,
            grade: s.grade ?? "",
            parentName: s.parentName, // Assumindo que isso vem da API
            parentContact: s.parentContact, // Assumindo que isso vem da API
            learningDifficulties: s.learningDifficulties,
            personalCondition: s.personalCondition,
            classType: s.classType, // Assumindo que o tipo de aula vem da API
          })
        );
        setTeacherStudents(mappedStudents);

        // Fetch schedules for the teacher
        const schedulesResponse = await apiService.getSchedulesByTeacherId(
          numTeacherId
        );
        console.log(
          "[TeacherDashboardPage] schedulesResponse",
          schedulesResponse.data
        );
        const mappedSchedules: ScheduledClass[] = schedulesResponse.data.map(
          (schedule) => {
            const startTime = parseISO(schedule.startTime);
            const endTime = parseISO(schedule.endTime);
            const duration =
              (endTime.getTime() - startTime.getTime()) / (1000 * 60); // Duration in minutes
            const student = mappedStudents.find(
              (s) => s.id === Number(schedule.studentId)
            );

            let classType: "presencial" | "online";
            switch (schedule.modality) {
              case "IN_PERSON":
                classType = "presencial";
                break;
              case "ONLINE":
                classType = "online";
                break;
              case "HYBRID":
                classType = "presencial";
                break;
              default:
                classType = "presencial";
            }

            return {
              id: String(schedule.id),
              studentId: Number(schedule.studentId),
              studentName:
                schedule.studentName || student?.name || "Aluno Desconhecido",
              age: student?.age || 0,
              grade: student?.grade || "N/A",
              date: format(startTime, "yyyy-MM-dd"),
              time: format(startTime, "HH:mm"),
              duration: duration,
              type: classType,
              parentName: student?.parentName || "",
              parentContact: student?.parentContact || "",
              subject: schedule.subject || "",
              description: schedule.description || "",
              difficulties: schedule.difficulties || "Nenhuma",
              condition: schedule.condition || "Nenhuma",
            };
          }
        );
        setTeacherSchedules(mappedSchedules);
      } catch (err) {
        const error = err as AxiosError<{ message: string }>;
        setDataError(
          error.response?.data?.message ||
            "Erro ao carregar dados do painel do professor."
        );
        console.error("Erro ao carregar dados do professor:", error);
      } finally {
        setLoadingData(false);
      }
    };
    fetchTeacherData();
  }, [user, authLoading]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const classesForSelectedDate = teacherSchedules.filter(
    (cls) => cls.date === format(selectedDate, "yyyy-MM-dd")
  );

  const getStudentDetails = (studentId: number) => {
    return teacherStudents.find((student) => student.id === studentId);
  };

  const handleViewStudent = (scheduleItem: ScheduledClass) => {
    const fullDetails = getStudentDetails(scheduleItem.studentId);
    const details: StudentDetails = {
      id: scheduleItem.studentId,
      name: scheduleItem.studentName,
      age: scheduleItem.age || fullDetails?.age || 0,
      grade: scheduleItem.grade || fullDetails?.grade || "N/A",
      parentName: scheduleItem.parentName || fullDetails?.parentName || "",
      parentContact:
        scheduleItem.parentContact || fullDetails?.parentContact || "",
      learningDifficulties:
        scheduleItem.difficulties ||
        fullDetails?.learningDifficulties ||
        "Não informado",
      personalCondition:
        scheduleItem.condition ||
        fullDetails?.personalCondition ||
        "Não informado",
      classType: scheduleItem.type === "online" ? "ONLINE" : "IN_PERSON",
    };
    setStudentDetailsModalData(details);
  };

  const handleOpenHistory = async (studentId: string, classId: string) => {
    try {
      const student = await studentService.getStudent(studentId);
      setCurrentGuardianId(student.guardianId);
      setHistoryStudentId(studentId);
      setHistoryClassId(classId);
      setShowHistoryModal(true);
      setHistoryText("");
    } catch (error) {
      console.error("Erro ao buscar dados do aluno:", error);
    }
  };

  const handleCloseHistory = () => {
    setShowHistoryModal(false);
    setHistoryStudentId(null);
    setHistoryClassId(null);
    setHistoryText("");
    setCurrentGuardianId(null);
  };

  const handleSaveHistory = async () => {
    if (!historyStudentId || !user) {
      return;
    }
    try {
      await apiService.saveStudentHistory({
        studentId: Number(historyStudentId),
        teacherId: Number(user.id),
        classId: historyClassId ? Number(historyClassId) : null,
        comment: historyText,
      });
      setShowSuccessModal(true);
      handleCloseHistory();
    } catch (error) {
      console.error("Erro ao salvar histórico:", error);
    }
  };

  const handlePreviousWeek = () => {
    setCurrentWeekStart((prev) => addDays(prev, -7));
  };

  const handleNextWeek = () => {
    setCurrentWeekStart((prev) => addDays(prev, 7));
  };

  // Agrupar agendamentos por horário
  const groupedSchedules = classesForSelectedDate.reduce((acc, current) => {
    const time = current.time;
    if (!acc[time]) {
      acc[time] = [];
    }
    acc[time].push(current);
    return acc;
  }, {} as { [time: string]: ScheduledClass[] });

  // Renderização condicional com LoadingSpinner
  if (loadingData || authLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingSpinner />
        <p className="ml-2 text-gray-500">Carregando dados do painel...</p>
      </div>
    );
  }

  if (dataError) {
    return (
      <div className="max-w-6xl mx-auto mt-8 text-center text-red-500">
        <p>Erro ao carregar dados: {dataError}</p>
        <p>
          Por favor, tente novamente mais tarde ou verifique seu status de
          login.
        </p>
      </div>
    );
  }

  const isHistoryDisabled = true;

  return (
    <div className="w-full min-h-screen flex flex-col px-2 sm:px-4 md:px-8 py-4 sm:py-8 bg-blue-50">
      <div className="w-full max-w-[1600px] mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1 text-left">
          Painel do Professor
        </h1>
        <p className="mt-1 text-gray-600 mb-4 sm:mb-8 text-left text-sm sm:text-base">
          Gerencie seus alunos e aulas
        </p>

        {/* Visão Geral da Agenda - Grid igual Agenda */}
        <div className="bg-white rounded-xl shadow p-4 sm:p-6 mb-4 sm:mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 flex items-center gap-2 text-left">
              <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" /> Visão
              Geral da Agenda
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePreviousWeek}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <ChevronLeft className="h-5 w-5 text-gray-600" />
              </button>
              <button
                onClick={handleNextWeek}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <ChevronRight className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2 sm:gap-4">
            {Array.from({ length: 7 }).map((_, i) => {
              const date = addDays(currentWeekStart, i);
              const dateStr = format(date, "yyyy-MM-dd");
              const dayClasses = teacherSchedules.filter(
                (cls) => cls.date === dateStr
              );
              const isSelected = isSameDay(date, selectedDate);

              // On mobile, only show current day and next 2 days
              if (isMobile && i > 2) return null;

              return (
                <div
                  key={i}
                  className={`flex flex-col items-center justify-center h-24 sm:h-32 md:h-40 rounded-lg border transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-blue-50 border-blue-400"
                      : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                  }`}
                  onClick={() => setSelectedDate(date)}
                >
                  <div className="text-xs sm:text-sm text-gray-500 mb-1">
                    {format(date, "EEE", { locale: ptBR })}
                  </div>
                  <div
                    className={`text-xl sm:text-2xl font-bold mb-1 ${
                      isSelected ? "text-blue-600" : "text-gray-800"
                    }`}
                  >
                    {format(date, "d")}
                  </div>
                  <div className="text-[10px] sm:text-xs text-center font-medium text-gray-600 px-1">
                    {dayClasses.length > 0 ? (
                      <span className="text-blue-600">
                        {dayClasses.length} aula
                        {dayClasses.length !== 1 ? "s" : ""}
                      </span>
                    ) : (
                      <span className="text-xs">Sem aulas</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Aulas do dia */}
        <div className="bg-white rounded-xl shadow p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2 text-left">
            <Book className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" /> Aulas para{" "}
            {format(selectedDate, "dd/MM/yyyy")}
          </h2>
          {classesForSelectedDate.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 sm:p-8 flex flex-col items-center">
              <Calendar className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mb-3" />
              <p className="text-gray-500 mb-4 text-sm sm:text-base text-center">
                Nenhuma aula agendada para este dia.
              </p>
              <Button
                variant="secondary"
                className="flex items-center gap-2 text-blue-600 border-blue-400 font-semibold text-sm sm:text-base"
              >
                <Plus size={18} />
                Adicionar Novo Aluno
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
              {Object.entries(groupedSchedules).map(([time, schedules]) => {
                const firstSchedule = schedules[0];
                const canAddHistory =
                  new Date(`${firstSchedule.date}T${firstSchedule.time}`) <
                  new Date();
                return (
                  <div
                    key={time}
                    className="bg-gray-50 border border-gray-200 rounded-lg shadow-sm p-3 sm:p-5 flex flex-col gap-2 sm:gap-3"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                      <span className="font-medium text-gray-800 text-base sm:text-lg">
                        {time}
                        <span className="text-[10px] sm:text-xs text-gray-500 ml-1">
                          ({firstSchedule.duration} min)
                        </span>
                      </span>
                      <span
                        className={`ml-1 sm:ml-2 px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold ${
                          firstSchedule.type === "online"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {firstSchedule.type === "online"
                          ? "Online"
                          : "Presencial"}
                      </span>
                    </div>
                    {schedules.map((scheduleItem) => (
                      <div
                        key={scheduleItem.id}
                        className="flex justify-between items-center"
                      >
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <User className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
                          <span className="text-gray-800 font-medium text-sm sm:text-base">
                            {scheduleItem.studentName}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2">
                          <button
                            className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                            title="Ver detalhes do aluno"
                            onClick={() => handleViewStudent(scheduleItem)}
                          >
                            <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
                          </button>
                          <Tooltip
                            content="Este botão ficará disponível após a aula."
                            placement="top"
                            disabled={canAddHistory}
                          >
                            <span className="inline-block">
                              <Button
                                variant="secondary"
                                className="p-1"
                                onClick={() =>
                                  handleOpenHistory(
                                    scheduleItem.studentId.toString(),
                                    scheduleItem.id
                                  )
                                }
                                disabled={!canAddHistory}
                                data-title={
                                  canAddHistory
                                    ? "Adicionar histórico"
                                    : "Só é possível adicionar histórico após a aula"
                                }
                              >
                                <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />
                              </Button>
                            </span>
                          </Tooltip>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Student Details Modal */}
      {studentDetailsModalData && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg sm:text-xl font-bold mb-4">
              Detalhes do Aluno
            </h2>
            <div className="mt-4 border-t border-gray-200 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-xs sm:text-sm font-medium text-gray-500">
                    Nome
                  </h4>
                  <p className="mt-1 text-sm sm:text-base text-gray-900">
                    {studentDetailsModalData.name}
                  </p>
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-medium text-gray-500">
                    Idade
                  </h4>
                  <p className="mt-1 text-sm sm:text-base text-gray-900">
                    {typeof studentDetailsModalData.age === "number" &&
                    studentDetailsModalData.age > 0
                      ? `${studentDetailsModalData.age} anos`
                      : "Não informada"}
                  </p>
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-medium text-gray-500">
                    Série
                  </h4>
                  <p className="mt-1 text-sm sm:text-base text-gray-900">
                    {studentDetailsModalData.grade
                      ? studentDetailsModalData.grade
                      : "Não informada"}
                  </p>
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-medium text-gray-500">
                    Tipo de Aula
                  </h4>
                  <p className="mt-1 text-sm sm:text-base text-gray-900">
                    {studentDetailsModalData.classType === "ONLINE"
                      ? "Online"
                      : "Presencial"}
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <h4 className="text-xs sm:text-sm font-medium text-gray-500">
                  Dificuldades de Aprendizagem
                </h4>
                <p className="mt-1 text-sm sm:text-base text-gray-900">
                  {studentDetailsModalData.learningDifficulties ||
                    "Nenhuma informada"}
                </p>
              </div>
              <div className="mt-4">
                <h4 className="text-xs sm:text-sm font-medium text-gray-500">
                  Condição Pessoal
                </h4>
                <p className="mt-1 text-sm sm:text-base text-gray-900">
                  {studentDetailsModalData.personalCondition ||
                    "Nenhuma informada"}
                </p>
              </div>
              <div className="mt-4 border-t border-gray-200 pt-4">
                <h4 className="text-xs sm:text-sm font-medium text-gray-500">
                  Informações dos Responsáveis
                </h4>
                <p className="mt-1 text-sm sm:text-base text-gray-900">
                  {studentDetailsModalData.parentName || "Não informado"}
                </p>
                <div className="mt-2 flex flex-wrap gap-2 sm:gap-4">
                  <a
                    href={`tel:${studentDetailsModalData.parentContact}`}
                    className="inline-flex items-center text-xs sm:text-sm text-indigo-600 hover:text-indigo-800"
                  >
                    <Phone className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    Ligar
                  </a>
                  <a
                    href="#"
                    className="inline-flex items-center text-xs sm:text-sm text-indigo-600 hover:text-indigo-800"
                    onClick={() =>
                      alert("Mensagem do WhatsApp será enviada aqui")
                    }
                  >
                    <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    WhatsApp
                  </a>
                  <a
                    href={`mailto:${studentDetailsModalData.parentContact}`}
                    className="inline-flex items-center text-xs sm:text-sm text-indigo-600 hover:text-indigo-800"
                  >
                    <Mail className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    E-mail
                  </a>
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <Button
                variant="secondary"
                onClick={() => setStudentDetailsModalData(null)}
                className="text-sm"
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-lg w-full">
            <h2 className="text-lg sm:text-xl font-bold mb-4">
              Adicionar histórico do aluno
            </h2>
            <div className="mb-4">
              <Textarea
                label="Comentário sobre a aula"
                id="history-text"
                name="history-text"
                value={historyText}
                onChange={(e) => setHistoryText(e.target.value)}
                placeholder="Digite suas observações sobre a aula..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={handleCloseHistory}
                className="text-sm"
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleSaveHistory}
                disabled={!historyText.trim()}
                className="text-sm"
              >
                Enviar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <SuccessModal
          isOpen={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          message="Histórico salvo com sucesso!"
        />
      )}
    </div>
  );
};

export default TeacherDashboardPage;
