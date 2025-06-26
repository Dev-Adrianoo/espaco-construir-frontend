import React, { useState, useEffect } from "react";
import Input from "../components/Input";
import Button from "../components/Button";
import { apiService } from "../services/api";
import studentService from "../services/studentService";
import toast from "react-hot-toast";
import Modal from "../components/Modal";
import { useAuth } from "../contexts/AuthContext";
import { useLocation } from "react-router-dom";

interface Child {
  id: string;
  name: string;
  age: number;
  grade: string;
  difficulties?: string;
  condition?: string;
  parent: string;
}

const RegisterAndListChildrenPage: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    grade: "",
    difficulties: "",
    condition: "",
    parent: "",
  });
  const [loading, setLoading] = useState(false);
  const [guardianId, setGuardianId] = useState<string | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [childToDelete, setChildToDelete] = useState<Child | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Busca o ID do responsável e a lista de alunos
  const fetchData = async () => {
      try {
        const response = await apiService.getCurrentGuardian();
      const id = response.data.id;
      setGuardianId(id);
      
      const res = await apiService.getChildrenByResponsible(Number(id));
      setChildren(res.data);
    } catch (error) {
      toast.error('Erro ao carregar dados. Por favor, recarregue a página.');
    }
  };

  // Carrega os dados iniciais
  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guardianId) return;

    setLoading(true);
    try {
      await apiService.registerStudent({
        name: formData.name,
        email: "",
        password: "",
        phone: "",
        guardianId: Number(guardianId),
        age: Number(formData.age),
        grade: formData.grade,
        condition: formData.condition,
        difficulties: formData.difficulties,
      });

      // Busca os dados atualizados
      await fetchData();
      
      // Limpa o formulário
      setFormData({
        name: "",
        age: "",
        grade: "",
        difficulties: "",
        condition: "",
        parent: guardianId,
      });
      
      toast.success('Aluno cadastrado com sucesso!');
    } catch (error) {
      toast.error('Erro ao cadastrar aluno. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (child: Child) => {
    setChildToDelete(child);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!childToDelete) return;
    
    try {
      setIsDeleting(true);
      await studentService.deleteStudent(childToDelete.id);
      
      // Busca os dados atualizados
      await fetchData();
      
      toast.success('Aluno excluído com sucesso!');
      setShowDeleteModal(false);
      setChildToDelete(null);
    } catch (error: any) {
      if (error.response?.status === 400) {
        toast.error('Não é possível excluir o aluno pois ele possui aulas agendadas. Por favor, cancele todas as aulas antes de excluir.');
      } else {
        toast.error('Erro ao excluir aluno. Por favor, tente novamente.');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  if (!user?.id) {
    return (
      <div className="max-w-2xl mx-auto mt-8 bg-white rounded-xl shadow-md p-8 text-center">
        <h2 className="text-2xl font-bold mb-2">Faça login como responsável</h2>
        <p className="text-gray-600">
          Você precisa estar logado como responsável para cadastrar e visualizar
          filhos.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto mt-8 p-4 flex flex-col gap-8">
      <div className="bg-white rounded-xl shadow-md p-8">
        <h2 className="text-xl font-bold mb-4">Filhos Cadastrados</h2>
        {children.length === 0 ? (
          <p>Nenhum filho cadastrado ainda.</p>
        ) : (
          <div className="flex flex-col gap-4 w-full">
            {children.map((child) => (
              <div
                key={child.id}
                className="p-5 border border-gray-200 rounded-lg bg-white shadow-sm flex flex-col transition-all duration-200 hover:shadow-md w-full"
              >
                <div>
                  <p className="font-semibold text-lg text-gray-800 mb-1">
                    {child.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    {child.age} anos,{" "}
                    {child.grade === "kindergarten"
                      ? "Educação Infantil"
                      : `${child.grade}º ano`}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button className="text-gray-500 hover:text-gray-700">
                    Editar
                  </Button>
                  <Button 
                    className="text-red-500 hover:text-red-700"
                    onClick={() => handleDelete(child)}
                  >
                    Excluir
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de confirmação de exclusão */}
      {showDeleteModal && childToDelete && (
        <Modal
          isOpen={showDeleteModal}
          onClose={() => !isDeleting && setShowDeleteModal(false)}
          title="Confirmar Exclusão"
        >
          <div className="p-4">
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-100 rounded-md">
              <p className="text-yellow-800">
                <strong>Atenção:</strong> Ao excluir o aluno {childToDelete.name}:
              </p>
              <ul className="list-disc list-inside mt-2 text-yellow-700 text-sm">
                <li>Todos os agendamentos dele serão cancelados</li>
                <li>Esta ação não pode ser desfeita</li>
              </ul>
            </div>
            <p className="text-gray-600 mb-4">
              Tem certeza que deseja continuar?
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                onClick={confirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <div className="flex items-center">
                    <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Excluindo...
                  </div>
                ) : (
                  "Sim, excluir"
                )}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      <div className="bg-white rounded-xl shadow-md p-8">
        <h2 className="text-2xl font-bold mb-2">Cadastrar Aluno</h2>
        <p className="mb-6 text-gray-600">
          Por favor, forneça informações sobre o aluno para ajudar a
          personalizar a experiência de tutoria.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-4">
            <Input
              id="name"
              label="Nome Completo do Aluno"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <Input
              id="age"
              label="Idade"
              name="age"
              value={formData.age}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Série Escolar
            </label>
            <select
              id="grade"
              name="grade"
              value={formData.grade}
              onChange={handleChange}
              required
              className="w-full border rounded-md px-3 py-2"
            >
              <option value="">Selecione a série</option>
              <option value="1º ano">1º ano</option>
              <option value="2º ano">2º ano</option>
              <option value="3º ano">3º ano</option>
              <option value="4º ano">4º ano</option>
              <option value="5º ano">5º ano</option>
            </select>
          </div>
          <Input
            id="difficulties"
            label="Dificuldades de Aprendizagem (se houver)"
            name="difficulties"
            value={formData.difficulties}
            onChange={handleChange}
          />
          <Input
            id="condition"
            label="Condição Pessoal"
            name="condition"
            value={formData.condition}
            onChange={handleChange}
          />
          <Button type="submit" disabled={loading}>
            {loading ? "Cadastrando..." : "Cadastrar"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default RegisterAndListChildrenPage;
