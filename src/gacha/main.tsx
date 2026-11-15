import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../shared/base.css";
import "./gacha.css";
import { GachaApp } from "./GachaApp.tsx";

const root = document.getElementById("root");
if (root === null) {
  throw new Error("#root が見つかりません");
}
createRoot(root).render(
  <StrictMode>
    <GachaApp />
  </StrictMode>,
);
