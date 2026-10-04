import axios from 'axios';
import { initialMockState } from './mockData';

// Clean API Configuration from Environment Variable without localhost hardcoding
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('foodbridge_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// --- Offline & Standalone Vercel Demo Fallback Store ---
// Ensures the public website remains fully interactive and functional 24/7 on Vercel
// even if the backend service is offline, sleeping, or not yet deployed.
const getMockStore = () => {
  const stored = localStorage.getItem('foodbridge_mock_db');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      // ignore parse error and reset
    }
  }
  localStorage.setItem('foodbridge_mock_db', JSON.stringify(initialMockState));
  return JSON.parse(JSON.stringify(initialMockState));
};

const saveMockStore = (store) => {
  localStorage.setItem('foodbridge_mock_db', JSON.stringify(store));
};

const handleMockFallback = (config) => {
  const method = (config.method || 'get').toLowerCase();
  const url = (config.url || '').replace(/^\/api/, '');
  const store = getMockStore();
  const token = localStorage.getItem('foodbridge_token');

  // Decode mock user from token if present
  let currentUser = null;
  if (token) {
    const userId = token.replace('mock_token_', '');
    currentUser = store.users.find((u) => u.id === userId) || store.users[1]; // default to donor1 if not found
  }

  // 1. Auth routes
  if (url === '/auth/login' && method === 'post') {
    const { email, password } = JSON.parse(config.data || '{}');
    const user = store.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (user && (password === 'password123' || password === 'test1234')) {
      const mockToken = `mock_token_${user.id}`;
      return {
        data: {
          token: mockToken,
          user,
        },
      };
    }
    throw { response: { status: 401, data: { error: 'Invalid credentials. Please try demo accounts.' } } };
  }

  if (url === '/auth/register' && method === 'post') {
    const payload = JSON.parse(config.data || '{}');
    const newUser = {
      id: `usr_${Date.now()}`,
      name: payload.name,
      email: payload.email,
      role: payload.role,
      phone: payload.phone || null,
      address: payload.address || null,
      donor: payload.role === 'DONOR' ? { id: `dnr_${Date.now()}`, organization_name: payload.organization_name || payload.name, verified: false } : undefined,
      recipient: payload.role === 'RECIPIENT' ? { id: `rec_${Date.now()}`, organization_name: payload.organization_name || payload.name, capacity: payload.capacity || 50, verified: false } : undefined,
      volunteer: payload.role === 'VOLUNTEER' ? { id: `vol_${Date.now()}`, vehicle_type: payload.vehicle_type || 'CAR', availability_status: 'AVAILABLE' } : undefined,
    };
    store.users.push(newUser);
    saveMockStore(store);
    return {
      data: {
        token: `mock_token_${newUser.id}`,
        user: newUser,
      },
    };
  }

  if (url === '/auth/me' && method === 'get') {
    if (currentUser) {
      return { data: currentUser };
    }
    throw { response: { status: 401, data: { error: 'Unauthorized' } } };
  }

  // 2. Listings routes
  if (url.startsWith('/listings') && method === 'get') {
    const urlObj = new URL('http://dummy.local' + url);
    const id = url.split('?')[0].replace('/listings/', '');
    
    if (id && id !== '/listings' && !id.includes('?')) {
      const item = store.listings.find((l) => l.id === id);
      if (item) return { data: item };
      throw { response: { status: 404, data: { error: 'Listing not found' } } };
    }

    const status = urlObj.searchParams.get('status');
    const category = urlObj.searchParams.get('category');
    const donorId = urlObj.searchParams.get('donor_id');

    let result = [...store.listings];
    if (status !== null && status !== '') {
      result = result.filter((l) => l.status === status);
    }
    if (category) {
      result = result.filter((l) => l.category === category);
    }
    if (donorId) {
      result = result.filter((l) => l.donor_id === donorId);
    }
    return { data: result };
  }

  if (url === '/listings' && method === 'post') {
    const payload = JSON.parse(config.data || '{}');
    const newListing = {
      id: `lst_${Date.now()}`,
      donor_id: currentUser?.donor?.id || 'dnr_1',
      donor: {
        id: currentUser?.donor?.id || 'dnr_1',
        organization_name: currentUser?.donor?.organization_name || currentUser?.name || 'Local Donor',
        donor_type: 'RESTAURANT',
        verified: true,
        user: { name: currentUser?.name || 'Donor', email: currentUser?.email || 'donor@test.com' },
      },
      food_type: payload.food_type,
      category: payload.category || 'COOKED',
      quantity: parseFloat(payload.quantity),
      unit: payload.unit || 'servings',
      expiry_time: payload.expiry_time || new Date(Date.now() + 6 * 3600000).toISOString(),
      pickup_location: payload.pickup_location,
      pickup_lat: parseFloat(payload.pickup_lat || 37.7885),
      pickup_lng: parseFloat(payload.pickup_lng || -122.4072),
      status: 'AVAILABLE',
      image_url: payload.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
      created_at: new Date().toISOString(),
      hours_remaining: Math.round(parseFloat(payload.expiry_hours || 6)),
      is_urgent: parseFloat(payload.expiry_hours || 6) <= 4,
      distance_km: 1.5,
    };
    store.listings.unshift(newListing);
    saveMockStore(store);
    return { data: newListing };
  }

  if (url.startsWith('/listings/') && method === 'delete') {
    const id = url.replace('/listings/', '');
    store.listings = store.listings.filter((l) => l.id !== id);
    saveMockStore(store);
    return { data: { message: 'Listing deleted successfully' } };
  }

  // 3. Claims routes
  if (url === '/claims' && method === 'get') {
    return { data: store.claims };
  }

  if (url === '/claims' && method === 'post') {
    const { listing_id } = JSON.parse(config.data || '{}');
    const targetListing = store.listings.find((l) => l.id === listing_id);
    if (targetListing) {
      targetListing.status = 'CLAIMED';
    }
    const newClaim = {
      id: `clm_${Date.now()}`,
      listing_id,
      recipient_id: currentUser?.recipient?.id || 'rec_1',
      claimed_at: new Date().toISOString(),
      status: 'CONFIRMED',
      listing: targetListing,
      pickup: {
        id: `pku_${Date.now()}`,
        status: 'ASSIGNED',
        volunteer_id: null,
      },
    };
    store.claims.unshift(newClaim);
    
    // Add to pickups
    store.pickups.unshift({
      id: newClaim.pickup.id,
      claim_id: newClaim.id,
      volunteer_id: null,
      status: 'ASSIGNED',
      claim: {
        recipient: {
          organization_name: currentUser?.recipient?.organization_name || 'Partner Shelter',
          user: { name: currentUser?.name || 'NGO Representative', phone: '+1-555-9876', address: 'Bay Area Shelter' },
        },
        listing: targetListing,
      },
    });

    saveMockStore(store);
    return { data: { claim: newClaim, message: 'Claim created successfully' } };
  }

  // 4. Pickups routes
  if (url === '/pickups' && method === 'get') {
    return { data: store.pickups };
  }

  if (url === '/pickups/assign' && method === 'post') {
    const { pickup_id } = JSON.parse(config.data || '{}');
    const pickup = store.pickups.find((p) => p.id === pickup_id);
    if (pickup) {
      pickup.volunteer_id = currentUser?.volunteer?.id || 'vol_1';
    }
    saveMockStore(store);
    return { data: { message: 'Pickup assigned successfully' } };
  }

  if (url.includes('/status') && method === 'patch') {
    const parts = url.split('/');
    const pickupId = parts[2];
    const { status } = JSON.parse(config.data || '{}');
    const pickup = store.pickups.find((p) => p.id === pickupId);
    if (pickup) {
      pickup.status = status;
      if (status === 'DELIVERED') {
        const claim = store.claims.find((c) => c.id === pickup.claim_id);
        if (claim) claim.status = 'COMPLETED';
      }
    }
    saveMockStore(store);
    return { data: pickup };
  }

  // 5. Admin routes
  if (url === '/admin/organizations' && method === 'get') {
    return {
      data: {
        donors: store.users.filter((u) => u.role === 'DONOR').map((u) => ({ id: u.donor?.id || u.id, organization_name: u.donor?.organization_name || u.name, donor_type: u.donor?.donor_type || 'RESTAURANT', verified: u.donor?.verified || false, user: u })),
        recipients: store.users.filter((u) => u.role === 'RECIPIENT').map((u) => ({ id: u.recipient?.id || u.id, organization_name: u.recipient?.organization_name || u.name, capacity: u.recipient?.capacity || 100, registration_number: u.recipient?.registration_number || 'NGO-2024-88412', verified: u.recipient?.verified || false, user: u })),
      },
    };
  }

  if (url === '/admin/verify-org' && method === 'patch') {
    const { id, verified } = JSON.parse(config.data || '{}');
    store.users.forEach((u) => {
      if (u.donor && u.donor.id === id) u.donor.verified = verified;
      if (u.recipient && u.recipient.id === id) u.recipient.verified = verified;
    });
    saveMockStore(store);
    return { data: { message: 'Organization verified status updated' } };
  }

  if (url === '/admin/logs' && method === 'get') {
    return { data: store.adminLogs };
  }

  if (url === '/admin/analytics' && method === 'get') {
    return {
      data: {
        summary: {
          totalFoodSavedKg: 1450.5,
          totalMealsDistributed: 3625,
          CO2ReducedKg: 3336,
          activeDonorsCount: 3,
          activeRecipientsCount: 2,
          activeVolunteersCount: 2,
          totalListingsCount: store.listings.length,
          claimedCount: store.listings.filter((l) => l.status === 'CLAIMED').length,
          expiredCount: 0,
        },
        trendTimeline: [
          { month: 'Jan', foodSavedKg: 120, mealsServed: 300, CO2ReducedKg: 280 },
          { month: 'Feb', foodSavedKg: 250, mealsServed: 625, CO2ReducedKg: 580 },
          { month: 'Mar', foodSavedKg: 410, mealsServed: 1025, CO2ReducedKg: 950 },
          { month: 'Apr', foodSavedKg: 680, mealsServed: 1700, CO2ReducedKg: 1560 },
          { month: 'May', foodSavedKg: 950, mealsServed: 2375, CO2ReducedKg: 2180 },
          { month: 'Jun', foodSavedKg: 1450, mealsServed: 3625, CO2ReducedKg: 3336 },
        ],
        categoryCounts: [
          { category: 'COOKED', _count: { id: 2 } },
          { category: 'NON_VEG', _count: { id: 1 } },
          { category: 'VEG', _count: { id: 1 } },
          { category: 'PACKAGED', _count: { id: 2 } },
        ],
        topDonors: [
          { id: 'dnr_1', name: 'Grand Hyatt Catering', type: 'RESTAURANT', listingsCount: 3, totalQuantity: 140 },
          { id: 'dnr_2', name: 'Fresh Mart Supermarket', type: 'GROCERY', listingsCount: 2, totalQuantity: 55 },
          { id: 'dnr_3', name: 'Jenkins Residence', type: 'HOUSEHOLD', listingsCount: 1, totalQuantity: 12 },
        ],
      },
    };
  }

  // 6. Notifications routes
  if (url === '/notifications' && method === 'get') {
    return { data: { notifications: store.notifications, unreadCount: store.notifications.filter((n) => !n.is_read).length } };
  }

  if (url.includes('/read-all') && method === 'patch') {
    store.notifications.forEach((n) => { n.is_read = true; });
    saveMockStore(store);
    return { data: { message: 'All notifications marked as read' } };
  }

  if (url.includes('/read') && method === 'patch') {
    const id = url.split('/')[2];
    const n = store.notifications.find((notif) => notif.id === id);
    if (n) n.is_read = true;
    saveMockStore(store);
    return { data: { message: 'Notification marked as read' } };
  }

  // Default fallback
  return { data: [] };
};

// Response interceptor: automatically triggers graceful fallback if network fails,
// server returns 404/500, or backend is unreachable (e.g. initial Vercel deploy).
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // If backend returned a clear 401/403 business response from an active server, propagate it
    if (error.response && [400, 401, 403].includes(error.response.status)) {
      // If it's a 401 on login and server sent it, propagate error
      if (error.config?.url?.includes('/auth/login') && error.response.data?.error) {
        return Promise.reject(error);
      }
    }

    // Check for offline / network error / Vercel 404 (endpoint not hosted) / connection refused
    const isNetworkOrNotFound =
      !error.response ||
      error.response.status === 404 ||
      error.response.status === 502 ||
      error.response.status === 503 ||
      error.code === 'ERR_NETWORK' ||
      error.code === 'ECONNABORTED';

    if (isNetworkOrNotFound && error.config) {
      try {
        const mockRes = handleMockFallback(error.config);
        return mockRes;
      } catch (mockErr) {
        return Promise.reject(mockErr);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
export { API_BASE_URL };
