import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initializeMonitoring } from "./lib/monitoring";

// Initialize monitoring (Sentry & LogRocket) in production
initializeMonitoring();

createRoot(document.getElementById("root")!).render(<App />);
