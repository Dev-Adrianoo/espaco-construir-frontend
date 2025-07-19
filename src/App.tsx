import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
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
import GuardianDashboard from "./pages/GuardianDashboard";
import ResetPasswordPage from "./pages/ResetPasswordPage";

const ProtectedLayout = () => {
  const { user } = useAuth();
  return (
    <ProtectedRoute allowedRoles={["PROFESSORA", "RESPONSAVEL"]}>
      <MainLayout userType={user?.role}>
        <Outlet />
      </MainLayout>
    </ProtectedRoute>
  )
}

function AppRoutes() {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <Routes>
     
      <Route path="/" element={<AuthFlow />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      <Route element={<ProtectedLayout />}>
   
        <Route path="/teacher-dashboard" element={<TeacherDashboardPage />} />
        <Route path="/guardian-dashboard" element={<GuardianDashboard />} />
        <Route path="/register-child" element={<ChildRegistrationPage />} />
        <Route path="/students" element={<ChildRegistrationPage />} />
        <Route path="/manage-schedule" element={<SchedulePage />} />
        <Route path="/schedule" element={<SchedulePage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/children" element={<ChildrenDashboardPage />} />
        <Route path="/register-responsible" element={<RegisterResponsiblePage />} />
        <Route path="/register-teacher" element={<RegisterTeacherPage />} />
      </Route>
      
 
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
    

      <Route path="/" element={<AuthFlow />} />

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

      {/* Protected routes for parents */}
      // <Route
      //   path="/guardian-dashboard"
      //   element={
      //     <ProtectedRoute allowedRoles={["RESPONSAVEL"]}>
      //       <MainLayout userType="RESPONSAVEL">
      //         <GuardianDashboard />
      //       </MainLayout>
      //     </ProtectedRoute>
      //   }
      // />

      // <Route
      //   path="/register-child"
      //   element={
      //     <ProtectedRoute allowedRoles={["RESPONSAVEL", "PROFESSORA"]}>
      //       <MainLayout userType={user?.role || "RESPONSAVEL"}>
      //         <ChildRegistrationPage />
      //       </MainLayout>
      //     </ProtectedRoute>
      //   }
      // />

      // {/* Protected routes for teachers */}
      //     <Route
      //       path="/students"
      //       element={
      //         <ProtectedRoute allowedRoles={["PROFESSORA"]}>
      //           <MainLayout userType="PROFESSORA">
      //             <ChildRegistrationPage />
      //           </MainLayout>
      //         </ProtectedRoute>
      //       }
      //     />
      //     <Route
      //       path="/manage-schedule"
      //       element={
      //         <ProtectedRoute allowedRoles={["PROFESSORA"]}>
      //           <MainLayout userType="PROFESSORA">
      //             <SchedulePage />
      //           </MainLayout>
      //         </ProtectedRoute>
      //       }
      //     />

      //     {/* Protected routes for parents */}
      //     <Route
      //       path="/schedule"
      //       element={
      //         <ProtectedRoute allowedRoles={["RESPONSAVEL"]}>
      //           <MainLayout userType="RESPONSAVEL">
      //             <SchedulePage />
      //           </MainLayout>
      //         </ProtectedRoute>
      //       }
      //     />
      //     <Route
      //       path="/history"
      //       element={
      //         <ProtectedRoute allowedRoles={["RESPONSAVEL"]}>
      //           <MainLayout userType="RESPONSAVEL">
      //             <HistoryPage />
      //           </MainLayout>
      //         </ProtectedRoute>
      //       }
      //     />
      //     <Route
      //       path="/children"
      //       element={
      //         <ProtectedRoute allowedRoles={["RESPONSAVEL"]}>
      //           <MainLayout userType="RESPONSAVEL">
      //             <ChildrenDashboardPage />
      //           </MainLayout>
      //         </ProtectedRoute>
      //       }
      //     />
      //     <Route
      //       path="/register-responsible"
      //       element={
      //         <ProtectedRoute allowedRoles={["RESPONSAVEL"]}>
      //           <MainLayout userType="RESPONSAVEL">
      //             <RegisterResponsiblePage />
      //           </MainLayout>
      //         </ProtectedRoute>
      //       }
      //     />

      //     {/* Protected routes for teachers */}
      //     <Route
      //       path="/register-teacher"
      //       element={
      //         <ProtectedRoute allowedRoles={["PROFESSORA"]}>
      //           <MainLayout userType="PROFESSORA">
      //             <RegisterTeacherPage />
      //           </MainLayout>
      //         </ProtectedRoute>
      //       }
      //     />

      //     {/* Fallback route */}
      //     <Route path="*" element={<Navigate to="/" replace />} />
      //   </Routes>
//   )
// }

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
        <Toaster />
      </AuthProvider>
    </Router>
  );
}

export default App;
