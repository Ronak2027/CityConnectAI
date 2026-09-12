import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Chatbot from './components/Chatbot';

import LandingPage from './pages/LandingPage';
import CitizenPortal from './pages/CitizenPortal';
import WorkerPortal from './pages/WorkerPortal';
import AdminDashboard from './pages/AdminDashboard';
import LoginPage from './pages/LoginPage';

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/citizen" element={<CitizenPortal />} />
                <Route path="/worker" element={<WorkerPortal />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/login" element={<LoginPage />} />
              </Routes>
            </main>
            <Footer />
            <Chatbot />
          </div>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}
