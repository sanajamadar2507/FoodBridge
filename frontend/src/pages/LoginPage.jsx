import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UtensilsCrossed, LogIn, Key, Sparkles, ShieldCheck, Heart, Truck, Building2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e?.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email, password);
      if (user.role === 'DONOR') navigate('/donor-dashboard');
      else if (user.role === 'RECIPIENT') navigate('/recipient-dashboard');
      else if (user.role === 'VOLUNTEER') navigate('/volunteer-dashboard');
      else if (user.role === 'ADMIN') navigate('/admin-dashboard');
      else navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const prefillDemo = (demoEmail, demoPassword = 'password123') => {
    setEmail(demoEmail);
    setPassword(demoPassword);
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex bg-emerald-600 text-white p-3 rounded-2xl shadow-lg mb-3">
          <UtensilsCrossed className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-extrabold text-gray-900">Sign in to FoodBridge</h2>
        <p className="mt-2 text-xs text-gray-600">Access your urban food waste redistribution portal</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm border border-gray-100 sm:rounded-3xl sm:px-10 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@organization.com"
                className="mt-1 w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1 w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl shadow-md transition text-sm flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            </button>
          </form>

          {/* One-Click Quick Demo Login Shortcuts */}
          <div className="pt-4 border-t border-gray-100 space-y-3">
            <div className="flex items-center gap-1 text-xs font-bold text-gray-500 uppercase">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>One-Click Demo Accounts</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => prefillDemo('grandhyatt@donor.com')}
                className="p-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl border border-emerald-200 text-left transition font-medium"
              >
                <div className="font-bold flex items-center gap-1">
                  <Building2 className="w-3 h-3" /> Donor (Hotel)
                </div>
                <div className="text-[10px] opacity-75">grandhyatt@donor.com</div>
              </button>

              <button
                type="button"
                onClick={() => prefillDemo('hopehaven@ngo.org')}
                className="p-2.5 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-xl border border-blue-200 text-left transition font-medium"
              >
                <div className="font-bold flex items-center gap-1">
                  <Heart className="w-3 h-3" /> Recipient NGO
                </div>
                <div className="text-[10px] opacity-75">hopehaven@ngo.org</div>
              </button>

              <button
                type="button"
                onClick={() => prefillDemo('alex@volunteer.com')}
                className="p-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl border border-amber-200 text-left transition font-medium"
              >
                <div className="font-bold flex items-center gap-1">
                  <Truck className="w-3 h-3" /> Volunteer
                </div>
                <div className="text-[10px] opacity-75">alex@volunteer.com</div>
              </button>

              <button
                type="button"
                onClick={() => prefillDemo('admin@foodbridge.org')}
                className="p-2.5 bg-purple-50 hover:bg-purple-100 text-purple-800 rounded-xl border border-purple-200 text-left transition font-medium"
              >
                <div className="font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Admin
                </div>
                <div className="text-[10px] opacity-75">admin@foodbridge.org</div>
              </button>
            </div>
          </div>

          <div className="text-center pt-2">
            <span className="text-xs text-gray-500">Don't have an account? </span>
            <Link to="/register" className="text-xs font-bold text-emerald-600 hover:underline">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
