const express = require('express');
const prisma = require('../prisma');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// GET pickups (Volunteer or Admin)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { role, volunteerId } = req.user;
    let where = {};

    if (role === 'VOLUNTEER') {
      where.OR = [
        { volunteer_id: volunteerId },
        { volunteer_id: null }, // unassigned pickups
      ];
    }

    const pickups = await prisma.pickup.findMany({
      where,
      include: {
        claim: {
          include: {
            listing: {
              include: {
                donor: {
                  include: {
                    user: { select: { name: true, phone: true, address: true } },
                  },
                },
              },
            },
            recipient: {
              include: {
                user: { select: { name: true, phone: true, address: true } },
              },
            },
          },
        },
        volunteer: {
          include: {
            user: { select: { name: true, phone: true } },
          },
        },
      },
    });

    return res.json(pickups);
  } catch (error) {
    console.error('Error fetching pickups:', error);
    return res.status(500).json({ error: 'Failed to fetch pickups' });
  }
});

// Self-assign pickup (Volunteer)
router.post(
  '/assign',
  authenticateToken,
  authorizeRoles('VOLUNTEER', 'ADMIN'),
  async (req, res) => {
    try {
      const { pickup_id } = req.body;
      let volunteerId = req.user.volunteerId;

      if (!volunteerId && req.user.role === 'VOLUNTEER') {
        const vol = await prisma.volunteer.findUnique({
          where: { user_id: req.user.id },
        });
        if (vol) volunteerId = vol.id;
      }

      if (!volunteerId) {
        return res
          .status(400)
          .json({ error: 'User is not registered as a Volunteer' });
      }

      const pickup = await prisma.pickup.findUnique({
        where: { id: pickup_id },
      });

      if (!pickup) {
        return res.status(404).json({ error: 'Pickup task not found' });
      }

      const updated = await prisma.pickup.update({
        where: { id: pickup_id },
        data: {
          volunteer_id: volunteerId,
          status: 'ASSIGNED',
        },
      });

      return res.json({ message: 'Pickup assigned successfully', pickup: updated });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to assign pickup' });
    }
  }
);

// Update pickup status (ASSIGNED -> IN_TRANSIT -> DELIVERED)
router.patch(
  '/:id/status',
  authenticateToken,
  authorizeRoles('VOLUNTEER', 'ADMIN'),
  async (req, res) => {
    try {
      const { status } = req.body; // 'IN_TRANSIT', 'DELIVERED'
      const validStatuses = ['ASSIGNED', 'IN_TRANSIT', 'DELIVERED'];

      if (!status || !validStatuses.includes(status.toUpperCase())) {
        return res.status(400).json({ error: 'Invalid pickup status' });
      }

      const normalizedStatus = status.toUpperCase();
      const pickup = await prisma.pickup.findUnique({
        where: { id: req.params.id },
        include: {
          claim: {
            include: {
              listing: true,
              recipient: { include: { user: true } },
            },
          },
        },
      });

      if (!pickup) {
        return res.status(404).json({ error: 'Pickup task not found' });
      }

      const updateData = { status: normalizedStatus };

      if (normalizedStatus === 'IN_TRANSIT') {
        updateData.pickup_time = new Date();
      } else if (normalizedStatus === 'DELIVERED') {
        updateData.delivery_time = new Date();
      }

      const updatedPickup = await prisma.pickup.update({
        where: { id: req.params.id },
        data: updateData,
      });

      if (normalizedStatus === 'DELIVERED') {
        // Mark listing as PICKED_UP / COMPLETED
        await prisma.foodListing.update({
          where: { id: pickup.claim.listing_id },
          data: { status: 'PICKED_UP' },
        });

        await prisma.claim.update({
          where: { id: pickup.claim_id },
          data: { status: 'COMPLETED' },
        });

        // Notify Recipient
        await prisma.notification.create({
          data: {
            user_id: pickup.claim.recipient.user_id,
            message: `Food delivery completed! "${pickup.claim.listing.food_type}" has been delivered by your volunteer.`,
          },
        });
      }

      return res.json(updatedPickup);
    } catch (error) {
      console.error('Error updating pickup status:', error);
      return res.status(500).json({ error: 'Failed to update pickup status' });
    }
  }
);

module.exports = router;
