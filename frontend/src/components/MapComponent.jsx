import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Fix Leaflet default icon paths in React Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const foodIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export default function MapComponent({ listings = [], height = "400px", onSelectListing }) {
  // Default center: Bay Area coordinates
  const defaultCenter = [37.7749, -122.4194];

  const validListings = listings.filter(
    (item) => item.pickup_lat !== undefined && item.pickup_lng !== undefined
  );

  const center = validListings.length > 0
    ? [validListings[0].pickup_lat, validListings[0].pickup_lng]
    : defaultCenter;

  return (
    <div style={{ height }} className="relative w-full rounded-2xl overflow-hidden shadow-sm border border-gray-200">
      <MapContainer center={center} zoom={12} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {validListings.map((item) => (
          <Marker
            key={item.id}
            position={[item.pickup_lat, item.pickup_lng]}
            icon={foodIcon}
          >
            <Popup>
              <div className="p-1 max-w-xs">
                <span className="text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                  {item.category}
                </span>
                <h4 className="font-bold text-gray-900 text-sm mt-1">{item.food_type}</h4>
                <p className="text-xs text-gray-600 mt-0.5">
                  <span className="font-semibold text-emerald-700">{item.quantity} {item.unit}</span> &bull; {item.donor?.organization_name || 'Donor'}
                </p>
                <p className="text-[11px] text-gray-500 mt-1 line-clamp-1">📍 {item.pickup_location}</p>
                {item.hours_remaining !== undefined && (
                  <p className="text-[11px] font-semibold text-red-600 mt-0.5">
                    ⏰ {item.hours_remaining} hours left
                  </p>
                )}
                {onSelectListing && item.status === 'AVAILABLE' && (
                  <button
                    onClick={() => onSelectListing(item)}
                    className="mt-2 w-full bg-emerald-600 text-white font-bold text-xs py-1 rounded shadow-sm hover:bg-emerald-700 transition"
                  >
                    Claim Food
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
