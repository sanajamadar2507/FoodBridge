const express = require('express');
const prisma = require('../prisma');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Helper: Haversine Distance Formula in Kilometers
function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371; // Radius of Earth in KM
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// GET all food listings (with filtering & matching logic)
router.get('/', async (req, res) => {
  try {
    const {
      status,
      category,
      donor_id,
      search,
      sort, // 'urgency', 'distance', 'newest'
      lat,
      lng,
      max_distance, // in km
    } = req.query;

    const where = {};

    if (status) {
      where.status = status;
    } else {
      where.status = 'AVAILABLE';
    }

    if (category) {
      where.category = category;
    }

    if (donor_id) {
      where.donor_id = donor_id;
    }

    if (search) {
      where.OR = [
        { food_type: { contains: search } },
        { pickup_location: { contains: search } },
      ];
    }

    let orderBy = [{ expiry_time: 'asc' }]; // default: expiring soonest
    if (sort === 'newest') {
      orderBy = [{ created_at: 'desc' }];
    }

    let listings = await prisma.foodListing.findMany({
      where,
      orderBy,
      include: {
        donor: {
          include: {
            user: {
              select: { name: true, phone: true, email: true },
            },
          },
        },
        claims: {
          select: { id: true, status: true, recipient_id: true },
        },
      },
    });

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);

    // Compute distance if lat/lng available and annotate urgency score
    const now = new Date();
    listings = listings.map((item) => {
      const distance = calculateDistanceKm(
        userLat,
        userLng,
        item.pickup_lat,
        item.pickup_lng
      );
      const hoursToExpiry = (new Date(item.expiry_time) - now) / (1000 * 60 * 60);

      return {
        ...item,
        distance_km: distance,
        hours_remaining: Math.max(0, Math.round(hoursToExpiry * 10) / 10),
        is_urgent: hoursToExpiry <= 4,
      };
    });

    // Optional distance filter
    if (max_distance && userLat && userLng) {
      const maxDist = parseFloat(max_distance);
      listings = listings.filter(
        (item) => item.distance_km !== null && item.distance_km <= maxDist
      );
    }

    // Optional distance sort
    if (sort === 'distance' && userLat && userLng) {
      listings.sort((a, b) => (a.distance_km || 9999) - (b.distance_km || 9999));
    } else if (sort === 'urgency') {
      listings.sort((a, b) => a.hours_remaining - b.hours_remaining);
    }

    return res.json(listings);
  } catch (error) {
    console.error('Error fetching listings:', error);
    return res.status(500).json({ error: 'Failed to fetch food listings' });
  }
});

// GET single listing details
router.get('/:id', async (req, res) => {
  try {
    const listing = await prisma.foodListing.findUnique({
      where: { id: req.params.id },
      include: {
        donor: {
          include: {
            user: {
              select: { name: true, phone: true, email: true, address: true },
            },
          },
        },
        claims: {
          include: {
            recipient: {
              include: {
                user: { select: { name: true, phone: true, email: true } },
              },
            },
            pickup: {
              include: {
                volunteer: {
                  include: {
                    user: { select: { name: true, phone: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!listing) {
      return res.status(404).json({ error: 'Food listing not found' });
    }

    return res.json(listing);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch listing details' });
  }
});

// POST create food listing (Donor only)
router.post(
  '/',
  authenticateToken,
  authorizeRoles('DONOR', 'ADMIN'),
  async (req, res) => {
    try {
      const {
        food_type,
        category,
        quantity,
        unit,
        expiry_time,
        pickup_location,
        pickup_lat,
        pickup_lng,
        image_url,
      } = req.body;

      if (
        !food_type ||
        !quantity ||
        !unit ||
        !expiry_time ||
        !pickup_location ||
        pickup_lat === undefined ||
        pickup_lng === undefined
      ) {
        return res
          .status(400)
          .json({ error: 'Missing required food listing fields' });
      }

      // Ensure donor profile exists
      let donorId = req.user.donorId;
      if (!donorId && req.user.role === 'DONOR') {
        const donor = await prisma.donor.findUnique({
          where: { user_id: req.user.id },
        });
        if (donor) donorId = donor.id;
      }

      if (!donorId && req.user.role !== 'ADMIN') {
        return res
          .status(400)
          .json({ error: 'User does not have an active Donor profile' });
      }

      // Admin fallback to first donor if needed
      if (!donorId && req.user.role === 'ADMIN') {
        const firstDonor = await prisma.donor.findFirst();
        if (firstDonor) donorId = firstDonor.id;
        else return res.status(400).json({ error: 'No donor profile available' });
      }

      const listing = await prisma.foodListing.create({
        data: {
          donor_id: donorId,
          food_type,
          category: category || 'COOKED',
          quantity: parseFloat(quantity),
          unit,
          expiry_time: new Date(expiry_time),
          pickup_location,
          pickup_lat: parseFloat(pickup_lat),
          pickup_lng: parseFloat(pickup_lng),
          status: 'AVAILABLE',
          image_url: image_url || null,
        },
      });

      // Notify recipient NGOs about new surplus food listing
      const recipients = await prisma.recipient.findMany({ select: { user_id: true } });
      const notificationsData = recipients.map((rec) => ({
        user_id: rec.user_id,
        message: `New Surplus Food Available: ${listing.food_type} (${listing.quantity} ${listing.unit}) at ${listing.pickup_location}!`,
      }));

      if (notificationsData.length > 0) {
        await prisma.notification.createMany({ data: notificationsData });
      }

      return res.status(201).json(listing);
    } catch (error) {
      console.error('Error creating listing:', error);
      return res.status(500).json({ error: 'Failed to create food listing' });
    }
  }
);

// PUT update food listing (Donor / Admin)
router.put(
  '/:id',
  authenticateToken,
  authorizeRoles('DONOR', 'ADMIN'),
  async (req, res) => {
    try {
      const listing = await prisma.foodListing.findUnique({
        where: { id: req.params.id },
      });

      if (!listing) {
        return res.status(404).json({ error: 'Listing not found' });
      }

      if (req.user.role === 'DONOR' && listing.donor_id !== req.user.donorId) {
        return res
          .status(403)
          .json({ error: 'Unauthorized to modify this listing' });
      }

      const {
        food_type,
        category,
        quantity,
        unit,
        expiry_time,
        pickup_location,
        pickup_lat,
        pickup_lng,
        status,
        image_url,
      } = req.body;

      const updated = await prisma.foodListing.update({
        where: { id: req.params.id },
        data: {
          ...(food_type && { food_type }),
          ...(category && { category }),
          ...(quantity && { quantity: parseFloat(quantity) }),
          ...(unit && { unit }),
          ...(expiry_time && { expiry_time: new Date(expiry_time) }),
          ...(pickup_location && { pickup_location }),
          ...(pickup_lat !== undefined && { pickup_lat: parseFloat(pickup_lat) }),
          ...(pickup_lng !== undefined && { pickup_lng: parseFloat(pickup_lng) }),
          ...(status && { status }),
          ...(image_url !== undefined && { image_url }),
        },
      });

      return res.json(updated);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to update listing' });
    }
  }
);

// DELETE listing
router.delete(
  '/:id',
  authenticateToken,
  authorizeRoles('DONOR', 'ADMIN'),
  async (req, res) => {
    try {
      const listing = await prisma.foodListing.findUnique({
        where: { id: req.params.id },
      });

      if (!listing) {
        return res.status(404).json({ error: 'Listing not found' });
      }

      if (req.user.role === 'DONOR' && listing.donor_id !== req.user.donorId) {
        return res
          .status(403)
          .json({ error: 'Unauthorized to delete this listing' });
      }

      await prisma.foodListing.delete({ where: { id: req.params.id } });
      return res.json({ message: 'Food listing deleted successfully' });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to delete listing' });
    }
  }
);

module.exports = router;
