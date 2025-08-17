import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "@/entrypoints/options/App";

const Root = document.getElementById("root");
if (!Root) {
  throw new Error("Root element not found");
}

createRoot(Root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
