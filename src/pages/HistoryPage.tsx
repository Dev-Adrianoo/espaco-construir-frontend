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

const HistoryPage: React.FC = () => {
  const [selectedChild, setSelectedChild] = useState<string>("all");
  const [children, setChildren] = useState<Child[]>([]);
  const [loadingChildren, setLoadingChildren] = useState<boolean>(true);
  const [childrenError, setChildrenError] = useState<string | null>(null);

  const [allLessons, setAllLessons] = useState<Lesson[]>([]);
  const [loadingLessons, setLoadingLessons] = useState<boolean>(true);
  const [lessonsError, setLessonsError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRequiredData = async () => {
      const userId = authService.getUserId();
      const userType = authService.getUserType();

      if (!userId || userType !== "responsible") {
        setLoadingChildren(false);
        setLoadingLessons(false);
        return;
      }

      // Fetch children
      let fetchedChildren: Child[] = [];
      try {
        setLoadingChildren(true);
        const childrenResponse = await apiService.getChildrenByResponsible(
          Number(userId)
        );
        fetchedChildren = childrenResponse.data;
        setChildren(fetchedChildren);
      } catch (err) {
        console.error("Erro ao buscar filhos:", err);
        setChildrenError("Não foi possível carregar os filhos.");
      } finally {
        setLoadingChildren(false);
      }

      // Fetch all lessons (schedules) for each child
      if (fetchedChildren.length > 0) {
        try {
          setLoadingLessons(true);
          const allSchedules: ScheduleDTO[] = [];
          for (const child of fetchedChildren) {
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
  }, []);

  const filteredLessons = allLessons.filter((lesson) => {
    const isResponsibleChild = children.some(
      (child) => child.id === lesson.childId
    );
    if (!isResponsibleChild) {
      return false;
    }

    if (selectedChild === "all") {
      return true;
    }
    return String(lesson.childId) === selectedChild;
  });

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

  if (loadingChildren || loadingLessons) {
    return (
      <p className="text-center text-gray-500 mt-8">Carregando dados...</p>
    );
  }

  if (childrenError || lessonsError) {
    return (
      <p className="text-center text-red-500 mt-8">
        Erro ao carregar dados: {childrenError || lessonsError}
      </p>
    );
  }

  return (
    <div className="max-w-6xl mx-auto mt-12">
      <div className="w-full">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Histórico de Aulas
        </h1>
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
        {filteredLessons.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] py-12">
            <img
              src={logoEspacoConstruir}
              alt="Logo Espaço Construir"
              style={{ width: 80, marginBottom: 16, borderRadius: 10 }}
            />
            <h2 className="text-lg font-bold mb-1">
              Nenhum histórico encontrado
            </h2>
            <p className="text-gray-500 max-w-md text-sm text-center">
              Nenhuma aula foi registrada ainda para o(s) seu(s) filho(s)
              selecionado(s).
              <br />
              Assim que houver registros, eles aparecerão aqui!
            </p>
          </div>
        ) : (
          <Card>
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  Histórico de Aulas
                </h1>
                <p className="mt-1 text-gray-600">
                  Visualize aulas anteriores e anotações dos professores
                </p>
              </div>
              <div className="mt-3 sm:mt-0 w-full sm:w-64">
                <Select
                  label=""
                  id="child-filter"
                  name="child-filter"
                  options={childOptions}
                  value={selectedChild}
                  onChange={(e) => setSelectedChild(e.target.value)}
                  className="mb-0"
                />
              </div>
            </CardHeader>

            <CardBody>
              <div className="space-y-8">
                {filteredLessons.map((lesson) => {
                  const childName =
                    children.find((c) => c.id === lesson.childId)?.name || "";

                  return (
                    <div
                      key={lesson.id}
                      className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-200"
                    >
                      <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 flex justify-between items-center">
                        <div className="flex items-center">
                          {getStatusIcon(lesson.status)}
                          <span className="ml-2 font-medium text-gray-800">
                            {childName}
                          </span>
                          <span className="mx-2 text-gray-400">•</span>
                          <span className="text-gray-600">
                            {formatDate(lesson.date)} às {lesson.time}
                          </span>
                        </div>
                        <div>{getStatusDisplay(lesson.status)}</div>
                      </div>

                      <div className="px-4 py-3">
                        <h3 className="text-sm font-medium text-gray-500 mb-1">
                          Assunto da Aula: {lesson.subject}
                        </h3>
                        <p className="text-gray-800">{lesson.teacherNotes}</p>
                        <p className="mt-2 text-sm text-gray-500">
                          <span className="font-medium">Professor:</span>{" "}
                          {lesson.teacherName}
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
