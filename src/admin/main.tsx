import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../shared/base.css";
import "./admin.css";
import { AdminApp } from "./AdminApp.tsx";

const root = document.getElementById("root");
if (root === null) {
  throw new Error("#root が見つかりません");
}
createRoot(root).render(
  <StrictMode>
    <AdminApp />
  </StrictMode>,
);
