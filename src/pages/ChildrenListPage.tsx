import React, { useEffect, useState } from "react";
import Card, { CardHeader, CardBody } from "../components/Card";
import { apiService } from "../services/api";
import { AxiosError } from "axios";

interface Child {
  id: string;
  name: string;
  age: number;
  grade: string;
  classType: string;
}

const ChildrenListPage: React.FC = () => {
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChildren = async () => {
      const responsavelId = localStorage.getItem("responsavelId");
      if (!responsavelId) {
        setError(
          "ID do responsável não encontrado. Por favor, faça login novamente."
        );
        setLoading(false);
        return;
      }

      try {
        const response = await apiService.getChildrenByResponsible(
          Number(responsavelId)
        );
        setChildren(response.data);
      } catch (err) {
        const error = err as AxiosError<{ message: string }>;
        setError(
          error.response?.data?.message ||
            "Erro ao carregar filhos cadastrados."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchChildren();
  }, []);

  if (loading) {
    return (
      <p className="text-center text-gray-500 mt-8">Carregando filhos...</p>
    );
  }

  if (error) {
    return <p className="text-center text-red-500 mt-8">Erro: {error}</p>;
  }

  return (
    <div className="max-w-3xl mx-auto mt-8">
      <Card>
        <CardHeader>
          <h2 className="text-xl font-bold text-blue-700">
            Filhos Cadastrados
          </h2>
        </CardHeader>
        <CardBody>
          {children.length === 0 ? (
            <p className="text-gray-500">Nenhum filho cadastrado.</p>
          ) : (
            <ul className="divide-y divide-blue-100">
              {children.map((child) => (
                <li
                  key={child.id}
                  className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <span className="font-medium text-gray-800">
                      {child.name}
                    </span>
                    <span className="ml-2 text-gray-500 text-sm">
                      {child.age} anos, {child.grade}
                    </span>
                  </div>
                  <span className="mt-1 sm:mt-0 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                    {child.classType}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default ChildrenListPage;
