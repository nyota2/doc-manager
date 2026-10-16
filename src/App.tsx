import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import AppShell from "./app/AppShell";
import Home from "./app/pages/Home";
import Board from "./app/pages/Board";
import Approvals from "./app/pages/Approvals";
import Records from "./app/pages/Records";
import Audit from "./app/pages/Audit";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/app" element={<AppShell />}>
          <Route index element={<Home />} />
          <Route path="w/:workspace" element={<Board />} />
          <Route path="approvals" element={<Approvals />} />
          <Route path="records" element={<Records />} />
          <Route path="audit" element={<Audit />} />
          <Route path="*" element={<Navigate to="/app" replace />} />
        </Route>
        <Route path="/dashboard" element={<Navigate to="/app" replace />} />
        <Route path="*" element={<Landing />} />
      </Routes>
    </>
  );
}
