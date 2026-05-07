import React from 'react'
import ReactDOM from 'react-dom/client'
import { SkillManagerPage } from './pages/SkillManagerPage'
import { PreferencesProvider } from './skill-manager/preferences'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PreferencesProvider>
      <SkillManagerPage />
    </PreferencesProvider>
  </React.StrictMode>,
)
