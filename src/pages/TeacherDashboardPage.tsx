import React, { useState, useEffect } from "react";
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
  Edit,
  MessageSquare,
  Book,
  Plus,
  MoreHorizontal,
} from "lucide-react";
import { apiService } from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";
import { AxiosError } from "axios";
import { useAuth } from "../contexts/AuthContext";
import Textarea from "../components/Textarea";
import SuccessModal from "../components/SuccessModal";

// Interface para as classes agendadas no frontend
interface ScheduledClass {
  id: string;
  studentId: string; // ID do aluno (string)
  studentName: string;
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

// Interface para os detalhes do aluno (TeacherStudent do backend)
interface StudentDetails {
  id: string;
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
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
    null
  );

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

  const [showActionsMenu, setShowActionsMenu] = useState<string | null>(null);

  const [showSuccessModal, setShowSuccessModal] = useState(false);

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
            id: String(s.id),
            name: s.name,
            age: s.age,
            grade: s.grade,
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
              (s) => s.id === String(schedule.studentId)
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
              studentId: String(schedule.studentId),
              studentName:
                schedule.studentName || student?.name || "Aluno Desconhecido",
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

  const classesForSelectedDate = teacherSchedules.filter(
    (cls) => cls.date === format(selectedDate, "yyyy-MM-dd")
  );

  const getStudentDetails = (studentId: string) => {
    return teacherStudents.find((student) => student.id === studentId);
  };

  const handleViewStudent = (studentId: string) => {
    setSelectedStudentId(studentId);
    setShowStudentModal(true);
  };

  const handleOpenHistory = (studentId: string, classId: string) => {
    setHistoryStudentId(studentId);
    setHistoryClassId(classId);
    setShowHistoryModal(true);
    setHistoryText("");
  };

  const handleCloseHistory = () => {
    setShowHistoryModal(false);
    setHistoryStudentId(null);
    setHistoryClassId(null);
    setHistoryText("");
  };

  const handleSaveHistory = async () => {
    try {
      await apiService.addStudentHistory({
        studentId: historyStudentId,
        classId: historyClassId,
        teacherId: user.id,
        comment: historyText,
      });
      setShowSuccessModal(true);
      setShowHistoryModal(false);
      setHistoryStudentId(null);
      setHistoryClassId(null);
      setHistoryText("");
      setTimeout(() => setShowSuccessModal(false), 2000);
    } catch (err) {
      // (Opcional) Exibir erro
    }
  };

  const renderWeekCalendar = () => {
    const days = [];

    for (let i = 0; i < 7; i++) {
      const date = addDays(startDate, i);
      const dateStr = format(date, "yyyy-MM-dd");
      const dayClasses = teacherSchedules.filter((cls) => cls.date === dateStr);
      const isSelected = isSameDay(date, selectedDate);

      days.push(
        <div
          key={i}
          className={`flex-1 min-w-[130px] h-28 border rounded-lg p-2 cursor-pointer hover:bg-indigo-50 transition-colors ${
            isSelected
              ? "bg-indigo-100 border-indigo-300"
              : "bg-white border-gray-200"
          }`}
          onClick={() => setSelectedDate(date)}
        >
          <div className="text-center mb-2">
            <div className="text-xs text-gray-500">
              {format(date, "EEE", { locale: ptBR })}
            </div>
            <div
              className={`text-lg font-bold ${
                isSelected ? "text-indigo-600" : "text-gray-800"
              }`}
            >
              {format(date, "d")}
            </div>
          </div>

          <div>
            {dayClasses.length > 0 ? (
              <div className="text-xs text-center font-medium text-indigo-600">
                {dayClasses.length} aula{dayClasses.length !== 1 ? "s" : ""}
              </div>
            ) : (
              <div className="text-xs text-center text-gray-400">
                Nenhuma aula agendada para este dia.
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col sm:flex-row space-y-2 sm:space-x-2 sm:space-y-0 overflow-x-auto pb-2">
        {days}
      </div>
    );
  };

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

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <h1 className="text-2xl font-bold text-gray-800">
            Painel do Professor
          </h1>
          <p className="mt-1 text-gray-600">Gerencie seus alunos e aulas</p>
        </CardHeader>
        <CardBody>
          <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-500" />
            Visão Geral da Agenda
          </h2>
          {renderWeekCalendar()}
          <div className="mt-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Book className="h-5 w-5 text-blue-500" />
              Aulas para {format(selectedDate, "dd/MM/yyyy")}
            </h2>
            {classesForSelectedDate.length === 0 ? (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">
                  Nenhuma aula agendada para este dia.
                </p>
                <Button
                  variant="outline"
                  className="mt-3 flex items-center gap-2 justify-center"
                >
                  <Plus className="h-4 w-4 text-blue-500" />
                  Adicionar Aula
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {classesForSelectedDate.map((scheduledClassItem) => {
                  const studentDetails = getStudentDetails(
                    scheduledClassItem.studentId
                  );

                  const classTypeString = scheduledClassItem.type as
                    | "online"
                    | "presencial";

                  const typeColorClass =
                    classTypeString === "online"
                      ? "bg-blue-200 text-blue-900"
                      : "bg-green-200 text-green-900";

                  // Calcule se a aula já passou
                  const classDateTime = new Date(
                    `${scheduledClassItem.date}T${scheduledClassItem.time}`
                  );
                  const now = new Date();
                  const canAddHistory = classDateTime < now;

                  return (
                    <div
                      key={scheduledClassItem.id}
                      className={`bg-white border border-blue-100 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer w-full sm:w-auto ${
                        selectedClass === scheduledClassItem.id
                          ? "ring-2 ring-[var(--accent)]"
                          : ""
                      }`}
                      onClick={() =>
                        setSelectedClass(
                          scheduledClassItem.id === selectedClass
                            ? null
                            : scheduledClassItem.id
                        )
                      }
                    >
                      <div className="border-b border-blue-100 bg-blue-50 px-2 py-2 sm:px-4 sm:py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center w-full">
                          <div className="flex items-center mb-1 sm:mb-0">
                            <User className="h-5 w-5 text-blue-500 mr-2" />
                            <span className="font-medium text-gray-800 text-base sm:text-lg break-words max-w-[120px] sm:max-w-none">
                              {scheduledClassItem.studentName}
                            </span>
                            <span className="mx-2 text-gray-400 hidden sm:inline">
                              •
                            </span>
                          </div>
                          <div className="flex items-center text-sm sm:text-base">
                            <Clock className="h-4 w-4 text-blue-500 mr-1" />
                            <span className="text-gray-600">
                              {scheduledClassItem.time} (
                              {scheduledClassItem.duration} min)
                            </span>
                            <span className="mx-2 text-gray-400 hidden sm:inline">
                              •
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs ${typeColorClass}`}
                            >
                              {classTypeString === "online"
                                ? "Online"
                                : "Presencial"}
                            </span>
                          </div>
                        </div>
                        {/* Ações: menu no mobile, ícones no desktop */}
                        <div className="flex sm:hidden">
                          <button
                            className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                            title="Ações"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowActionsMenu(
                                showActionsMenu === scheduledClassItem.id
                                  ? null
                                  : scheduledClassItem.id
                              );
                            }}
                          >
                            <MoreHorizontal className="h-5 w-5 text-gray-500" />
                          </button>
                          {showActionsMenu === scheduledClassItem.id && (
                            <div className="absolute z-30 mt-8 right-4 bg-white border rounded shadow-lg flex flex-col min-w-[160px]">
                              <button
                                className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 text-left"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewStudent(
                                    scheduledClassItem.studentId
                                  );
                                  setShowActionsMenu(null);
                                }}
                              >
                                <FileText className="h-4 w-4 text-gray-500" />{" "}
                                Ver detalhes
                              </button>
                              <button
                                className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 text-left"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowActionsMenu(null);
                                }}
                              >
                                <Edit className="h-4 w-4 text-gray-500" />{" "}
                                Editar aula
                              </button>
                              <button
                                className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 text-left"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowActionsMenu(null);
                                }}
                              >
                                <MessageSquare className="h-4 w-4 text-gray-500" />{" "}
                                Enviar mensagem
                              </button>
                              <button
                                className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 text-left"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenHistory(
                                    scheduledClassItem.studentId,
                                    scheduledClassItem.id
                                  );
                                  setShowActionsMenu(null);
                                }}
                                disabled={!canAddHistory}
                                title={
                                  canAddHistory
                                    ? "Adicionar histórico do aluno"
                                    : "Só é possível adicionar histórico após a aula"
                                }
                              >
                                <Book className="h-4 w-4 text-gray-500" />{" "}
                                Adicionar histórico
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="hidden sm:flex space-x-2">
                          <button
                            className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                            title="Ver detalhes do aluno"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewStudent(scheduledClassItem.studentId);
                            }}
                          >
                            <FileText className="h-5 w-5 text-gray-500" />
                          </button>
                          <button
                            className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                            title="Editar aula"
                          >
                            <Edit className="h-5 w-5 text-gray-500" />
                          </button>
                          <button
                            className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                            title="Enviar mensagem"
                          >
                            <MessageSquare className="h-5 w-5 text-gray-500" />
                          </button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenHistory(
                                scheduledClassItem.studentId,
                                scheduledClassItem.id
                              );
                            }}
                            disabled={!canAddHistory}
                            title={
                              canAddHistory
                                ? "Adicionar histórico do aluno"
                                : "Só é possível adicionar histórico após a aula"
                            }
                          >
                            Adicionar histórico do aluno
                          </Button>
                        </div>
                      </div>
                      {selectedClass === scheduledClassItem.id &&
                        studentDetails && (
                          <div className="px-4 py-3 border-t border-blue-100 bg-blue-50">
                            <h3 className="text-sm font-semibold text-gray-800 mb-2">
                              Detalhes da Aula e do Aluno
                            </h3>
                            <p className="text-sm text-gray-700">
                              <span className="font-medium">
                                Idade do Aluno:
                              </span>{" "}
                              {studentDetails.age} anos
                            </p>
                            <p className="text-sm text-gray-700">
                              <span className="font-medium">Série:</span>{" "}
                              {studentDetails.grade}
                            </p>
                            <p className="text-sm text-gray-700">
                              <span className="font-medium">
                                Dificuldades de Aprendizagem:
                              </span>{" "}
                              {scheduledClassItem.difficulties || "Nenhuma"}
                            </p>
                            <p className="text-sm text-gray-700">
                              <span className="font-medium">
                                Condição Pessoal:
                              </span>{" "}
                              {scheduledClassItem.condition || "Nenhuma"}
                            </p>
                          </div>
                        )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </CardBody>
      </Card>
      {/* Student Details Modal */}
      {showStudentModal && selectedStudentId && (
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
              {(() => {
                const student = getStudentDetails(selectedStudentId);
                if (!student) return null;
                return (
                  <>
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                      <div className="sm:flex sm:items-start">
                        <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                          <h3
                            className="text-lg leading-6 font-medium text-gray-900"
                            id="modal-title"
                          >
                            Detalhes do Aluno
                          </h3>
                          <div className="mt-4 border-t border-gray-200 pt-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <h4 className="text-sm font-medium text-gray-500">
                                  Nome
                                </h4>
                                <p className="mt-1 text-gray-900">
                                  {student.name}
                                </p>
                              </div>
                              <div>
                                <h4 className="text-sm font-medium text-gray-500">
                                  Idade
                                </h4>
                                <p className="mt-1 text-gray-900">
                                  {student.age} anos
                                </p>
                              </div>
                              <div>
                                <h4 className="text-sm font-medium text-gray-500">
                                  Série
                                </h4>
                                <p className="mt-1 text-gray-900">
                                  {student.grade}
                                </p>
                              </div>
                              <div>
                                <h4 className="text-sm font-medium text-gray-500">
                                  Tipo de Aula
                                </h4>
                                <p className="mt-1 text-gray-900">
                                  {student.classType === "ONLINE"
                                    ? "ONLINE"
                                    : "IN_PERSON"}
                                </p>
                              </div>
                            </div>
                            <div className="mt-4">
                              <h4 className="text-sm font-medium text-gray-500">
                                Dificuldades de Aprendizagem
                              </h4>
                              <p className="mt-1 text-gray-900">
                                {student.learningDifficulties ||
                                  "Nenhuma informada"}
                              </p>
                            </div>
                            <div className="mt-4">
                              <h4 className="text-sm font-medium text-gray-500">
                                Condição Pessoal
                              </h4>
                              <p className="mt-1 text-gray-900">
                                {student.personalCondition ||
                                  "Nenhuma informada"}
                              </p>
                            </div>
                            <div className="mt-4 border-t border-gray-200 pt-4">
                              <h4 className="text-sm font-medium text-gray-500">
                                Informações dos Responsáveis
                              </h4>
                              <p className="mt-1 text-gray-900">
                                {student.parentName}
                              </p>
                              <div className="mt-2 flex space-x-4">
                                <a
                                  href={`tel:${student.parentContact}`}
                                  className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800"
                                >
                                  <Phone className="h-4 w-4 mr-1" />
                                  Ligar
                                </a>
                                <a
                                  href="#"
                                  className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800"
                                  onClick={() =>
                                    alert(
                                      "Mensagem do WhatsApp será enviada aqui"
                                    )
                                  }
                                >
                                  <MessageSquare className="h-4 w-4 mr-1" />
                                  WhatsApp
                                </a>
                                <a
                                  href={`mailto:parent@example.com`}
                                  className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800"
                                >
                                  <Mail className="h-4 w-4 mr-1" />
                                  E-mail
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                      <Button
                        onClick={() => setShowStudentModal(false)}
                        className="w-full sm:w-auto sm:ml-3"
                      >
                        Fechar
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() =>
                          alert(
                            "Funcionalidade de edição será implementada aqui"
                          )
                        }
                        className="mt-3 w-full sm:mt-0 sm:w-auto sm:mr-3"
                      >
                        Editar Aluno
                      </Button>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}
      {showHistoryModal && historyStudentId && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">
              Adicionar histórico do aluno
            </h2>
            <Textarea
              label="Comentário sobre a aula"
              id="history-text"
              name="history-text"
              value={historyText}
              onChange={(e) => setHistoryText(e.target.value)}
              placeholder="Descreva como foi a aula, observações, evolução, etc..."
              rows={5}
            />
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={handleCloseHistory}>
                Cancelar
              </Button>
              <Button onClick={handleSaveHistory}>Salvar</Button>
            </div>
          </div>
        </div>
      )}
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
