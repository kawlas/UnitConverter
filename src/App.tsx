import { Suspense, lazy } from "react";
import { useRoutes, Routes, Route, Navigate } from "react-router-dom";
import routes from "tempo-routes";

const ConverterPage = lazy(() => import("./pages/ConverterPage"));

function App() {
  const tempoRoutes =
    import.meta.env.VITE_TEMPO === "true" ? useRoutes(routes) : null;

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <p>Loading...</p>
        </div>
      }
    >
      <div>
        <Routes>
          <Route path="/" element={<Navigate to="/power" replace />} />
          <Route path="/:categoryId" element={<ConverterPage />} />
          {import.meta.env.VITE_TEMPO && <Route path="/tempobook/*" />}
        </Routes>
        {tempoRoutes}
      </div>
    </Suspense>
  );
}

export default App;
