import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { CapsulexProvider } from 'capsulex-auth-sdk/react'

const apiKey = import.meta.env.VITE_CAPSULEX_API_KEY || 'demo_api_key'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <CapsulexProvider apiKey={apiKey} baseUrl="http://localhost:8000">
      <App />
    </CapsulexProvider>
  </React.StrictMode>,
)
