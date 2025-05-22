import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import AuthFlow from "./pages/auth-flow-react";
import MainLayout from "./layouts/MainLayout";
import TeacherDashboardPage from "./pages/TeacherDashboardPage";
import ChildRegistrationPage from "./pages/ChildRegistrationPage";
import SchedulePage from "./pages/SchedulePage";
import HistoryPage from "./pages/HistoryPage";
import ChildrenListPage from "./pages/ChildrenListPage";
import RegisterResponsiblePage from "./pages/RegisterResponsiblePage";
import RegisterTeacherPage from "./pages/RegisterTeacherPage";

function App() {
  return (
    <Router>
      <Routes>
        {/* Main auth flow route */}
        <Route path="/" element={<AuthFlow />} />
        <Route path="/login" element={<Navigate to="/" replace />} />

        {/* Protected routes for teachers */}
        <Route
          path="/teacher-dashboard"
          element={
            <MainLayout userType="teacher">
              <TeacherDashboardPage />
            </MainLayout>
          }
        />
        <Route
          path="/students"
          element={
            <MainLayout userType="teacher">
              <ChildRegistrationPage />
            </MainLayout>
          }
        />
        <Route
          path="/manage-schedule"
          element={
            <MainLayout userType="teacher">
              <SchedulePage />
            </MainLayout>
          }
        />

        {/* Protected routes for parents */}
        <Route
          path="/register-child"
          element={
            <MainLayout userType="parent">
              <ChildRegistrationPage />
            </MainLayout>
          }
        />
        <Route
          path="/schedule"
          element={
            <MainLayout userType="parent">
              <SchedulePage />
            </MainLayout>
          }
        />
        <Route
          path="/history"
          element={
            <MainLayout userType="parent">
              <HistoryPage />
            </MainLayout>
          }
        />
        <Route
          path="/children-list"
          element={
            <MainLayout userType="parent">
              <ChildrenListPage />
            </MainLayout>
          }
        />
        <Route
          path="/register-responsible"
          element={
            <MainLayout userType="parent">
              <RegisterResponsiblePage />
            </MainLayout>
          }
        />

        {/* Protected routes for teachers */}
        <Route
          path="/register-teacher"
          element={
            <MainLayout userType="teacher">
              <RegisterTeacherPage />
            </MainLayout>
          }
        />

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
