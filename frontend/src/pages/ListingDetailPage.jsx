import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import MapComponent from '../components/MapComponent';
import { Clock, MapPin, Building2, ShieldCheck, ArrowLeft, Heart, Phone, Mail } from 'lucide-react';

export default function ListingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchListing();
  }, [id]);

  const fetchListing = async () => {
    try {
      const res = await api.get(`/listings/${id}`);
      setListing(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async () => {
    try {
      await api.post('/claims', { listing_id: listing.id });
      alert('Claim successful! Check your Recipient Dashboard.');
      navigate('/recipient-dashboard');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to claim listing');
    }
  };

  if (loading) return <div className="py-16 text-center text-gray-500 text-sm">Loading food details...</div>;
  if (!listing) return <div className="py-16 text-center text-gray-500 text-sm">Listing not found.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <Link to="/" className="inline-flex items-center gap-1 text-xs font-semibold text-gray-600 hover:text-emerald-600">
        <ArrowLeft className="w-4 h-4" /> Back to listings
      </Link>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden grid md:grid-cols-2 gap-6 p-6 sm:p-8">
        <div className="space-y-4">
          <div className="relative h-64 rounded-2xl overflow-hidden bg-gray-100">
            <img
              src={listing.image_url || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80'}
              alt={listing.food_type}
              className="w-full h-full object-cover"
            />
            <span className="absolute top-3 left-3 bg-emerald-600 text-white font-bold text-xs px-3 py-1 rounded-xl">
              {listing.category}
            </span>
          </div>

          <MapComponent listings={[listing]} height="220px" />
        </div>

        <div className="space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                {listing.quantity} {listing.unit} Available
              </span>
              <h1 className="text-2xl font-extrabold text-gray-900 mt-2">{listing.food_type}</h1>
            </div>

            <div className="bg-gray-50 rounded-2xl p-4 space-y-2 text-xs border border-gray-100">
              <div className="flex items-center gap-2 text-gray-800 font-semibold">
                <Building2 className="w-4 h-4 text-emerald-600" />
                <span>{listing.donor?.organization_name}</span>
                {listing.donor?.verified && <ShieldCheck className="w-4 h-4 text-blue-600" title="Verified Donor" />}
              </div>

              <div className="flex items-start gap-2 text-gray-600">
                <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                <span>{listing.pickup_location}</span>
              </div>

              <div className="flex items-center gap-2 text-red-600 font-bold">
                <Clock className="w-4 h-4" />
                <span>Expires on: {new Date(listing.expiry_time).toLocaleString()}</span>
              </div>
            </div>

            {user && (
              <div className="bg-blue-50 rounded-2xl p-4 space-y-1 text-xs text-blue-900">
                <p className="font-bold">Donor Contact Information:</p>
                <p className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {listing.donor?.user?.phone || 'Provided upon claim'}</p>
                <p className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {listing.donor?.user?.email}</p>
              </div>
            )}
          </div>

          {user?.role === 'RECIPIENT' && listing.status === 'AVAILABLE' && (
            <button
              onClick={handleClaim}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3.5 rounded-2xl shadow-lg transition flex items-center justify-center gap-2 text-sm"
            >
              <Heart className="w-5 h-5" />
              <span>Claim Food Donation</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
