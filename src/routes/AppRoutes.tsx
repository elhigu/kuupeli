import { Navigate, Route, Routes } from 'react-router-dom'
import { ModelsPage } from './ModelsPage'
import { PlayPage } from './PlayPage'
import { StoriesPage } from './StoriesPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/play" element={<PlayPage />} />
      <Route path="/stories" element={<StoriesPage />} />
      <Route path="/models" element={<ModelsPage />} />
      <Route path="/" element={<Navigate to="/play" replace />} />
      <Route path="*" element={<Navigate to="/play" replace />} />
    </Routes>
  )
}
