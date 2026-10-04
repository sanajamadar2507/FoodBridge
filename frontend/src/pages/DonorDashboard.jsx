import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import FoodCard from '../components/FoodCard';
import { Plus, Package, TrendingUp, Clock, CheckCircle2, X, Trash2, AlertCircle } from 'lucide-react';

export default function DonorDashboard() {
  const { user } = useAuth();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    food_type: '',
    category: 'COOKED',
    quantity: '',
    unit: 'servings',
    expiry_hours: '6',
    pickup_location: user?.address || '777 Grand Avenue, Bay Area',
    pickup_lat: 37.7885,
    pickup_lng: -122.4072,
    image_url: '',
  });

  const [activeTab, setActiveTab] = useState('ALL');

  useEffect(() => {
    fetchDonorListings();
  }, []);

  const fetchDonorListings = async () => {
    try {
      const res = await api.get(`/listings?donor_id=${user?.donor?.id || ''}&status=`);
      setListings(res.data);
    } catch (err) {
      console.error('Failed to fetch donor listings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateListing = async (e) => {
    e.preventDefault();
    try {
      const expiry_time = new Date(Date.now() + parseFloat(formData.expiry_hours) * 60 * 60 * 1000).toISOString();
      await api.post('/listings', {
        ...formData,
        expiry_time,
      });
      setShowModal(false);
      setFormData({
        food_type: '',
        category: 'COOKED',
        quantity: '',
        unit: 'servings',
        expiry_hours: '6',
        pickup_location: user?.address || '777 Grand Avenue, Bay Area',
        pickup_lat: 37.7885,
        pickup_lng: -122.4072,
        image_url: '',
      });
      fetchDonorListings();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create listing');
    }
  };

  const handleDeleteListing = async (id) => {
    if (!window.confirm('Are you sure you want to delete this food listing?')) return;
    try {
      await api.delete(`/listings/${id}`);
      fetchDonorListings();
    } catch (err) {
      alert('Failed to delete listing');
    }
  };

  const filteredListings = listings.filter((l) => {
    if (activeTab === 'AVAILABLE') return l.status === 'AVAILABLE';
    if (activeTab === 'CLAIMED') return l.status === 'CLAIMED' || l.status === 'PICKED_UP';
    return true;
  });

  const totalQuantity = listings.reduce((sum, l) => sum + (l.unit === 'kg' ? l.quantity : l.quantity * 0.4), 0);

  return (
    <div className="space-y-8 pb-12">
      {/* Header & Impact Bar */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
              {user?.donor?.organization_name || user?.name}'s Dashboard
            </h1>
            {user?.donor?.verified && (
              <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-300">
                ✓ Verified Donor
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">Manage surplus food donations and track your community impact</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-5 py-3 rounded-2xl shadow-md hover:shadow-lg transition flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          <span>Post Food Surplus</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center mb-2">
            <Package className="w-5 h-5" />
          </div>
          <p className="text-2xl font-extrabold text-gray-900">{listings.length}</p>
          <p className="text-xs font-semibold text-gray-500 uppercase mt-0.5">Total Listings Created</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center mb-2">
            <TrendingUp className="w-5 h-5" />
          </div>
          <p className="text-2xl font-extrabold text-gray-900">{Math.round(totalQuantity * 10) / 10} kg</p>
          <p className="text-xs font-semibold text-gray-500 uppercase mt-0.5">Food Saved from Waste</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="w-10 h-10 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center mb-2">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <p className="text-2xl font-extrabold text-gray-900">
            {listings.filter((l) => l.status === 'CLAIMED' || l.status === 'PICKED_UP').length}
          </p>
          <p className="text-xs font-semibold text-gray-500 uppercase mt-0.5">Claimed Food Items</p>
        </div>
      </div>

      {/* Listings Tabs & Grid */}
      <div className="space-y-4">
        <div className="flex border-b border-gray-200 gap-6 text-sm font-bold text-gray-500">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`pb-3 transition ${activeTab === 'ALL' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'hover:text-gray-900'}`}
          >
            All Listings ({listings.length})
          </button>
          <button
            onClick={() => setActiveTab('AVAILABLE')}
            className={`pb-3 transition ${activeTab === 'AVAILABLE' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'hover:text-gray-900'}`}
          >
            Active / Available ({listings.filter((l) => l.status === 'AVAILABLE').length})
          </button>
          <button
            onClick={() => setActiveTab('CLAIMED')}
            className={`pb-3 transition ${activeTab === 'CLAIMED' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'hover:text-gray-900'}`}
          >
            Claimed / Picked Up ({listings.filter((l) => l.status === 'CLAIMED' || l.status === 'PICKED_UP').length})
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-gray-500 text-sm">Loading your listings...</div>
        ) : filteredListings.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 text-gray-500 text-sm space-y-3">
            <AlertCircle className="w-8 h-8 text-gray-300 mx-auto" />
            <p>No listings found in this category.</p>
            <button
              onClick={() => setShowModal(true)}
              className="text-xs text-emerald-600 font-bold hover:underline"
            >
              Post a new surplus food item now
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredListings.map((item) => (
              <div key={item.id} className="relative group">
                <FoodCard listing={item} />
                <button
                  onClick={() => handleDeleteListing(item.id)}
                  className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white p-2 rounded-xl shadow opacity-0 group-hover:opacity-100 transition z-20"
                  title="Delete listing"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Listing Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6 relative my-8">
            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900">Post Surplus Food Donation</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateListing} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">Food Description / Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 50 Servings of Grilled Chicken & Rice"
                  value={formData.food_type}
                  onChange={(e) => setFormData({ ...formData, food_type: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 uppercase mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white"
                  >
                    <option value="COOKED">Cooked Food</option>
                    <option value="VEG">Vegetarian / Fresh Produce</option>
                    <option value="NON_VEG">Non-Vegetarian</option>
                    <option value="PACKAGED">Packaged / Bakery</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-gray-700 uppercase mb-1">Quantity *</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      placeholder="45"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 uppercase mb-1">Unit</label>
                    <select
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="w-full px-2 py-2.5 rounded-xl border border-gray-200 text-sm bg-white"
                    >
                      <option value="servings">servings</option>
                      <option value="kg">kg</option>
                      <option value="boxes">boxes</option>
                      <option value="meals">meals</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">Safe Consumption Window (Hours) *</label>
                <select
                  value={formData.expiry_hours}
                  onChange={(e) => setFormData({ ...formData, expiry_hours: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white"
                >
                  <option value="2">2 Hours (Urgent)</option>
                  <option value="4">4 Hours</option>
                  <option value="6">6 Hours</option>
                  <option value="12">12 Hours</option>
                  <option value="24">24 Hours (Next Day)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">Pickup Address / Instructions *</label>
                <input
                  type="text"
                  required
                  placeholder="Kitchen Loading Dock 2, 777 Grand Ave"
                  value={formData.pickup_location}
                  onChange={(e) => setFormData({ ...formData, pickup_location: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">Photo Image URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-1/2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow transition"
                >
                  Post Donation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
