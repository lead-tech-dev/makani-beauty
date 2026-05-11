import React from "react";
import ReactDOM from "react-dom/client";
import { initSentry } from "./lib/sentry";
import "./styles/global.scss";
import App from "./App";

initSentry();

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
