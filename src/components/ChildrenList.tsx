import { useState, useEffect } from "react";
import { apiService } from "../services/api";

interface Child {
  id: string;
  name: string;
  age: number;
  grade: string;
  difficulties: string;
  condition: string;
}

const ChildrenList = () => {
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // TODO: Pegar o ID do responsável do contexto de autenticação
  const responsavelId = "1"; // Temporário, deve vir do contexto de autenticação

  useEffect(() => {
    const fetchChildren = async () => {
      try {
        setLoading(true);
        const response = await apiService.getChildrenByResponsible(
          responsavelId
        );
        setChildren(response.data);
      } catch (error) {
        setError("Erro ao carregar os alunos");
        console.error("Erro:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchChildren();
  }, [responsavelId]);

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (error) {
    return <div>Erro: {error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Meus Filhos</h2>

      {children.length === 0 ? (
        <p>Nenhum aluno cadastrado</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {children.map((child) => (
            <div key={child.id} className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-xl font-semibold mb-2">{child.name}</h3>
              <div className="space-y-2">
                <p>
                  <strong>Idade:</strong> {child.age}
                </p>
                <p>
                  <strong>Série:</strong> {child.grade}
                </p>
                <p>
                  <strong>Condição:</strong> {child.condition}
                </p>
                <p>
                  <strong>Dificuldades:</strong> {child.difficulties}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChildrenList;
