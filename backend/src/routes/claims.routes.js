const express = require('express');
const prisma = require('../prisma');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// GET claims (role-aware filtering)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { role, recipientId, donorId } = req.user;
    let where = {};

    if (role === 'RECIPIENT') {
      where.recipient_id = recipientId;
    } else if (role === 'DONOR') {
      where.listing = { donor_id: donorId };
    }

    const claims = await prisma.claim.findMany({
      where,
      orderBy: { claimed_at: 'desc' },
      include: {
        listing: {
          include: {
            donor: {
              include: { user: { select: { name: true, phone: true, email: true } } },
            },
          },
        },
        recipient: {
          include: { user: { select: { name: true, phone: true, email: true } } },
        },
        pickup: {
          include: {
            volunteer: {
              include: { user: { select: { name: true, phone: true } } },
            },
          },
        },
      },
    });

    return res.json(claims);
  } catch (error) {
    console.error('Error fetching claims:', error);
    return res.status(500).json({ error: 'Failed to fetch claims' });
  }
});

// POST claim a food listing (Recipient only)
router.post(
  '/',
  authenticateToken,
  authorizeRoles('RECIPIENT', 'ADMIN'),
  async (req, res) => {
    try {
      const { listing_id } = req.body;

      if (!listing_id) {
        return res.status(400).json({ error: 'listing_id is required' });
      }

      let recipientId = req.user.recipientId;
      if (!recipientId && req.user.role === 'RECIPIENT') {
        const rec = await prisma.recipient.findUnique({
          where: { user_id: req.user.id },
        });
        if (rec) recipientId = rec.id;
      }

      if (!recipientId && req.user.role !== 'ADMIN') {
        return res
          .status(400)
          .json({ error: 'User profile is not registered as a Recipient/NGO' });
      }

      if (!recipientId && req.user.role === 'ADMIN') {
        const firstRec = await prisma.recipient.findFirst();
        if (firstRec) recipientId = firstRec.id;
        else return res.status(400).json({ error: 'No recipient profile available' });
      }

      // Check if listing exists and is AVAILABLE
      const listing = await prisma.foodListing.findUnique({
        where: { id: listing_id },
        include: { donor: { include: { user: true } } },
      });

      if (!listing) {
        return res.status(404).json({ error: 'Food listing not found' });
      }

      if (listing.status !== 'AVAILABLE') {
        return res.status(400).json({
          error: `Listing is not available for claiming (Current status: ${listing.status})`,
        });
      }

      if (new Date(listing.expiry_time) < new Date()) {
        await prisma.foodListing.update({
          where: { id: listing.id },
          data: { status: 'EXPIRED' },
        });
        return res.status(400).json({ error: 'This food listing has expired' });
      }

      // Transaction: create Claim, update Listing status to CLAIMED, create Pickup record
      const result = await prisma.$transaction(async (tx) => {
        const updatedListing = await tx.foodListing.update({
          where: { id: listing_id },
          data: { status: 'CLAIMED' },
        });

        const newClaim = await tx.claim.create({
          data: {
            listing_id,
            recipient_id: recipientId,
            status: 'CONFIRMED',
          },
        });

        // Automatically assign an available volunteer if one exists
        const availableVolunteer = await tx.volunteer.findFirst({
          where: { availability_status: 'AVAILABLE' },
        });

        const newPickup = await tx.pickup.create({
          data: {
            claim_id: newClaim.id,
            volunteer_id: availableVolunteer ? availableVolunteer.id : null,
            status: 'ASSIGNED',
          },
        });

        return { newClaim, updatedListing, newPickup, availableVolunteer };
      });

      // Send notifications to Donor and Recipient
      await prisma.notification.create({
        data: {
          user_id: listing.donor.user_id,
          message: `Your food listing "${listing.food_type}" was claimed! Recipient will pick it up soon.`,
        },
      });

      await prisma.notification.create({
        data: {
          user_id: req.user.id,
          message: `You successfully claimed "${listing.food_type}". Pickup coordinates: ${listing.pickup_location}.`,
        },
      });

      if (result.availableVolunteer) {
        await prisma.notification.create({
          data: {
            user_id: result.availableVolunteer.user_id,
            message: `New pickup assigned: ${listing.food_type} at ${listing.pickup_location}.`,
          },
        });
      }

      return res.status(201).json({
        message: 'Food listing claimed successfully',
        claim: result.newClaim,
        pickup: result.newPickup,
      });
    } catch (error) {
      console.error('Claim error:', error);
      return res.status(500).json({ error: 'Failed to claim food listing' });
    }
  }
);

// PATCH update claim status
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];

    if (!status || !validStatuses.includes(status.toUpperCase())) {
      return res.status(400).json({ error: 'Invalid claim status' });
    }

    const claim = await prisma.claim.findUnique({
      where: { id: req.params.id },
      include: { listing: true },
    });

    if (!claim) {
      return res.status(404).json({ error: 'Claim not found' });
    }

    const updatedClaim = await prisma.claim.update({
      where: { id: req.params.id },
      data: { status: status.toUpperCase() },
    });

    if (status.toUpperCase() === 'CANCELLED') {
      // Revert listing to AVAILABLE
      await prisma.foodListing.update({
        where: { id: claim.listing_id },
        data: { status: 'AVAILABLE' },
      });
    } else if (status.toUpperCase() === 'COMPLETED') {
      await prisma.foodListing.update({
        where: { id: claim.listing_id },
        data: { status: 'PICKED_UP' },
      });
    }

    return res.json(updatedClaim);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update claim status' });
  }
});

module.exports = router;
