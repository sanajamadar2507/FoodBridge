import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, MapPin, Building2, AlertTriangle, ShieldCheck, Flame, Leaf, Package, ChefHat } from 'lucide-react';

export default function FoodCard({ listing, onClaim, isRecipient, userRole }) {
  const getCategoryBadge = (category) => {
    switch (category) {
      case 'VEG':
        return <span className="bg-green-100 text-green-800 text-xs px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1"><Leaf className="w-3 h-3" /> Vegetarian</span>;
      case 'NON_VEG':
        return <span className="bg-red-100 text-red-800 text-xs px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1"><Flame className="w-3 h-3" /> Non-Veg</span>;
      case 'PACKAGED':
        return <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1"><Package className="w-3 h-3" /> Packaged</span>;
      default:
        return <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1"><ChefHat className="w-3 h-3" /> Cooked Food</span>;
    }
  };

  const getUrgencyBadge = (hoursRemaining, isUrgent) => {
    if (hoursRemaining <= 0) {
      return <span className="bg-gray-200 text-gray-700 text-xs px-2.5 py-1 rounded-lg font-bold">Expired</span>;
    }
    if (isUrgent || hoursRemaining <= 4) {
      return (
        <span className="bg-red-500 text-white text-xs px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 animate-pulse">
          <AlertTriangle className="w-3.5 h-3.5" /> Expiring in {hoursRemaining}h (Urgent)
        </span>
      );
    }
    if (hoursRemaining <= 12) {
      return (
        <span className="bg-amber-500 text-white text-xs px-2.5 py-1 rounded-lg font-bold flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" /> Expiring in {hoursRemaining}h
        </span>
      );
    }
    return (
      <span className="bg-emerald-600 text-white text-xs px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1">
        <Clock className="w-3.5 h-3.5" /> Fresh ({hoursRemaining}h left)
      </span>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition overflow-hidden flex flex-col justify-between">
      <div>
        {/* Card Header Image */}
        <div className="relative h-44 bg-gray-100 overflow-hidden">
          <img
            src={listing.image_url || 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=600&q=80'}
            alt={listing.food_type}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
          />
          <div className="absolute top-3 left-3 flex items-center gap-2">
            {getCategoryBadge(listing.category)}
          </div>
          <div className="absolute top-3 right-3">
            {getUrgencyBadge(listing.hours_remaining, listing.is_urgent)}
          </div>
        </div>

        {/* Listing Main Details */}
        <div className="p-5">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-bold text-gray-900 line-clamp-1">{listing.food_type}</h3>
            <span className="bg-emerald-50 text-emerald-700 font-extrabold text-sm px-2.5 py-1 rounded-lg border border-emerald-200">
              {listing.quantity} {listing.unit}
            </span>
          </div>

          <div className="space-y-2 mt-3 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold text-gray-800 truncate">
                {listing.donor?.organization_name || listing.donor?.user?.name || 'Verified Donor'}
              </span>
              {listing.donor?.verified && (
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" title="Verified Organization" />
              )}
            </div>

            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
              <span className="line-clamp-1">{listing.pickup_location}</span>
            </div>

            {listing.distance_km !== undefined && listing.distance_km !== null && (
              <div className="inline-block bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded text-[11px] mt-1">
                📍 {listing.distance_km} km away
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Card Footer Actions */}
      <div className="px-5 pb-5 pt-2 border-t border-gray-50 flex items-center justify-between gap-3">
        <Link
          to={`/listings/${listing.id}`}
          className="text-xs font-semibold text-gray-600 hover:text-emerald-600 underline"
        >
          View Details
        </Link>

        {isRecipient && listing.status === 'AVAILABLE' && (
          <button
            onClick={() => onClaim && onClaim(listing)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm hover:shadow transition"
          >
            Claim Food
          </button>
        )}

        {!isRecipient && listing.status === 'AVAILABLE' && (
          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
            Available
          </span>
        )}

        {listing.status !== 'AVAILABLE' && (
          <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-lg uppercase">
            {listing.status}
          </span>
        )}
      </div>
    </div>
  );
}
