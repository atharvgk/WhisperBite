import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import ErrorBoundary from './components/shared/ErrorBoundary';
import Navbar from './components/shared/Navbar';
import ProtectedRoute from './components/shared/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import BookingPage from './pages/BookingPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminPage from './pages/AdminPage';
import './styles/globals.css';

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Navbar />
            <main>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/book" element={<BookingPage />} />
                <Route path="/admin/login" element={<AdminLoginPage />} />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute>
                      <AdminPage />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </main>
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.85rem',
                },
                duration: 3000,
              }}
            />
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
