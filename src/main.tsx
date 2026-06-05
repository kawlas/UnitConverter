import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";

if (import.meta.env.VITE_TEMPO === "true") {
  const _m = "tempo-devtools"
  import(_m)
    .then((mod) => {
      try {
        mod?.TempoDevtools?.init?.()
      } catch {
        // ignore devtools init errors
      }
    })
    .catch(() => {
      // tempo-devtools not installed; skip
    })
}

const basename = import.meta.env.BASE_URL;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter basename={basename}>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
