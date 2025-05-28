import React, { useState } from "react";
import Card, { CardHeader, CardBody } from "../components/Card";
import Select from "../components/Select";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";

const CHILDREN = [
  { id: "child1", name: "Maria Silva" },
  { id: "child2", name: "Pedro Santos" },
];

const LESSON_HISTORY = [
  {
    id: "1",
    childId: "child1",
    date: "2025-04-15",
    time: "10:00",
    status: "attended",
    teacherNotes:
      "Maria teve um ótimo desempenho com multiplicação hoje. Completou todos os exercícios propostos e demonstrou boa compreensão do conceito. Continuaremos praticando com problemas escritos na próxima aula.",
    teacherName: "Profa. Rodriguez",
  },
  {
    id: "2",
    childId: "child1",
    date: "2025-04-08",
    time: "10:00",
    status: "absent",
    teacherNotes:
      "Ausente por motivo de doença. Remarcaremos esta aula e recuperaremos o conteúdo na próxima semana.",
    teacherName: "Profa. Rodriguez",
  },
  {
    id: "3",
    childId: "child1",
    date: "2025-04-01",
    time: "10:00",
    status: "attended",
    teacherNotes:
      "Focamos em adição e subtração com reagrupamento. Maria teve dificuldade com alguns problemas mais complexos. Estou passando exercícios extras para esta semana.",
    teacherName: "Profa. Rodriguez",
  },
  {
    id: "4",
    childId: "child2",
    date: "2025-04-14",
    time: "15:00",
    status: "attended",
    teacherNotes:
      "Pedro mostrou grande progresso na compreensão de leitura hoje. Lemos uma história curta e ele conseguiu responder perguntas sobre as ideias principais e detalhes de suporte.",
    teacherName: "Prof. Johnson",
  },
  {
    id: "5",
    childId: "child2",
    date: "2025-04-07",
    time: "15:00",
    status: "late",
    teacherNotes:
      "Pedro chegou 15 minutos atrasado. Conseguimos cobrir a maior parte do material planejado, mas por favor, tentem garantir pontualidade para máximo aproveitamento.",
    teacherName: "Prof. Johnson",
  },
];

const HistoryPage: React.FC = () => {
  const [selectedChild, setSelectedChild] = useState<string>("all");

  const filteredLessons =
    selectedChild === "all"
      ? LESSON_HISTORY
      : LESSON_HISTORY.filter((lesson) => lesson.childId === selectedChild);

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return new Date(dateString).toLocaleDateString("pt-BR", options);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "attended":
        return <CheckCircle className="h-5 w-5 text-secondary-500" />;
      case "absent":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "late":
        return <AlertCircle className="h-5 w-5 text-primary-500" />;
      default:
        return null;
    }
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "attended":
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-secondary-100 text-secondary-800">
            Presente
          </span>
        );
      case "absent":
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
            Ausente
          </span>
        );
      case "late":
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-primary-100 text-primary-800">
            Atrasado
          </span>
        );
      default:
        return null;
    }
  };

  const childOptions = [
    { value: "all", label: "Todos os Alunos" },
    ...CHILDREN.map((child) => ({ value: child.id, label: child.name })),
  ];

  return (
    <div className="max-w-6xl mx-auto">
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
          {filteredLessons.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-500">
                Nenhum histórico de aula disponível.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {filteredLessons.map((lesson) => {
                const childName =
                  CHILDREN.find((c) => c.id === lesson.childId)?.name || "";

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
                        Anotações do Professor
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
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default HistoryPage;
