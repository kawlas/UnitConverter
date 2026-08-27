import React, { Suspense, lazy, useEffect, useState } from "react";
import { useRoutes, Routes, Route } from "react-router-dom";
import type { RouteObject } from "react-router-dom";
// `tempo-routes` is optional at runtime; dynamically load when enabled.

const ConverterPage = lazy(() => import("./pages/ConverterPage"));
const HomePage = lazy(() => import("./pages/HomePage"));

function App() {
  const tempoEnabled = import.meta.env.VITE_TEMPO === "true";
  const [externalRoutes, setExternalRoutes] = useState<RouteObject[]>([]);

  useEffect(() => {
    if (!tempoEnabled) return;
    const _r = "tempo-routes"
    import(_r)
      .then((mod) => setExternalRoutes((mod?.default || mod?.routes || []) as RouteObject[]))
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
          <Route path="/" element={<HomePage />} />
          <Route path="/:categoryId" element={<ConverterPage />} />
          <Route path="/convert/:categoryId" element={<ConverterPage />} />
          {tempoEnabled && <Route path="/tempobook/*" />}
        </Routes>
        {tempoEnabled && tempoRoutes}
      </div>
    </Suspense>
  );
}

export default App;
