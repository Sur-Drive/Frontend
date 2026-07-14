import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import HomePage from './pages/HomePage'
import LandingPage from './pages/LandingPage'
import SplashScreen from './pages/SplashScreen'
import FeedPage from './pages/FeedPage'
import ReportPage from './pages/ReportPage'
import ProfilePage from './pages/ProfilePage'
import PlanRoutePage from './pages/PlanRoutePage'
import BottomNav from './components/BottomNav'
import './styles/index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
})

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
      {/* 
        FIXED STRUCTURE:
        - Single wrapper div with min-h-screen (allows content to grow)
        - pb-24 (padding-bottom) prevents BottomNav from covering content
        - BottomNav is fixed but content has space for it
      */}
      <div className="min-h-screen pb-24 bg-gray-50">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/feed" element={<FeedPage />} />
          <Route path="/report" element={<ReportPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/plan-route" element={<PlanRoutePage />} />
        </Routes>
      </div>

      {/* BottomNav fixed at bottom - pb-24 above ensures content isn't hidden */}
      {showNav && <BottomNav />}

      {/* Splash screen overlay */}
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
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}

export default App