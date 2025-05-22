import React, { useState } from "react";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
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
} from "lucide-react";

// Mock data for scheduled classes
const SCHEDULED_CLASSES = [
  {
    id: "1",
    studentId: "student1",
    studentName: "Emma Johnson",
    date: new Date().toISOString().split("T")[0], // Today
    time: "10:00 AM",
    duration: 60,
    type: "in-person",
    parentName: "Sarah Johnson",
    parentContact: "+1 (555) 123-4567",
    notes: "Focus on multiplication tables",
  },
  {
    id: "2",
    studentId: "student2",
    studentName: "Noah Williams",
    date: new Date().toISOString().split("T")[0], // Today
    time: "02:00 PM",
    duration: 60,
    type: "online",
    parentName: "Michael Williams",
    parentContact: "+1 (555) 987-6543",
    notes: "Reading comprehension practice",
  },
  {
    id: "3",
    studentId: "student3",
    studentName: "Olivia Davis",
    date: addDays(new Date(), 1).toISOString().split("T")[0], // Tomorrow
    time: "11:00 AM",
    duration: 60,
    type: "in-person",
    parentName: "Jennifer Davis",
    parentContact: "+1 (555) 222-3333",
    notes: "Science project assistance",
  },
];

// Mock data for students
const STUDENTS = [
  {
    id: "student1",
    name: "Emma Johnson",
    age: 8,
    grade: "3rd",
    parentName: "Sarah Johnson",
    parentContact: "+1 (555) 123-4567",
    learningDifficulties: "Mild dyslexia",
    personalCondition: "None",
    classType: "in-person",
  },
  {
    id: "student2",
    name: "Noah Williams",
    age: 10,
    grade: "5th",
    parentName: "Michael Williams",
    parentContact: "+1 (555) 987-6543",
    learningDifficulties: "ADHD",
    personalCondition: "Mild allergy to peanuts",
    classType: "online",
  },
  {
    id: "student3",
    name: "Olivia Davis",
    age: 7,
    grade: "2nd",
    parentName: "Jennifer Davis",
    parentContact: "+1 (555) 222-3333",
    learningDifficulties: "None",
    personalCondition: "None",
    classType: "in-person",
  },
];

const TeacherDashboardPage: React.FC = () => {
  const today = new Date();
  const startDate = startOfWeek(today, { weekStartsOn: 1 }); // Start from Monday

  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);

  // Get classes for the selected date
  const classesForSelectedDate = SCHEDULED_CLASSES.filter(
    (cls) => cls.date === format(selectedDate, "yyyy-MM-dd")
  );

  // Function to get student details
  const getStudentDetails = (studentId: string) => {
    return STUDENTS.find((student) => student.id === studentId);
  };

  // Handle view student details
  const handleViewStudent = (studentId: string) => {
    setSelectedStudent(studentId);
    setShowStudentModal(true);
  };

  // Function to render the weekly calendar
  const renderWeekCalendar = () => {
    const days = [];

    for (let i = 0; i < 7; i++) {
      const date = addDays(startDate, i);
      const dateStr = format(date, "yyyy-MM-dd");
      const dayClasses = SCHEDULED_CLASSES.filter(
        (cls) => cls.date === dateStr
      );
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
            <div className="text-xs text-gray-500">{format(date, "EEE")}</div>
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
                {classesForSelectedDate.map((cls) => (
                  <div
                    key={cls.id}
                    className={`bg-white border border-blue-100 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer ${
                      selectedClass === cls.id
                        ? "ring-2 ring-[var(--accent)]"
                        : ""
                    }`}
                    onClick={() =>
                      setSelectedClass(cls.id === selectedClass ? null : cls.id)
                    }
                  >
                    <div className="border-b border-blue-100 bg-blue-50 px-4 py-3 flex justify-between items-center">
                      <div className="flex items-center">
                        <User className="h-5 w-5 text-blue-500 mr-2" />
                        <span className="font-medium text-gray-800">
                          {cls.studentName}
                        </span>
                        <span className="mx-2 text-gray-400">•</span>
                        <Clock className="h-4 w-4 text-blue-500 mr-1" />
                        <span className="text-gray-600">
                          {cls.time} ({cls.duration} min)
                        </span>
                        <span className="mx-2 text-gray-400">•</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs ${
                            cls.type === "online"
                              ? "bg-blue-200 text-blue-900"
                              : "bg-green-200 text-green-900"
                          }`}
                        >
                          {cls.type === "online" ? "Online" : "Presencial"}
                        </span>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewStudent(cls.studentId);
                          }}
                        >
                          <FileText className="h-5 w-5 text-gray-500" />
                        </button>
                        <button
                          className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            alert(
                              "Funcionalidade de edição será implementada aqui"
                            );
                          }}
                        >
                          <Edit className="h-5 w-5 text-gray-500" />
                        </button>
                        <button
                          className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            alert("Mensagem do WhatsApp será enviada aqui");
                          }}
                        >
                          <MessageSquare className="h-5 w-5 text-gray-500" />
                        </button>
                      </div>
                    </div>
                    {selectedClass === cls.id && (
                      <div className="px-4 py-3">
                        <div className="mb-3">
                          <h3 className="text-sm font-medium text-gray-500 mb-1">
                            Anotações
                          </h3>
                          <p className="text-gray-800">
                            {cls.notes || "Nenhuma anotação disponível."}
                          </p>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:space-x-6">
                          <div>
                            <h3 className="text-sm font-medium text-gray-500 mb-1">
                              Contato dos Responsáveis
                            </h3>
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center">
                                <Phone className="h-4 w-4 text-gray-400 mr-1" />
                                <a
                                  href={`tel:${cls.parentContact}`}
                                  className="text-indigo-600 hover:text-indigo-800"
                                >
                                  {cls.parentContact}
                                </a>
                              </div>
                              <div className="flex items-center">
                                <MessageSquare className="h-4 w-4 text-gray-400 mr-1" />
                                <a
                                  href="#"
                                  className="text-indigo-600 hover:text-indigo-800"
                                >
                                  WhatsApp
                                </a>
                              </div>
                            </div>
                          </div>
                          <div className="mt-3 sm:mt-0">
                            <Button
                              size="sm"
                              onClick={() => handleViewStudent(cls.studentId)}
                            >
                              Ver Detalhes do Aluno
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardBody>
      </Card>
      {/* Student Details Modal */}
      {showStudentModal && selectedStudent && (
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
                const student = getStudentDetails(selectedStudent);
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
                                  {student.classType === "online"
                                    ? "Online"
                                    : "Presencial"}
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
    </div>
  );
};

export default TeacherDashboardPage;
