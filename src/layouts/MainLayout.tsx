import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LogOut, Menu, X, GraduationCap, User } from "lucide-react";

type MainLayoutProps = {
  children: React.ReactNode;
  userType: "teacher" | "parent" | null;
};

const MainLayout: React.FC<MainLayoutProps> = ({ children, userType }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const storedUserType = localStorage.getItem("userType") as
    | "teacher"
    | "parent"
    | null;
  const effectiveUserType = userType || storedUserType;

  React.useEffect(() => {
    if (!effectiveUserType && location.pathname !== "/login") {
      navigate("/login");
    }
  }, [effectiveUserType, location.pathname, navigate]);

  const handleLogout = () => {
    localStorage.removeItem("userType");
    localStorage.removeItem("responsavelId");
    navigate("/login");
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

  const links = effectiveUserType === "teacher" ? teacherLinks : parentLinks;

  return (
    <div className="min-h-screen bg-[#f4f7fd] flex flex-col">
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex-shrink-0 flex items-center">
                <GraduationCap className="h-8 w-8 text-[var(--accent)]" />
                <span className="ml-2 text-[var(--accent-dark)] font-bold text-xl">
                  Espaço Construir
                </span>
              </Link>

              <nav className="hidden md:ml-10 md:flex md:space-x-8">
                {effectiveUserType &&
                  links.map((link) => (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                        location.pathname === link.path
                          ? "border-[var(--accent)] text-[var(--accent-dark)]"
                          : "border-transparent text-gray-500 hover:text-[var(--accent-dark)] hover:border-[var(--accent)]"
                      } transition-colors duration-200`}
                    >
                      {link.label}
                    </Link>
                  ))}
              </nav>
            </div>

            {effectiveUserType && (
              <div className="hidden md:flex md:items-center gap-4">
                <span className="flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">
                  {effectiveUserType === "teacher" ? (
                    <GraduationCap className="h-4 w-4 text-blue-500" />
                  ) : (
                    <User className="h-4 w-4 text-blue-500" />
                  )}
                  {effectiveUserType === "teacher"
                    ? "Professor(a)"
                    : "Responsável"}
                </span>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[var(--accent)] hover:bg-[var(--accent-dark)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent)] transition-colors duration-200"
                >
                  <LogOut size={16} className="mr-2" />
                  Sair
                </button>
              </div>
            )}

            <div className="flex items-center md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-[var(--accent)] hover:text-[var(--accent-dark)] hover:bg-blue-50 focus:outline-none"
              >
                {isMobileMenuOpen ? (
                  <X size={24} aria-hidden="true" />
                ) : (
                  <Menu size={24} aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="pt-2 pb-3 space-y-1">
              {effectiveUserType &&
                links.map((link) => (
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
              {effectiveUserType && (
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="block w-full text-left pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-500 hover:bg-blue-50 hover:border-[var(--accent)] hover:text-[var(--accent-dark)] transition-colors duration-200"
                >
                  Sair
                </button>
              )}
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
