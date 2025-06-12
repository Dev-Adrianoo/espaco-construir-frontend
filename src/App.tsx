import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AuthFlow from "./pages/auth-flow-react";
import MainLayout from "./layouts/MainLayout";
import TeacherDashboardPage from "./pages/TeacherDashboardPage";
import ChildRegistrationPage from "./pages/ChildRegistrationPage";
import SchedulePage from "./pages/SchedulePage";
import HistoryPage from "./pages/HistoryPage";
import RegisterResponsiblePage from "./pages/RegisterResponsiblePage";
import RegisterTeacherPage from "./pages/RegisterTeacherPage";
import ChildrenDashboardPage from "./pages/ChildrenDashboardPage";

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<AuthFlow />} />
          <Route path="/login" element={<Navigate to="/" replace />} />

          {/* Protected routes for teachers */}
          <Route
            path="/teacher-dashboard"
            element={
              <ProtectedRoute allowedRoles={["PROFESSORA"]}>
                <MainLayout userType="PROFESSORA">
                  <TeacherDashboardPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/students"
            element={
              <ProtectedRoute allowedRoles={["PROFESSORA"]}>
                <MainLayout userType="PROFESSORA">
                  <ChildRegistrationPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/manage-schedule"
            element={
              <ProtectedRoute allowedRoles={["PROFESSORA"]}>
                <MainLayout userType="PROFESSORA">
                  <SchedulePage />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          {/* Protected routes for parents */}
          <Route
            path="/schedule"
            element={
              <ProtectedRoute allowedRoles={["RESPONSAVEL"]}>
                <MainLayout userType="RESPONSAVEL">
                  <SchedulePage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute allowedRoles={["RESPONSAVEL"]}>
                <MainLayout userType="RESPONSAVEL">
                  <HistoryPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/children"
            element={
              <ProtectedRoute allowedRoles={["RESPONSAVEL"]}>
                <MainLayout userType="RESPONSAVEL">
                  <ChildrenDashboardPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/register-responsible"
            element={
              <ProtectedRoute allowedRoles={["RESPONSAVEL"]}>
                <MainLayout userType="RESPONSAVEL">
                  <RegisterResponsiblePage />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          {/* Protected routes for teachers */}
          <Route
            path="/register-teacher"
            element={
              <ProtectedRoute allowedRoles={["PROFESSORA"]}>
                <MainLayout userType="PROFESSORA">
                  <RegisterTeacherPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster />
      </AuthProvider>
    </Router>
  );
}

export default App;
