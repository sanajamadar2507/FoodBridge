const cron = require('node-cron');
const prisma = require('../prisma');

// Function to auto-expire past-due listings
async function autoExpireListings() {
  try {
    const now = new Date();

    const expiredListings = await prisma.foodListing.findMany({
      where: {
        status: 'AVAILABLE',
        expiry_time: { lt: now },
      },
      include: {
        donor: true,
      },
    });

    if (expiredListings.length === 0) return 0;

    const result = await prisma.foodListing.updateMany({
      where: {
        id: { in: expiredListings.map((l) => l.id) },
        status: 'AVAILABLE',
      },
      data: { status: 'EXPIRED' },
    });

    // Notify donors about expired listings
    const notifications = expiredListings.map((listing) => ({
      user_id: listing.donor.user_id,
      message: `Notice: Your food listing "${listing.food_type}" reached its expiry time and was automatically marked EXPIRED for food safety.`,
    }));

    await prisma.notification.createMany({ data: notifications });

    console.log(
      `[Cron Worker] Auto-expired ${result.count} food listing(s) past safe consumption window.`
    );
    return result.count;
  } catch (error) {
    console.error('[Cron Worker Error] Failed auto-expiring listings:', error);
    return 0;
  }
}

// Start scheduled job (runs every 1 minute)
function startCronJobs() {
  cron.schedule('* * * * *', async () => {
    await autoExpireListings();
  });
  console.log('[Cron Service] Food expiry background worker initialized (running every minute).');
}

module.exports = {
  autoExpireListings,
  startCronJobs,
};
