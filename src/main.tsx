import "./i18n"
import "./lib/screenFit"
import "./lib/textSize"
import "./styles/index.css"

import React from "react"
import ReactDOM from "react-dom/client"

import App from "./App"

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
