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
import { Playground } from "./pages/Playground";
import { Badges } from "./pages/Badges";
import { Calendar } from "./pages/Calendar";
import { PokerScenario } from "./pages/games/PokerScenario";
import { MontyHall } from "./pages/games/MontyHall";
import { PokerNight } from "./pages/PokerNight";
import { Store } from "./pages/Store";
import { Comeback } from "./pages/Comeback";
import { AccentThemeApplier } from "./components/store/AccentThemeApplier";

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
    <>
      {user ? <AccentThemeApplier /> : null}
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/signup" element={user ? <Navigate to="/" replace /> : <Signup />} />

        <Route path="/" element={<Protected><Home /></Protected>} />
        <Route path="/lessons" element={<Protected><Lessons /></Protected>} />
        <Route path="/lessons/:lessonId" element={<Protected><LessonPlayer /></Protected>} />
        <Route path="/playground" element={<Protected><Playground /></Protected>} />
        <Route path="/calendar" element={<Protected><Calendar /></Protected>} />
        <Route path="/badges" element={<Protected><Badges /></Protected>} />
        <Route path="/store" element={<Protected><Store /></Protected>} />
        <Route path="/poker" element={<Protected><PokerNight /></Protected>} />
        <Route path="/comeback" element={<Protected><Comeback /></Protected>} />
        <Route path="/games/poker" element={<Protected><PokerScenario /></Protected>} />
        <Route path="/games/monty-hall" element={<Protected><MontyHall /></Protected>} />
        <Route path="/settings" element={<Protected><Settings /></Protected>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
