import React, { useState, useEffect } from "react";
import Input from "../components/Input";
import Button from "../components/Button";
import { apiService } from "../services/api";

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

  useEffect(() => {
    const fetchGuardianId = async () => {
      try {
        const response = await apiService.getCurrentGuardian();
        setGuardianId(response.data.id);
        setFormData((prev) => ({ ...prev, parent: response.data.id }));
      } catch {
        void 0;
      }
    };

    fetchGuardianId();
  }, []);

  useEffect(() => {
    if (guardianId) {
      fetchChildren();
    }
  }, [guardianId]);

  const fetchChildren = async () => {
    if (!guardianId) return;

    try {
      const res = await apiService.getChildrenByResponsible(Number(guardianId));
      setChildren(res.data);
    } catch {
      void 0;
    }
  };

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
    if (!guardianId) {
      // Guardian not identified - no specific error message displayed to user
      return;
    }

    setLoading(true);
    try {
      await apiService.registerStudent({
        name: formData.name,
        email: "", // ajuste conforme necessidade
        password: "", // ajuste conforme necessidade
        phone: "", // ajuste conforme necessidade
        guardianId: Number(guardianId),
        age: Number(formData.age),
        grade: formData.grade,
        condition: formData.condition,
        difficulties: formData.difficulties,
      });
      setFormData({
        name: "",
        age: "",
        grade: "",
        difficulties: "",
        condition: "",
        parent: guardianId,
      });
      fetchChildren();
    } catch {
      void 0;
    } finally {
      setLoading(false);
    }
  };

  if (!guardianId) {
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
                  <Button className="text-red-500 hover:text-red-700">
                    Excluir
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
