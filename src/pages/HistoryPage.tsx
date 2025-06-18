import React, { useState, useEffect } from "react";
import Card, { CardHeader, CardBody } from "../components/Card";
import Select from "../components/Select";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { apiService, ScheduleDTO } from "../services/api";
import authService from "../services/authService";
import logoEspacoConstruir from "../images/espaco-construir-logo.jpeg";

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
  const [selectedChild, setSelectedChild] = useState<string>("all");
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
      setLoadingHistory(true);
      setHistoryError(null);
      try {
        if (selectedChild !== "all") {
          const res = await apiService.getStudentHistory(selectedChild);
          setHistoryRecords(res.data);
          console.log("Buscando histórico para:", selectedChild, res.data);
        } else {
          const allHistory: HistoryRecord[] = [];
          for (const child of children) {
            const res = await apiService.getStudentHistory(child.id);
            allHistory.push(...res.data);
            console.log("Buscando histórico para:", child.id, res.data);
          }
          setHistoryRecords(allHistory);
          console.log("Todos os históricos:", allHistory);
        }
      } catch (err) {
        setHistoryError("Não foi possível carregar o histórico de aulas.");
      } finally {
        setLoadingHistory(false);
      }
    };
    if (children.length > 0) {
      fetchHistory();
    } else {
      setHistoryRecords([]);
      setLoadingHistory(false);
    }
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
      <p className="text-center text-gray-500 mt-8">Carregando dados...</p>
    );
  }

  if (childrenError || historyError) {
    return (
      <p className="text-center text-red-500 mt-8">
        Erro ao carregar dados: {childrenError || historyError}
      </p>
    );
  }

  return (
    <div className="max-w-6xl mx-auto mt-12">
      <div className="w-full">
        <h1 className="text-2xl font-bold text-gray-800">Histórico de Aulas</h1>
        <p className="mt-1 text-gray-600 mb-6">
          Aqui você pode visualizar o histórico de aulas e anotações dos
          professores referentes aos seus filhos cadastrados.
        </p>
        <div className="flex justify-end mb-6">
          <Select
            label="Filtrar por filho"
            id="child-filter"
            name="child-filter"
            options={childOptions}
            value={selectedChild}
            onChange={(e) => setSelectedChild(e.target.value)}
            className="mb-0 w-full sm:w-64"
          />
        </div>
        {uniqueHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] py-12">
            <img
              src={logoEspacoConstruir}
              alt="Logo Espaço Construir"
              style={{ width: 80, marginBottom: 16, borderRadius: 10 }}
            />
            <h2 className="text-lg font-bold mb-1">
              Nenhum histórico encontrado
            </h2>
            {selectedChild === "all" ? (
              <p className="text-gray-500 max-w-md text-sm text-center">
                Nenhum histórico foi registrado ainda para o(s) seu(s) filho(s)
                selecionado(s).
                <br />
                Assim que houver registros, eles aparecerão aqui!
              </p>
            ) : (
              <p className="text-gray-500 max-w-md text-sm text-center">
                O aluno{" "}
                <b>
                  {children.find((c) => String(c.id) === String(selectedChild))
                    ?.name || ""}
                </b>{" "}
                ainda não possui histórico registrado.
              </p>
            )}
          </div>
        ) : (
          <Card>
            <CardBody>
              <div className="space-y-8">
                {uniqueHistory.map((record) => {
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
                      className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-200"
                    >
                      <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 flex justify-between items-center">
                        <div className="flex items-center">
                          <span className="ml-2 font-medium text-gray-800">
                            {childName}
                          </span>
                          <span className="mx-2 text-gray-400">•</span>
                          <span className="text-gray-600">
                            {new Date(record.createdAt).toLocaleString("pt-BR")}
                          </span>
                        </div>
                      </div>
                      <div className="px-4 py-3">
                        <p className="text-gray-800 whitespace-pre-line">
                          {record.comment}
                        </p>
                        <p className="mt-2 text-sm text-gray-500">
                          <span className="font-medium">Professor(a):</span>{" "}
                          {teacherName}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;
