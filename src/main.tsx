import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { QuizDifficultyProvider } from "./context/QuizDifficultyContext";
import { ProgressProvider } from "./context/ProgressContext";
import { App } from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <QuizDifficultyProvider>
        <BrowserRouter>
          <AuthProvider>
            <ProgressProvider>
              <App />
            </ProgressProvider>
          </AuthProvider>
        </BrowserRouter>
      </QuizDifficultyProvider>
    </ThemeProvider>
  </StrictMode>,
);
