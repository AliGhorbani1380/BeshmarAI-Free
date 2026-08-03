import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AiStartupGate } from './AiStartupGate'
import { initializeBeshmarAIPwa } from './pwaUpdate'
import { initializeAppI18n } from './i18n'
import App from './App'

initializeBeshmarAIPwa()
initializeAppI18n()

createRoot(
  document.getElementById('root')!,
).render(
  <StrictMode>
    <AiStartupGate>
      <App />
    </AiStartupGate>
  </StrictMode>,
)
