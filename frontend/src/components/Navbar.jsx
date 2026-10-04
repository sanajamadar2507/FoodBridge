import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  UtensilsCrossed,
  Bell,
  User,
  LogOut,
  LayoutDashboard,
  Heart,
  Truck,
  ShieldCheck,
  CheckCheck,
} from 'lucide-react';

export default function Navbar() {
  const { user, logout, notifications, unreadCount, markAllNotificationsRead, markNotificationRead } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'DONOR':
        return <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-300">Donor</span>;
      case 'RECIPIENT':
        return <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-blue-300">Recipient NGO</span>;
      case 'VOLUNTEER':
        return <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-amber-300">Volunteer</span>;
      case 'ADMIN':
        return <span className="bg-purple-100 text-purple-800 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-purple-300">Admin</span>;
      default:
        return null;
    }
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="bg-emerald-600 text-white p-2 rounded-xl shadow-md">
                <UtensilsCrossed className="h-6 w-6" />
              </div>
              <span className="text-xl font-bold tracking-tight text-gray-900">
                Food<span className="text-emerald-600">Bridge</span>
              </span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/" className="text-gray-600 hover:text-emerald-600 font-medium transition">
              Home
            </Link>

            {user?.role === 'DONOR' && (
              <Link to="/donor-dashboard" className="flex items-center space-x-1 text-gray-700 hover:text-emerald-600 font-medium">
                <LayoutDashboard className="w-4 h-4" />
                <span>Donor Dashboard</span>
              </Link>
            )}

            {user?.role === 'RECIPIENT' && (
              <Link to="/recipient-dashboard" className="flex items-center space-x-1 text-gray-700 hover:text-emerald-600 font-medium">
                <Heart className="w-4 h-4" />
                <span>Browse Food</span>
              </Link>
            )}

            {user?.role === 'VOLUNTEER' && (
              <Link to="/volunteer-dashboard" className="flex items-center space-x-1 text-gray-700 hover:text-emerald-600 font-medium">
                <Truck className="w-4 h-4" />
                <span>Deliveries Queue</span>
              </Link>
            )}

            {user?.role === 'ADMIN' && (
              <Link to="/admin-dashboard" className="flex items-center space-x-1 text-purple-700 hover:text-purple-900 font-medium">
                <ShieldCheck className="w-4 h-4" />
                <span>Admin Panel</span>
              </Link>
            )}
          </div>

          {/* Right Action Icons & User Dropdown */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {/* Notifications Bell */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-2 text-gray-600 hover:text-emerald-600 hover:bg-gray-100 rounded-full relative transition"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 bg-red-500 text-white text-xs font-bold w-4 h-4 flex items-center justify-center rounded-full animate-pulse">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notifications Drawer Dropdown */}
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                      <div className="p-3 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                        <span className="font-semibold text-gray-800 text-sm">Notifications ({notifications.length})</span>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllNotificationsRead}
                            className="text-xs text-emerald-600 hover:underline flex items-center gap-1 font-medium"
                          >
                            <CheckCheck className="w-3 h-3" /> Mark all read
                          </button>
                        )}
                      </div>
                      <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
                        {notifications.length === 0 ? (
                          <div className="p-4 text-center text-gray-500 text-sm">No notifications yet</div>
                        ) : (
                          notifications.map((n) => (
                            <div
                              key={n.id}
                              onClick={() => markNotificationRead(n.id)}
                              className={`p-3 text-xs cursor-pointer hover:bg-gray-50 transition ${
                                !n.is_read ? 'bg-emerald-50/60 font-medium' : 'text-gray-600'
                              }`}
                            >
                              <p className="text-gray-800">{n.message}</p>
                              <span className="text-[10px] text-gray-400 mt-1 block">
                                {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile Pill */}
                <div className="relative">
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center space-x-2 bg-gray-50 hover:bg-gray-100 p-1.5 pl-3 rounded-full border border-gray-200 transition"
                  >
                    <span className="text-sm font-semibold text-gray-700">{user.name}</span>
                    {getRoleBadge(user.role)}
                    <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-sm font-bold shadow-sm">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  </button>

                  {/* Profile Dropdown */}
                  {showProfileMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-xs font-medium text-gray-500">Signed in as</p>
                        <p className="text-xs font-bold text-gray-900 truncate">{user.email}</p>
                      </div>

                      {user.role === 'DONOR' && (
                        <Link to="/donor-dashboard" className="block px-4 py-2 text-xs text-gray-700 hover:bg-emerald-50">
                          Donor Dashboard
                        </Link>
                      )}
                      {user.role === 'RECIPIENT' && (
                        <Link to="/recipient-dashboard" className="block px-4 py-2 text-xs text-gray-700 hover:bg-emerald-50">
                          Recipient Dashboard
                        </Link>
                      )}
                      {user.role === 'VOLUNTEER' && (
                        <Link to="/volunteer-dashboard" className="block px-4 py-2 text-xs text-gray-700 hover:bg-emerald-50">
                          Volunteer Dashboard
                        </Link>
                      )}
                      {user.role === 'ADMIN' && (
                        <Link to="/admin-dashboard" className="block px-4 py-2 text-xs text-gray-700 hover:bg-purple-50">
                          Admin Dashboard
                        </Link>
                      )}

                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-1 border-t border-gray-100 mt-1"
                      >
                        <LogOut className="w-3.5 h-3.5" /> Sign out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-emerald-600 text-sm font-semibold px-3 py-2 transition"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-md transition"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
