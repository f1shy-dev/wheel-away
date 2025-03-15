// import { scan } from "react-scan"; // must be imported before React and React DOM
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { Providers } from "./providers";
import "./App.css";

// scan({
//   enabled: true,
// });

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <Providers>
      <App />
    </Providers>
  </React.StrictMode>,
);
