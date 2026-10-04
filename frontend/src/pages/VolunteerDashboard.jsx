import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import MapComponent from '../components/MapComponent';
import { Truck, MapPin, CheckCircle, Navigation, Clock, ShieldCheck, ArrowRight } from 'lucide-react';

export default function VolunteerDashboard() {
  const { user } = useAuth();
  const [pickups, setPickups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPickups();
  }, []);

  const fetchPickups = async () => {
    try {
      const res = await api.get('/pickups');
      setPickups(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (pickupId, newStatus) => {
    try {
      await api.patch(`/pickups/${pickupId}/status`, { status: newStatus });
      fetchPickups();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleSelfAssign = async (pickupId) => {
    try {
      await api.post('/pickups/assign', { pickup_id: pickupId });
      fetchPickups();
    } catch (err) {
      alert('Failed to assign pickup task');
    }
  };

  const activePickups = pickups.filter((p) => p.status !== 'DELIVERED');
  const completedPickups = pickups.filter((p) => p.status === 'DELIVERED');

  const listingsForMap = pickups
    .map((p) => p.claim?.listing)
    .filter(Boolean);

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-800 via-amber-700 to-amber-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold">
              Volunteer Logistics Dispatch
            </h1>
            <span className="bg-amber-400/30 text-amber-100 border border-amber-400/40 text-xs font-semibold px-2.5 py-0.5 rounded-full">
              🚗 {user?.volunteer?.vehicle_type || 'Vehicle'} Driver
            </span>
          </div>
          <p className="text-xs text-amber-100 mt-1">
            Pick up surplus food from donors and deliver directly to partner NGOs and shelters
          </p>
        </div>

        <div className="flex items-center gap-4 bg-amber-950/40 px-5 py-3 rounded-2xl border border-amber-600/30">
          <div>
            <p className="text-xs text-amber-200 uppercase font-bold">Deliveries Completed</p>
            <p className="text-2xl font-extrabold text-white">{completedPickups.length}</p>
          </div>
        </div>
      </div>

      {/* Logistics Route Map */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Navigation className="w-5 h-5 text-amber-600" /> Active Delivery Map
        </h3>
        <MapComponent listings={listingsForMap} height="360px" />
      </div>

      {/* Active Pickup Queue */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-900">Active Delivery Tasks ({activePickups.length})</h3>

        {loading ? (
          <div className="py-12 text-center text-gray-500 text-sm">Loading pickup queue...</div>
        ) : activePickups.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 text-gray-500 text-sm">
            No pending delivery tasks right now. Great job!
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-6">
            {activePickups.map((pickup) => {
              const listing = pickup.claim?.listing;
              const donor = listing?.donor;
              const recipient = pickup.claim?.recipient;

              return (
                <div key={pickup.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase bg-amber-100 text-amber-800 px-2.5 py-1 rounded-md">
                        {pickup.status}
                      </span>
                      <h4 className="text-lg font-extrabold text-gray-900 mt-2">{listing?.food_type}</h4>
                      <p className="text-xs font-semibold text-emerald-700">
                        {listing?.quantity} {listing?.unit}
                      </p>
                    </div>
                  </div>

                  {/* Pickup & Dropoff Route Details */}
                  <div className="bg-gray-50 rounded-2xl p-4 space-y-3 text-xs border border-gray-100">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-gray-900">PICKUP: {donor?.organization_name}</p>
                        <p className="text-gray-600">{listing?.pickup_location}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">Contact: {donor?.user?.name} ({donor?.user?.phone})</p>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-2 flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-gray-900">DELIVER TO: {recipient?.organization_name}</p>
                        <p className="text-gray-600">{recipient?.user?.address || 'NGO Center'}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">Contact: {recipient?.user?.name} ({recipient?.user?.phone})</p>
                      </div>
                    </div>
                  </div>

                  {/* Driver Action Buttons */}
                  <div className="flex items-center justify-between pt-2">
                    {!pickup.volunteer_id && (
                      <button
                        onClick={() => handleSelfAssign(pickup.id)}
                        className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 rounded-xl text-xs shadow transition"
                      >
                        Accept & Self-Assign Pickup
                      </button>
                    )}

                    {pickup.volunteer_id && pickup.status === 'ASSIGNED' && (
                      <button
                        onClick={() => handleStatusUpdate(pickup.id, 'IN_TRANSIT')}
                        className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 rounded-xl text-xs shadow transition flex items-center justify-center gap-2"
                      >
                        <Truck className="w-4 h-4" /> Start Transit (Picked Up)
                      </button>
                    )}

                    {pickup.volunteer_id && pickup.status === 'IN_TRANSIT' && (
                      <button
                        onClick={() => handleStatusUpdate(pickup.id, 'DELIVERED')}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs shadow transition flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" /> Mark Delivered & Complete
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
