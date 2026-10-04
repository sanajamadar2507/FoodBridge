import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DonorDashboard from './pages/DonorDashboard';
import RecipientDashboard from './pages/RecipientDashboard';
import VolunteerDashboard from './pages/VolunteerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ListingDetailPage from './pages/ListingDetailPage';
import { UtensilsCrossed } from 'lucide-react';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900 font-sans">
          <Navbar />

          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/donor-dashboard" element={<DonorDashboard />} />
              <Route path="/recipient-dashboard" element={<RecipientDashboard />} />
              <Route path="/volunteer-dashboard" element={<VolunteerDashboard />} />
              <Route path="/admin-dashboard" element={<AdminDashboard />} />
              <Route path="/listings/:id" element={<ListingDetailPage />} />
            </Routes>
          </main>

          <footer className="bg-white border-t border-gray-200 py-8 text-center text-xs text-gray-500">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center space-x-2 font-bold text-gray-800">
                <div className="bg-emerald-600 text-white p-1.5 rounded-lg">
                  <UtensilsCrossed className="w-4 h-4" />
                </div>
                <span>FoodBridge &copy; 2026</span>
              </div>
              <p>Urban Food Waste Redistribution System &bull; Connecting Donors, NGOs & Volunteers</p>
            </div>
          </footer>
        </div>
      </Router>
    </AuthProvider>
  );
}
