import React from "react";
import { createRoot } from "react-dom/client";
import App from "./ui/App";
import "./ui/styles.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root element was not found.");
}

const appRoot = root;

function renderApp() {
  createRoot(appRoot).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

function renderStartupMessage(title: string, detail: string) {
  appRoot.innerHTML = `
    <main style="font-family: Segoe UI, Arial, sans-serif; padding: 24px; color: #182026;">
      <h1 style="font-size: 22px; margin: 0 0 12px;">${title}</h1>
      <p style="line-height: 1.5; margin: 0;">${detail}</p>
    </main>
  `;
}

if (!("Office" in window)) {
  renderStartupMessage(
    "Construction Receipts Excel Add-in",
    "This site is loading, but the receipt manager only runs inside Microsoft Excel as an Office add-in."
  );
} else {
  const timeout = window.setTimeout(() => {
    renderStartupMessage(
      "Waiting for Excel",
      "The add-in page loaded, but Excel has not finished initializing the Office runtime yet. If this remains visible in Excel, close and reopen the task pane."
    );
  }, 5000);

  Office.onReady()
    .then(() => {
      window.clearTimeout(timeout);
      renderApp();
    })
    .catch((error: unknown) => {
      window.clearTimeout(timeout);
      renderStartupMessage(
        "Add-in Startup Error",
        error instanceof Error ? error.message : "Excel could not initialize the Office add-in runtime."
      );
    });
}
