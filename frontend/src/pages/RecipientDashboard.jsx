import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import FoodCard from '../components/FoodCard';
import MapComponent from '../components/MapComponent';
import {
  Heart,
  Search,
  Filter,
  MapPin,
  Clock,
  LayoutGrid,
  Map as MapIcon,
  CheckCircle2,
  AlertTriangle,
  X,
  Truck,
} from 'lucide-react';

export default function RecipientDashboard() {
  const { user } = useAuth();
  const [listings, setListings] = useState([]);
  const [myClaims, setMyClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('BROWSE'); // 'BROWSE' | 'CLAIMS'
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('urgency');
  const [viewMode, setViewMode] = useState('GRID'); // 'GRID' | 'MAP'
  const [selectedClaimListing, setSelectedClaimListing] = useState(null);

  useEffect(() => {
    fetchAvailableListings();
    fetchMyClaims();
  }, [category, sort]);

  const fetchAvailableListings = async () => {
    try {
      const res = await api.get(
        `/listings?status=AVAILABLE&category=${category}&sort=${sort}&lat=37.7749&lng=-122.4194`
      );
      setListings(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyClaims = async () => {
    try {
      const res = await api.get('/claims');
      setMyClaims(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleClaimSubmit = async () => {
    if (!selectedClaimListing) return;
    try {
      await api.post('/claims', { listing_id: selectedClaimListing.id });
      alert(`Success! You have claimed "${selectedClaimListing.food_type}".`);
      setSelectedClaimListing(null);
      fetchAvailableListings();
      fetchMyClaims();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to claim food item');
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold">
              {user?.recipient?.organization_name || user?.name}'s Food Portal
            </h1>
            {user?.recipient?.verified && (
              <span className="bg-blue-400/30 text-blue-200 border border-blue-400/40 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                ✓ Verified NGO
              </span>
            )}
          </div>
          <p className="text-xs text-blue-200 mt-1">
            Browse available surplus food donations and match with nearby donors in real time
          </p>
        </div>

        <div className="flex bg-blue-950/60 p-1.5 rounded-2xl border border-blue-700/50 text-xs font-bold">
          <button
            onClick={() => setActiveTab('BROWSE')}
            className={`px-4 py-2 rounded-xl transition ${
              activeTab === 'BROWSE' ? 'bg-blue-600 text-white shadow' : 'text-blue-200 hover:text-white'
            }`}
          >
            Available Food ({listings.length})
          </button>
          <button
            onClick={() => setActiveTab('CLAIMS')}
            className={`px-4 py-2 rounded-xl transition ${
              activeTab === 'CLAIMS' ? 'bg-blue-600 text-white shadow' : 'text-blue-200 hover:text-white'
            }`}
          >
            My Claims ({myClaims.length})
          </button>
        </div>
      </div>

      {activeTab === 'BROWSE' ? (
        <>
          {/* Controls Bar: Filters & View Toggles */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
            {/* Category Chips */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
              <button
                onClick={() => setCategory('')}
                className={`px-3 py-1.5 rounded-xl border transition ${
                  category === '' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                All Categories
              </button>
              <button
                onClick={() => setCategory('COOKED')}
                className={`px-3 py-1.5 rounded-xl border transition ${
                  category === 'COOKED' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                Cooked Meals
              </button>
              <button
                onClick={() => setCategory('VEG')}
                className={`px-3 py-1.5 rounded-xl border transition ${
                  category === 'VEG' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                Vegetarian
              </button>
              <button
                onClick={() => setCategory('NON_VEG')}
                className={`px-3 py-1.5 rounded-xl border transition ${
                  category === 'NON_VEG' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                Non-Veg
              </button>
              <button
                onClick={() => setCategory('PACKAGED')}
                className={`px-3 py-1.5 rounded-xl border transition ${
                  category === 'PACKAGED' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                Packaged / Bakery
              </button>
            </div>

            {/* Sort & Grid/Map View Mode */}
            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-700 rounded-xl px-3 py-1.5 outline-none"
              >
                <option value="urgency">⏰ Expiring Soonest (Urgent)</option>
                <option value="distance">📍 Nearest Distance</option>
                <option value="newest">✨ Newly Posted</option>
              </select>

              <div className="flex bg-gray-100 p-1 rounded-xl">
                <button
                  onClick={() => setViewMode('GRID')}
                  className={`p-1.5 rounded-lg transition ${viewMode === 'GRID' ? 'bg-white shadow text-emerald-600' : 'text-gray-500'}`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('MAP')}
                  className={`p-1.5 rounded-lg transition ${viewMode === 'MAP' ? 'bg-white shadow text-emerald-600' : 'text-gray-500'}`}
                  title="Map View"
                >
                  <MapIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Main Listings Stream or Map View */}
          {loading ? (
            <div className="py-12 text-center text-gray-500 text-sm">Finding surplus food near you...</div>
          ) : viewMode === 'MAP' ? (
            <div className="space-y-4">
              <MapComponent listings={listings} height="520px" onSelectListing={(l) => setSelectedClaimListing(l)} />
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings.map((item) => (
                  <FoodCard key={item.id} listing={item} isRecipient={true} onClaim={(l) => setSelectedClaimListing(l)} />
                ))}
              </div>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((item) => (
                <FoodCard key={item.id} listing={item} isRecipient={true} onClaim={(l) => setSelectedClaimListing(l)} />
              ))}
            </div>
          )}
        </>
      ) : (
        /* My Claims List */
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h3 className="font-bold text-gray-900 text-lg">Your Active Food Claims</h3>

          {myClaims.length === 0 ? (
            <div className="py-8 text-center text-gray-500 text-sm">You haven't claimed any food listings yet.</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {myClaims.map((claim) => (
                <div key={claim.id} className="py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 text-base">{claim.listing?.food_type}</span>
                      <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded">
                        {claim.listing?.quantity} {claim.listing?.unit}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">
                      Donor: <span className="font-semibold text-gray-800">{claim.listing?.donor?.organization_name}</span> &bull; {claim.listing?.pickup_location}
                    </p>
                    <p className="text-[11px] text-gray-400">
                      Claimed on: {new Date(claim.claimed_at).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-xs font-bold px-3 py-1 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
                        {claim.status}
                      </span>
                      {claim.pickup && (
                        <p className="text-[11px] font-semibold text-amber-600 mt-1 flex items-center gap-1">
                          <Truck className="w-3 h-3" /> Delivery: {claim.pickup.status}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Claim Confirmation Modal */}
      {selectedClaimListing && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 relative">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Confirm Food Claim</h3>
              <button onClick={() => setSelectedClaimListing(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 space-y-1">
                <p className="font-bold text-sm text-emerald-900">{selectedClaimListing.food_type}</p>
                <p className="text-emerald-700 font-semibold">
                  Quantity: {selectedClaimListing.quantity} {selectedClaimListing.unit}
                </p>
                <p className="text-gray-600 mt-2">
                  📍 <span className="font-medium">{selectedClaimListing.pickup_location}</span>
                </p>
              </div>

              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-amber-800 space-y-1">
                <p className="font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Food Safety Window:
                </p>
                <p>This item expires in <span className="font-bold">{selectedClaimListing.hours_remaining} hours</span>. Please arrange collection promptly.</p>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setSelectedClaimListing(null)}
                className="w-1/2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl text-xs transition"
              >
                Cancel
              </button>
              <button
                onClick={handleClaimSubmit}
                className="w-1/2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow text-xs transition"
              >
                Confirm Claim
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
