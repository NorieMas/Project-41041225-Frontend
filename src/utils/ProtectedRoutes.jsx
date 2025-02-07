/*
import React from "react";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";

const ProtectedRoutes = () => {
  return auth?.currentUser?.displayName ? (
    <Routes>
      <Route path="*" element={<Outlet />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  ) : (*
    <Navigate to="/" />
  );
};

export default ProtectedRoutes;
*/