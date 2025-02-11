import { Suspense } from "react";
import { useRoutes, Routes, Route, Navigate } from "react-router-dom";
import routes from "tempo-routes";
import ConverterPage from "./pages/ConverterPage";
import Navbar from "./components/Navbar";

function App() {
  const tempoRoutes =
    import.meta.env.VITE_TEMPO === "true" ? useRoutes(routes) : null;

  return (
    <Suspense fallback={<p>Loading...</p>}>
      <div>
        <Routes>
          {/* Default route redirects to power converter */}
          <Route path="/" element={<Navigate to="/power" replace />} />
          {/* Individual converter routes */}
          <Route path="/:categoryId" element={<ConverterPage />} />
          {/* Tempo routes */}
          {import.meta.env.VITE_TEMPO && <Route path="/tempobook/*" />}
        </Routes>
        {tempoRoutes}
      </div>
    </Suspense>
  );
}

export default App;
