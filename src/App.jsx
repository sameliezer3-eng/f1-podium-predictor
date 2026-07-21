import { Route, Routes } from 'react-router-dom'
import NavBar from './components/layout/NavBar'
import FirebaseSetupNotice from './components/layout/FirebaseSetupNotice'
import HomePage from './pages/HomePage'
import RacePage from './pages/RacePage'
import ScoreboardPage from './pages/ScoreboardPage'
import AdminPage from './pages/AdminPage'

export default function App() {
  return (
    <div className="min-h-screen">
      <FirebaseSetupNotice />
      <NavBar />
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/race/:raceId" element={<RacePage />} />
          <Route path="/scoreboard" element={<ScoreboardPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </main>
    </div>
  )
}
