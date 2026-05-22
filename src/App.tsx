import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/system/ErrorBoundary";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { FloatingChatButton } from "@/components/chat/FloatingChatButton";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import Farm from "./pages/Farm";
import Pet from "./pages/Pet";
import Tasks from "./pages/Tasks";
import Profile from "./pages/Profile";
import TeacherDashboard from "./pages/TeacherDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Leaderboard from "./pages/Leaderboard";
import Groups from "./pages/Groups";
import WeeklyReports from "./pages/WeeklyReports";
import CreateTask from "./pages/CreateTask";
import ReviewSubmission from "./pages/ReviewSubmission";
import StudentDetailStats from "./pages/StudentDetailStats";
import Settings from "./pages/Settings";
import Achievements from "./pages/Achievements";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/farm" element={<ProtectedRoute><Farm /></ProtectedRoute>} />
              <Route path="/pet" element={<ProtectedRoute><Pet /></ProtectedRoute>} />
              <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
              <Route path="/teacher" element={<ProtectedRoute><TeacherDashboard /></ProtectedRoute>} />
              <Route path="/teacher/create-task" element={<ProtectedRoute><CreateTask /></ProtectedRoute>} />
              <Route path="/teacher/submission/:submissionId" element={<ProtectedRoute><ReviewSubmission /></ProtectedRoute>} />
              <Route path="/teacher/student/:studentId" element={<ProtectedRoute><StudentDetailStats /></ProtectedRoute>} />
              <Route path="/teacher/groups" element={<ProtectedRoute><Groups /></ProtectedRoute>} />
              <Route path="/teacher/reports" element={<ProtectedRoute><WeeklyReports /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
              <Route path="/achievements" element={<ProtectedRoute><Achievements /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <FloatingChatButton />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
