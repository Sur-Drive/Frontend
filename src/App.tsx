


import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import HomePage from './pages/HomePage'
import LandingPage from './pages/LandingPage'
import SplashScreen from './pages/SplashScreen'
import FeedPage from './pages/FeedPage'
import ReportPage from './pages/ReportPage'
import ProfilePage from './pages/ProfilePage'
import BottomNav from './components/BottomNav'
import './styles/index.css'





function PlanRoutePage() {
  return (
    <div className="p-6 max-w-[430px] mx-auto pb-24">
      <h1 className="mb-4 text-2xl font-bold text-gray-900">Plan a Route</h1>
      <p className="text-gray-600">Route planning goes here.</p>
    </div>
  )
}

function AppRoutes() {
  const location = useLocation()
  const isAppRoute = location.pathname === '/home'

  const [showSplash, setShowSplash] = useState(isAppRoute)
  const [fadeOut, setFadeOut] = useState(false)

  useEffect(() => {
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
  }, [isAppRoute])

  const showNav = location.pathname !== '/'

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/feed" element={<FeedPage />} />
          <Route path="/report" element={<ReportPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/plan-route" element={<PlanRoutePage />} />
        </Routes>
      </div>

      {showNav && <BottomNav />}

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