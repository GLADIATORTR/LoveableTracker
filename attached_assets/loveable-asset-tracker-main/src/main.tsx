import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { GlobalSettingsProvider } from './contexts/GlobalSettingsContext'

createRoot(document.getElementById("root")!).render(
  <GlobalSettingsProvider>
    <App />
  </GlobalSettingsProvider>
);
