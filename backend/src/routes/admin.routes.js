const express = require('express');
const prisma = require('../prisma');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Apply Admin restriction to all routes in this file
router.use(authenticateToken, authorizeRoles('ADMIN'));

// GET all organizations (Donors and Recipients) for verification management
router.get('/organizations', async (req, res) => {
  try {
    const donors = await prisma.donor.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, created_at: true } },
      },
    });

    const recipients = await prisma.recipient.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, created_at: true } },
      },
    });

    return res.json({ donors, recipients });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch organizations' });
  }
});

// Verify or Unverify an Organization (Donor or Recipient)
router.patch('/verify-org', async (req, res) => {
  try {
    const { type, id, verified } = req.body; // type: 'donor' | 'recipient'

    if (!type || !id || verified === undefined) {
      return res
        .status(400)
        .json({ error: 'type, id, and verified state are required' });
    }

    let updatedOrg;
    const targetTable = type.toLowerCase() === 'donor' ? 'donors' : 'recipients';

    if (type.toLowerCase() === 'donor') {
      updatedOrg = await prisma.donor.update({
        where: { id },
        data: { verified: Boolean(verified) },
        include: { user: true },
      });
    } else {
      updatedOrg = await prisma.recipient.update({
        where: { id },
        data: { verified: Boolean(verified) },
        include: { user: true },
      });
    }

    // Record Audit Log
    await prisma.adminLog.create({
      data: {
        admin_id: req.user.id,
        action: verified ? 'VERIFIED_ORGANIZATION' : 'UNVERIFIED_ORGANIZATION',
        target_table: targetTable,
        target_id: id,
      },
    });

    // Notify User
    await prisma.notification.create({
      data: {
        user_id: updatedOrg.user_id,
        message: `Your organization ${updatedOrg.organization_name} has been ${
          verified ? 'verified by Admin!' : 'unverified by Admin.'
        }`,
      },
    });

    return res.json({
      message: `Organization ${verified ? 'verified' : 'unverified'} successfully`,
      organization: updatedOrg,
    });
  } catch (error) {
    console.error('Error verifying org:', error);
    return res.status(500).json({ error: 'Failed to update organization status' });
  }
});

// GET Analytics Data
router.get('/analytics', async (req, res) => {
  try {
    // 1. Total Food Saved in KG (Completed claims/picked_up items)
    const claimedListings = await prisma.foodListing.findMany({
      where: { status: { in: ['CLAIMED', 'PICKED_UP'] } },
    });

    let totalFoodSavedKg = 0;
    claimedListings.forEach((item) => {
      if (item.unit === 'kg') {
        totalFoodSavedKg += item.quantity;
      } else if (item.unit === 'servings') {
        totalFoodSavedKg += item.quantity * 0.4; // estimated 400g per serving
      } else {
        totalFoodSavedKg += item.quantity * 1.5;
      }
    });

    totalFoodSavedKg = Math.round(totalFoodSavedKg * 10) / 10;

    // 2. Total Meals Distributed (approx 2.5 meals per kg)
    const totalMealsDistributed = Math.round(totalFoodSavedKg * 2.5);

    // 3. Counts
    const activeDonorsCount = await prisma.donor.count();
    const activeRecipientsCount = await prisma.recipient.count();
    const activeVolunteersCount = await prisma.volunteer.count();
    const totalListingsCount = await prisma.foodListing.count();
    const claimedCount = claimedListings.length;
    const expiredCount = await prisma.foodListing.count({
      where: { status: 'EXPIRED' },
    });

    // 4. Waste Reduction Trends (Monthly/Weekly mock aggregated trend data)
    const trendTimeline = [
      { month: 'Jan', foodSavedKg: 120, mealsServed: 300, CO2ReducedKg: 280 },
      { month: 'Feb', foodSavedKg: 250, mealsServed: 625, CO2ReducedKg: 580 },
      { month: 'Mar', foodSavedKg: 410, mealsServed: 1025, CO2ReducedKg: 950 },
      { month: 'Apr', foodSavedKg: 680, mealsServed: 1700, CO2ReducedKg: 1560 },
      { month: 'May', foodSavedKg: 950, mealsServed: 2375, CO2ReducedKg: 2180 },
      { month: 'Jun', foodSavedKg: totalFoodSavedKg, mealsServed: totalMealsDistributed, CO2ReducedKg: Math.round(totalFoodSavedKg * 2.3) },
    ];

    // 5. Category Breakdown
    const categoryCounts = await prisma.foodListing.groupBy({
      by: ['category'],
      _count: { id: true },
    });

    // 6. Top Donors
    const topDonors = await prisma.donor.findMany({
      take: 5,
      include: {
        user: { select: { name: true } },
        food_listings: { select: { quantity: true, unit: true, status: true } },
      },
    });

    const topDonorsFormatted = topDonors.map((d) => {
      const totalQty = d.food_listings.reduce((sum, item) => sum + item.quantity, 0);
      return {
        id: d.id,
        name: d.organization_name,
        type: d.donor_type,
        listingsCount: d.food_listings.length,
        totalQuantity: Math.round(totalQty * 10) / 10,
      };
    });

    return res.json({
      summary: {
        totalFoodSavedKg,
        totalMealsDistributed,
        CO2ReducedKg: Math.round(totalFoodSavedKg * 2.3),
        activeDonorsCount,
        activeRecipientsCount,
        activeVolunteersCount,
        totalListingsCount,
        claimedCount,
        expiredCount,
      },
      trendTimeline,
      categoryCounts,
      topDonors: topDonorsFormatted,
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return res.status(500).json({ error: 'Failed to calculate analytics' });
  }
});

// GET Admin Audit Logs
router.get('/logs', async (req, res) => {
  try {
    const logs = await prisma.adminLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: 50,
      include: {
        admin: { select: { name: true, email: true } },
      },
    });

    return res.json(logs);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch admin logs' });
  }
});

module.exports = router;
