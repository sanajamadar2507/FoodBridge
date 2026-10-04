import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import FoodCard from '../components/FoodCard';
import MapComponent from '../components/MapComponent';
import {
  Utensils,
  Heart,
  Truck,
  ShieldCheck,
  TrendingUp,
  Award,
  Users,
  MapPin,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export default function LandingPage() {
  const [featuredListings, setFeaturedListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeatured();
  }, []);

  const fetchFeatured = async () => {
    try {
      const res = await api.get('/listings?status=AVAILABLE');
      setFeaturedListings(res.data.slice(0, 3));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Banner Section */}
      <section className="relative bg-gradient-to-br from-emerald-900 via-emerald-800 to-gray-900 text-white rounded-3xl overflow-hidden shadow-2xl p-8 sm:p-14 my-4">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#22c55e_1px,transparent_1px)] [background-size:16px_16px]"></div>
        
        <div className="relative max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 bg-emerald-700/60 border border-emerald-500/40 text-emerald-200 text-xs font-semibold px-4 py-1.5 rounded-full backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Zero Urban Food Waste Mission</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight">
            Bridging Surplus Food with <span className="text-emerald-400 underline decoration-emerald-500/50">Hunger Needs</span>
          </h1>

          <p className="text-emerald-100 text-lg sm:text-xl font-normal leading-relaxed">
            FoodBridge connects restaurants, hotels, grocery stores, and households with local NGOs, shelters, and community kitchens in real time to prevent food waste.
          </p>

          <div className="flex flex-wrap gap-4 pt-4">
            <Link
              to="/register"
              className="bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-extrabold px-7 py-3.5 rounded-2xl shadow-lg hover:shadow-emerald-500/25 transition flex items-center gap-2"
            >
              <span>Join FoodBridge</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/login"
              className="bg-white/10 hover:bg-white/20 text-white font-bold px-7 py-3.5 rounded-2xl backdrop-blur-sm border border-white/20 transition"
            >
              Partner Login
            </Link>
          </div>
        </div>
      </section>

      {/* Real-time Impact Metrics Banner */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-7xl mx-auto px-4">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-center">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <TrendingUp className="w-6 h-6" />
          </div>
          <p className="text-3xl font-extrabold text-gray-900">1,450+ kg</p>
          <p className="text-xs font-semibold text-gray-500 uppercase mt-1">Food Waste Saved</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-center">
          <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Utensils className="w-6 h-6" />
          </div>
          <p className="text-3xl font-extrabold text-gray-900">3,625</p>
          <p className="text-xs font-semibold text-gray-500 uppercase mt-1">Meals Distributed</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-center">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Users className="w-6 h-6" />
          </div>
          <p className="text-3xl font-extrabold text-gray-900">48</p>
          <p className="text-xs font-semibold text-gray-500 uppercase mt-1">Verified Partner NGOs</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-center">
          <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Award className="w-6 h-6" />
          </div>
          <p className="text-3xl font-extrabold text-gray-900">3.3 Tons</p>
          <p className="text-xs font-semibold text-gray-500 uppercase mt-1">CO₂ Emissions Prevented</p>
        </div>
      </section>

      {/* How FoodBridge Works */}
      <section className="max-w-7xl mx-auto px-4 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-3xl font-extrabold text-gray-900">How FoodBridge Works</h2>
          <p className="text-gray-600 text-sm">Four seamless steps from surplus food listing to recipient distribution.</p>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-3 relative">
            <div className="w-10 h-10 bg-emerald-600 text-white font-bold rounded-xl flex items-center justify-center text-lg">1</div>
            <h3 className="font-bold text-gray-900 text-base">Donor Posts Food</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Restaurants or households list surplus food with quantity, category (Veg/Non-Veg), expiry time, and pickup coordinates.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-3 relative">
            <div className="w-10 h-10 bg-emerald-600 text-white font-bold rounded-xl flex items-center justify-center text-lg">2</div>
            <h3 className="font-bold text-gray-900 text-base">Smart NGO Matching</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Recipients & NGOs get real-time alerts matching nearest and soon-to-expire listings.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-3 relative">
            <div className="w-10 h-10 bg-emerald-600 text-white font-bold rounded-xl flex items-center justify-center text-lg">3</div>
            <h3 className="font-bold text-gray-900 text-base">Volunteer Pickup</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Volunteers receive dispatch alerts, navigate route maps, and deliver food safely.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-3 relative">
            <div className="w-10 h-10 bg-emerald-600 text-white font-bold rounded-xl flex items-center justify-center text-lg">4</div>
            <h3 className="font-bold text-gray-900 text-base">Impact Analytics</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Admins and donors view verified impact metrics in kg saved and CO₂ reduction trends.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Available Food Feed Preview & Map */}
      <section className="max-w-7xl mx-auto px-4 space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900">Available Surplus Food Nearby</h2>
            <p className="text-xs text-gray-500">Live feed of fresh food donations ready for collection</p>
          </div>
          <Link to="/recipient-dashboard" className="text-emerald-600 font-semibold text-sm hover:underline">
            View All Available Listings &rarr;
          </Link>
        </div>

        {loading ? (
          <div className="py-12 text-center text-gray-500 text-sm">Loading live food listings...</div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 grid sm:grid-cols-2 gap-6">
              {featuredListings.map((item) => (
                <FoodCard key={item.id} listing={item} />
              ))}
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-1">
                <MapPin className="w-4 h-4 text-emerald-600" /> Interactive Pickup Map
              </h4>
              <MapComponent listings={featuredListings} height="360px" />
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
