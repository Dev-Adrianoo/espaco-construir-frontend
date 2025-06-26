import React, { useState, useEffect } from "react";
import Card, { CardHeader, CardBody } from "../components/Card";
import Select from "../components/Select";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { apiService, ScheduleDTO } from "../services/api";
import authService from "../services/authService";
import logoEspacoConstruir from "../images/espaco-construir-logo.jpeg";
import LoadingSpinner from "../components/LoadingSpinner";

interface Child {
  id: number;
  name: string;
}

interface Lesson {
  id: string;
  childId: number;
  date: string;
  time: string;
  status: "attended" | "absent" | "late" | "scheduled" | "in_progress";
  teacherNotes: string;
  teacherName: string;
  subject: string;
}

interface HistoryRecord {
  id: number | string;
  studentId: number | string;
  teacherId: number | string;
  classId: number | string | null;
  comment: string;
  createdAt: string;
}

const HistoryPage: React.FC = () => {
  const [selectedChild, setSelectedChild] = useState<string>("");
  const [children, setChildren] = useState<Child[]>([]);
  const [loadingChildren, setLoadingChildren] = useState<boolean>(true);
  const [childrenError, setChildrenError] = useState<string | null>(null);

  const [allLessons, setAllLessons] = useState<Lesson[]>([]);
  const [loadingLessons, setLoadingLessons] = useState<boolean>(true);
  const [lessonsError, setLessonsError] = useState<string | null>(null);

  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(true);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const [teachers, setTeachers] = useState<
    { id: number | string; name: string }[]
  >([]);

  useEffect(() => {
    // Carregar filhos do responsável ao montar
    const fetchChildren = async () => {
      const userId = authService.getUserId();
      console.log("userId do responsável:", userId);
      if (!userId) {
        setChildren([]);
        return;
      }
      try {
        const childrenResponse = await apiService.getChildrenByResponsible(
          Number(userId)
        );
        setChildren(childrenResponse.data);
        console.log("Filhos carregados:", childrenResponse.data);
      } catch (err) {
        setChildren([]);
        console.log("Erro ao buscar filhos:", err);
      }
    };
    fetchChildren();
  }, []);

  useEffect(() => {
    const fetchRequiredData = async () => {
      const userId = authService.getUserId();
      const userType = authService.getUserType();

      if (!userId || userType !== "responsible") {
        setLoadingChildren(false);
        setLoadingLessons(false);
        return;
      }

      // Fetch all lessons (schedules) for each child
      if (children.length > 0) {
        try {
          setLoadingLessons(true);
          const allSchedules: ScheduleDTO[] = [];
          for (const child of children) {
            const schedulesResponse = await apiService.getSchedulesByStudentId(
              child.id
            );
            allSchedules.push(...schedulesResponse.data);
          }

          // Map ScheduleDTO to Lesson interface
          const mappedLessons: Lesson[] = allSchedules.map((schedule) => {
            const startTime = new Date(schedule.startTime);
            const date = startTime.toISOString().split("T")[0]; // YYYY-MM-DD
            const time = startTime.toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            });

            let status: Lesson["status"];
            switch (schedule.status) {
              case "COMPLETED":
                status = "attended";
                break;
              case "CANCELLED":
                status = "absent";
                break;
              case "SCHEDULED":
                status = "scheduled";
                break;
              case "IN_PROGRESS":
                status = "in_progress";
                break;
              default:
                status = "scheduled"; // Default para um status conhecido
            }

            return {
              id: String(schedule.id),
              childId: schedule.studentId,
              date: date,
              time: time,
              status: status,
              teacherNotes: schedule.description || "", // Usa description para teacherNotes
              teacherName: "Professor Desconhecido", // Placeholder, pois não está no ScheduleDTO
              subject: schedule.subject || "",
            };
          });
          setAllLessons(mappedLessons);
        } catch (err) {
          console.error("Erro ao buscar histórico de aulas:", err);
          setLessonsError("Não foi possível carregar o histórico de aulas.");
        } finally {
          setLoadingLessons(false);
        }
      } else {
        setLoadingLessons(false);
        setAllLessons([]); // Não há filhos, então não há lições
      }
    };
    fetchRequiredData();
  }, [children]);

  useEffect(() => {
    console.log("children:", children);
    console.log("selectedChild:", selectedChild);
  }, [children, selectedChild]);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!children.length) {
        setHistoryRecords([]);
        setLoadingHistory(false);
        return;
      }

      setLoadingHistory(true);
      setHistoryError(null);

      try {
        if (selectedChild) {
          console.log("Buscando histórico para aluno específico:", selectedChild);
          const res = await apiService.getStudentHistory(selectedChild);
          setHistoryRecords(res.data);
          console.log("Histórico recebido:", res.data);
        } else {
          console.log("Buscando histórico para todos os alunos");
          const allHistory: HistoryRecord[] = [];
          for (const child of children) {
            try {
            const res = await apiService.getStudentHistory(child.id);
            allHistory.push(...res.data);
              console.log("Histórico recebido para", child.name, ":", res.data);
            } catch (childError) {
              console.error("Erro ao buscar histórico do aluno", child.name, ":", childError);
              // Continua buscando os outros históricos mesmo se um falhar
            }
          }
          setHistoryRecords(allHistory);
          console.log("Todos os históricos:", allHistory);
        }
      } catch (err: any) {
        console.error("Erro ao carregar histórico:", err);
        setHistoryError(
          err.response?.data?.message || 
          "Erro ao carregar histórico. Por favor, tente novamente mais tarde."
        );
      } finally {
        setLoadingHistory(false);
      }
    };

      fetchHistory();
  }, [selectedChild, children]);

  useEffect(() => {
    // Carregar professores ao montar
    const fetchTeachers = async () => {
      try {
        const res = await apiService.getTeachers();
        setTeachers(res.data);
      } catch (err) {
        setTeachers([]);
      }
    };
    fetchTeachers();
  }, []);

  const filteredHistory = historyRecords.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return new Date(dateString).toLocaleDateString("pt-BR", options);
  };

  const getStatusIcon = (status: Lesson["status"]) => {
    switch (status) {
      case "attended":
        return <CheckCircle className="h-5 w-5 text-secondary-500" />;
      case "absent":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "late":
        return <AlertCircle className="h-5 w-5 text-primary-500" />;
      case "scheduled":
        return <CheckCircle className="h-5 w-5 text-blue-500" />;
      case "in_progress":
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      default:
        return null;
    }
  };

  const getStatusDisplay = (status: Lesson["status"]) => {
    switch (status) {
      case "attended":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-success/10 text-green-700 border border-success">
            Presente
          </span>
        );
      case "absent":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-danger/10 text-danger border border-danger">
            Ausente
          </span>
        );
      case "late":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-warning/10 text-warning border border-warning">
            Atrasado
          </span>
        );
      case "scheduled":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-500">
            Agendado
          </span>
        );
      case "in_progress":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 border border-orange-500">
            Em Progresso
          </span>
        );
      default:
        return null;
    }
  };

  const childOptions = [
    { value: "all", label: "Todos os Alunos" },
    ...children.map((child) => ({
      value: String(child.id),
      label: child.name,
    })),
  ];

  // Remover duplicatas do histórico
  const uniqueHistory = Array.from(
    new Map(filteredHistory.map((item) => [item.id, item])).values()
  );

  if (loadingChildren || loadingHistory) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Histórico de Aulas</h1>
          
          <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-6">
            <p className="text-gray-600 mb-6">
              Aqui você pode visualizar o histórico de aulas e anotações dos professores referentes aos seus filhos cadastrados.
            </p>

            <div className="space-y-4">
              <div>
                <label htmlFor="filterChild" className="block text-sm font-medium text-gray-700 mb-2">
                  Filtrar por filho
                </label>
                <select
                  id="filterChild"
                  value={selectedChild}
                  onChange={(e) => setSelectedChild(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Todos os Alunos</option>
                  {children.map(child => (
                    <option key={child.id} value={child.id}>
                      {child.name}
                    </option>
                  ))}
                </select>
              </div>

              {loadingHistory ? (
                <div className="flex justify-center items-center py-12">
                  <LoadingSpinner />
                </div>
              ) : historyError ? (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <p className="text-red-600">{historyError}</p>
                </div>
              ) : historyRecords.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-24 h-24 mx-auto mb-4">
                    <img
                      src={logoEspacoConstruir}
                      alt="Espaço Construir"
                      className="w-full h-full object-contain rounded-full"
                    />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Nenhum histórico encontrado
                  </h3>
                  <p className="text-gray-500 mb-2">
                    Nenhum histórico foi registrado ainda para o(s) seu(s) filho(s) selecionado(s).
                  </p>
                  <p className="text-gray-500">
                    Assim que houver registros, eles aparecerão aqui!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredHistory.map((record) => {
                    const childName =
                      children.find(
                        (c) => String(c.id) === String(record.studentId)
                      )?.name || "";
                    const teacherName =
                      teachers.find(
                        (t) => String(t.id) === String(record.teacherId)
                      )?.name || "Professor(a)";
                    return (
                      <div
                        key={record.id}
                        className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3">
                          <div className="mb-2 sm:mb-0">
                            <h3 className="text-lg font-medium text-gray-900">
                              {childName}
                            </h3>
                            <p className="text-sm text-gray-500">
                              Professor(a): {teacherName}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span>{formatDate(record.createdAt)}</span>
                            <span>•</span>
                            <span>{record.comment}</span>
                          </div>
                        </div>
                        
                        <div className="bg-white rounded p-3 border border-gray-100">
                          <h4 className="font-medium text-gray-700 mb-2">Anotações:</h4>
                          <p className="text-gray-600 whitespace-pre-wrap">
                            {record.comment}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Histórico de Aulas</h1>
        
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <p className="text-gray-600 mb-6">
            Aqui você pode visualizar o histórico de aulas e anotações dos professores referentes aos seus filhos cadastrados.
          </p>

          <div className="space-y-4">
            <div>
              <label htmlFor="filterChild" className="block text-sm font-medium text-gray-700 mb-2">
                Filtrar por filho
              </label>
              <select
                id="filterChild"
                value={selectedChild}
                onChange={(e) => setSelectedChild(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos os Alunos</option>
                {children.map(child => (
                  <option key={child.id} value={child.id}>
                    {child.name}
                  </option>
                ))}
              </select>
            </div>

            {loadingHistory ? (
              <div className="flex justify-center items-center py-12">
                <LoadingSpinner />
              </div>
            ) : historyError ? (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-red-600">{historyError}</p>
              </div>
            ) : historyRecords.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 mx-auto mb-4">
                  <img
                    src={logoEspacoConstruir}
                    alt="Espaço Construir"
                    className="w-full h-full object-contain rounded-full"
                  />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhum histórico encontrado
                </h3>
                <p className="text-gray-500 mb-2">
                  Nenhum histórico foi registrado ainda para o(s) seu(s) filho(s) selecionado(s).
                </p>
                <p className="text-gray-500">
                  Assim que houver registros, eles aparecerão aqui!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredHistory.map((record) => {
                  const childName =
                    children.find(
                      (c) => String(c.id) === String(record.studentId)
                    )?.name || "";
                  const teacherName =
                    teachers.find(
                      (t) => String(t.id) === String(record.teacherId)
                    )?.name || "Professor(a)";
                  return (
                    <div
                      key={record.id}
                      className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3">
                        <div className="mb-2 sm:mb-0">
                          <h3 className="text-lg font-medium text-gray-900">
                            {childName}
                          </h3>
                          <p className="text-sm text-gray-500">
                            Professor(a): {teacherName}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span>{formatDate(record.createdAt)}</span>
                          <span>•</span>
                          <span>{record.comment}</span>
                        </div>
                      </div>
                      
                      <div className="bg-white rounded p-3 border border-gray-100">
                        <h4 className="font-medium text-gray-700 mb-2">Anotações:</h4>
                        <p className="text-gray-600 whitespace-pre-wrap">
                          {record.comment}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoryPage;
