import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UtensilsCrossed, Building2, Heart, Truck, UserPlus } from 'lucide-react';

export default function RegisterPage() {
  const [role, setRole] = useState('DONOR');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    organization_name: '',
    donor_type: 'RESTAURANT',
    capacity: 50,
    registration_number: '',
    vehicle_type: 'CAR',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await register({ ...formData, role });
      if (user.role === 'DONOR') navigate('/donor-dashboard');
      else if (user.role === 'RECIPIENT') navigate('/recipient-dashboard');
      else if (user.role === 'VOLUNTEER') navigate('/volunteer-dashboard');
      else navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please verify details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center py-10 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center">
        <div className="inline-flex bg-emerald-600 text-white p-3 rounded-2xl shadow-lg mb-2">
          <UtensilsCrossed className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-extrabold text-gray-900">Join the FoodBridge Network</h2>
        <p className="mt-1 text-xs text-gray-600">Register your organization or volunteer profile</p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-8 px-6 shadow-sm border border-gray-100 sm:rounded-3xl sm:px-10 space-y-6">
          {/* Role Tabs */}
          <div className="grid grid-cols-3 gap-2 bg-gray-50 p-1.5 rounded-2xl border border-gray-200">
            <button
              type="button"
              onClick={() => setRole('DONOR')}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                role === 'DONOR'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Building2 className="w-4 h-4" /> Donor Org
            </button>

            <button
              type="button"
              onClick={() => setRole('RECIPIENT')}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                role === 'RECIPIENT'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Heart className="w-4 h-4" /> Recipient NGO
            </button>

            <button
              type="button"
              onClick={() => setRole('VOLUNTEER')}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                role === 'VOLUNTEER'
                  ? 'bg-white text-amber-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Truck className="w-4 h-4" /> Volunteer
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase">Contact Name *</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase">Email Address *</label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="contact@org.com"
                  className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase">Password *</label>
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase">Phone Number</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+1-555-0199"
                  className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase">Address / Location</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Street address, City, ZIP"
                className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            {/* Role specific input fields */}
            {role === 'DONOR' && (
              <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase">Organization Name</label>
                  <input
                    type="text"
                    name="organization_name"
                    value={formData.organization_name}
                    onChange={handleChange}
                    placeholder="e.g. Grand Hyatt Restaurant"
                    className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase">Donor Type</label>
                  <select
                    name="donor_type"
                    value={formData.donor_type}
                    onChange={handleChange}
                    className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm bg-white"
                  >
                    <option value="RESTAURANT">Restaurant / Hotel</option>
                    <option value="GROCERY">Grocery Store / Supermarket</option>
                    <option value="EVENT">Event Organizer</option>
                    <option value="HOUSEHOLD">Individual Household</option>
                  </select>
                </div>
              </div>
            )}

            {role === 'RECIPIENT' && (
              <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase">NGO / Shelter Name</label>
                  <input
                    type="text"
                    name="organization_name"
                    value={formData.organization_name}
                    onChange={handleChange}
                    placeholder="e.g. Hope Haven Foundation"
                    className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase">Daily Capacity (Meals Served)</label>
                  <input
                    type="number"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleChange}
                    placeholder="100"
                    className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm"
                  />
                </div>
              </div>
            )}

            {role === 'VOLUNTEER' && (
              <div className="pt-2 border-t border-gray-100">
                <label className="block text-xs font-bold text-gray-700 uppercase">Vehicle Type for Logistics</label>
                <select
                  name="vehicle_type"
                  value={formData.vehicle_type}
                  onChange={handleChange}
                  className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm bg-white"
                >
                  <option value="CAR">Car</option>
                  <option value="VAN">Delivery Van</option>
                  <option value="TRUCK">Truck</option>
                  <option value="MOTORCYCLE">Motorcycle</option>
                  <option value="BICYCLE">Bicycle</option>
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl shadow-md transition text-sm flex items-center justify-center gap-2 mt-4"
            >
              <UserPlus className="w-4 h-4" />
              <span>{loading ? 'Creating Account...' : 'Register Account'}</span>
            </button>
          </form>

          <div className="text-center pt-2">
            <span className="text-xs text-gray-500">Already registered? </span>
            <Link to="/login" className="text-xs font-bold text-emerald-600 hover:underline">
              Log in here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
