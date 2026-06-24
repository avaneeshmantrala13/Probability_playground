import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { FirebaseSetupNotice } from "./components/FirebaseSetupNotice";
import { LoadingScreen } from "./components/layout/LoadingScreen";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";
import { AppShell } from "./components/layout/AppShell";
import { Login } from "./pages/Login";
import { Signup } from "./pages/Signup";
import { Home } from "./pages/Home";
import { Lessons } from "./pages/Lessons";
import { LessonPlayer } from "./pages/LessonPlayer";
import { Settings } from "./pages/Settings";

/** Wraps a page in auth protection + the app chrome. */
function Protected({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <AppShell>{children}</AppShell>
    </ProtectedRoute>
  );
}

export function App() {
  const { configured, loading, user } = useAuth();

  if (!configured) return <FirebaseSetupNotice />;
  if (loading) return <LoadingScreen />;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/signup" element={user ? <Navigate to="/" replace /> : <Signup />} />

      <Route path="/" element={<Protected><Home /></Protected>} />
      <Route path="/lessons" element={<Protected><Lessons /></Protected>} />
      <Route path="/lessons/:lessonId" element={<Protected><LessonPlayer /></Protected>} />
      <Route path="/settings" element={<Protected><Settings /></Protected>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
