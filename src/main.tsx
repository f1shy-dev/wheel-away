// import { scan } from "react-scan"; // must be imported before React and React DOM
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// scan({
//   enabled: true,
// });

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
