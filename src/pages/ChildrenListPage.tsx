import React from "react";
import Card, { CardHeader, CardBody } from "../components/Card";

// Mock children data for demonstration
const MOCK_CHILDREN = [
  {
    id: "1",
    name: "Lucas Silva",
    age: 8,
    grade: "3º ano",
    classType: "Presencial",
  },
  {
    id: "2",
    name: "Maria Souza",
    age: 10,
    grade: "5º ano",
    classType: "Online",
  },
];

const ChildrenListPage: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto mt-8">
      <Card>
        <CardHeader>
          <h2 className="text-xl font-bold text-blue-700">
            Filhos Cadastrados
          </h2>
        </CardHeader>
        <CardBody>
          {MOCK_CHILDREN.length === 0 ? (
            <p className="text-gray-500">Nenhum filho cadastrado.</p>
          ) : (
            <ul className="divide-y divide-blue-100">
              {MOCK_CHILDREN.map((child) => (
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
