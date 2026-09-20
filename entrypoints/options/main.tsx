import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { i18n } from "#i18n";
import App from "@/entrypoints/options/App";

document.title = i18n.t("optionsTitle");
document.documentElement.lang = i18n.t("language");

const Root = document.getElementById("root");
if (!Root) {
  throw new Error("Root element not found");
}

createRoot(Root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
