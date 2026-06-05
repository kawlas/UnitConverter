import React, { Suspense, lazy, useEffect, useState } from "react";
import { useRoutes, Routes, Route, Navigate } from "react-router-dom";
// `tempo-routes` is optional at runtime; dynamically load when enabled.

const ConverterPage = lazy(() => import("./pages/ConverterPage"));

function App() {
  const tempoEnabled = import.meta.env.VITE_TEMPO === "true";
  const [externalRoutes, setExternalRoutes] = useState<any[]>([]);

  useEffect(() => {
    if (!tempoEnabled) return;
    // @ts-ignore - optional runtime dependency
    const _r = "tempo-routes"
    import(_r)
      .then((mod) => setExternalRoutes(mod?.default || mod?.routes || []))
      .catch(() => setExternalRoutes([]))
  }, [tempoEnabled]);

  const tempoRoutes = useRoutes(tempoEnabled ? externalRoutes : []);

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
          {tempoEnabled && <Route path="/tempobook/*" />}
        </Routes>
        {tempoEnabled && tempoRoutes}
      </div>
    </Suspense>
  );
}

export default App;
