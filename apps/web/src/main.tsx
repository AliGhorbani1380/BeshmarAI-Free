import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AiStartupGate } from './AiStartupGate'
import { initializeBeshmarAIPwa } from './pwaUpdate'
import App from './App'

initializeBeshmarAIPwa()

createRoot(
  document.getElementById('root')!,
).render(
  <StrictMode>
    <AiStartupGate>
      <App />
    </AiStartupGate>
  </StrictMode>,
)
