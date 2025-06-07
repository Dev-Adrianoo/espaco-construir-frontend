import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LogOut, Menu, X, GraduationCap, User } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

type MainLayoutProps = {
  children: React.ReactNode;
  userType: "teacher" | "parent" | null;
};

const MainLayout: React.FC<MainLayoutProps> = ({ children, userType }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  const teacherLinks = [
    { path: "/teacher-dashboard", label: "Painel" },
    { path: "/students", label: "Alunos" },
    { path: "/manage-schedule", label: "Agenda" },
  ];

  const parentLinks = [
    { path: "/children", label: "Filhos" },
    { path: "/schedule", label: "Agendar Aula" },
    { path: "/history", label: "Histórico" },
  ];

  const links = userType === "teacher" ? teacherLinks : parentLinks;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <GraduationCap className="h-8 w-8 text-[var(--accent)]" />
                <span className="ml-2 text-xl font-bold text-[var(--accent-dark)]">
                  Espaço Construir
                </span>
              </div>
              <nav className="hidden md:ml-6 md:flex md:space-x-8">
                {links.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      location.pathname === link.path
                        ? "border-[var(--accent)] text-[var(--accent-dark)]"
                        : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="hidden md:ml-6 md:flex md:items-center">
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <User className="h-5 w-5 text-gray-400" />
                  <span className="ml-2 text-sm text-gray-700">
                    {user?.name}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-[var(--accent)] hover:bg-[var(--accent-dark)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent)]"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </button>
              </div>
            </div>
            <div className="flex items-center md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[var(--accent)]"
              >
                <span className="sr-only">Open main menu</span>
                {isMobileMenuOpen ? (
                  <X className="block h-6 w-6" />
                ) : (
                  <Menu className="block h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="pt-2 pb-3 space-y-1">
              {links.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                    location.pathname === link.path
                      ? "bg-blue-50 border-[var(--accent)] text-[var(--accent-dark)]"
                      : "border-transparent text-gray-500 hover:bg-blue-50 hover:border-[var(--accent)] hover:text-[var(--accent-dark)]"
                  } transition-colors duration-200`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="border-t border-gray-200 pt-4 pb-3">
                <div className="flex items-center px-4">
                  <div className="flex-shrink-0">
                    <User className="h-10 w-10 text-gray-400" />
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium text-gray-800">
                      {user?.name}
                    </div>
                    <div className="text-sm font-medium text-gray-500">
                      {user?.email}
                    </div>
                  </div>
                </div>
                <div className="mt-3 space-y-1">
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                  >
                    Sair
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="flex-grow px-4 py-8 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {children}
      </main>

      <footer className="bg-white border-t border-blue-100 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-[var(--accent)]">
            &copy; {new Date().getFullYear()} Espaço Construir. Todos os
            direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
