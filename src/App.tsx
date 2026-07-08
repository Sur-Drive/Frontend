
import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import HomePage from './pages/HomePage'
import LandingPage from './pages/LandingPage'
import SplashScreen from './pages/SplashScreen'
import './styles/index.css'

function TripsPage() {
  return <div className="p-6 max-w-[430px] mx-auto pb-24">Trips page</div>
}

function DocumentsPage() {
  return <div className="p-6 max-w-[430px] mx-auto pb-24">Documents page</div>
}

function ProfilePage() {
  return <div className="p-6 max-w-[430px] mx-auto pb-24">Profile page</div>
}

function PlanRoutePage() {
  return <div className="p-6 max-w-[430px] mx-auto pb-24">Plan a route</div>
}

// ✅ Extracted into its own component so it can use useLocation
function AppRoutes() {
  const location = useLocation()
  const isAppRoute = location.pathname === '/app'

  const [showSplash, setShowSplash] = useState(isAppRoute)
  const [fadeOut, setFadeOut] = useState(false)

  useEffect(() => {
    // Only run splash timer on /app
    if (!isAppRoute) {
      setShowSplash(false)
      return
    }

    setShowSplash(true)
    setFadeOut(false)

    const fadeTimer = setTimeout(() => setFadeOut(true), 1600)
    const removeTimer = setTimeout(() => setShowSplash(false), 2100)

    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(removeTimer)
    }
  }, [isAppRoute]) // Re-run when route changes

  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/app" element={<HomePage />} />
        <Route path="/trips" element={<TripsPage />} />
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/plan-route" element={<PlanRoutePage />} />
      </Routes>

      {showSplash && (
        <div
          className={`fixed inset-0 z-50 transition-opacity duration-500 ease-out ${
            fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          <SplashScreen />
        </div>
      )}
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}

export default App