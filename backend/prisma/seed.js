const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting FoodBridge database seeding...');

  // Clean existing data
  await prisma.notification.deleteMany({});
  await prisma.adminLog.deleteMany({});
  await prisma.feedback.deleteMany({});
  await prisma.pickup.deleteMany({});
  await prisma.claim.deleteMany({});
  await prisma.foodListing.deleteMany({});
  await prisma.volunteer.deleteMany({});
  await prisma.recipient.deleteMany({});
  await prisma.donor.deleteMany({});
  await prisma.user.deleteMany({});

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Create Admin User
  const adminUser = await prisma.user.create({
    data: {
      name: 'System Admin',
      email: 'admin@foodbridge.org',
      password_hash: passwordHash,
      role: 'ADMIN',
      phone: '+1-800-555-0199',
      address: '100 City Hall Plaza, Central City',
    },
  });

  // 2. Create Donors
  const donorUser1 = await prisma.user.create({
    data: {
      name: 'Grand Hyatt Hotel',
      email: 'grandhyatt@donor.com',
      password_hash: passwordHash,
      role: 'DONOR',
      phone: '+1-555-0123',
      address: '777 Grand Avenue, Bay Area',
    },
  });

  const donor1 = await prisma.donor.create({
    data: {
      user_id: donorUser1.id,
      organization_name: 'Grand Hyatt Catering',
      donor_type: 'RESTAURANT',
      verified: true,
    },
  });

  const donorUser2 = await prisma.user.create({
    data: {
      name: 'Fresh Mart Supermarket',
      email: 'freshmart@donor.com',
      password_hash: passwordHash,
      role: 'DONOR',
      phone: '+1-555-0456',
      address: '120 Market Street, Bay Area',
    },
  });

  const donor2 = await prisma.donor.create({
    data: {
      user_id: donorUser2.id,
      organization_name: 'Fresh Mart Grocery Chain',
      donor_type: 'GROCERY',
      verified: true,
    },
  });

  const donorUser3 = await prisma.user.create({
    data: {
      name: 'Sarah Jenkins (Household)',
      email: 'sarah@donor.com',
      password_hash: passwordHash,
      role: 'DONOR',
      phone: '+1-555-0789',
      address: '45 Oak Ridge Lane, Suburbia',
    },
  });

  const donor3 = await prisma.donor.create({
    data: {
      user_id: donorUser3.id,
      organization_name: 'Jenkins Residence',
      donor_type: 'HOUSEHOLD',
      verified: true,
    },
  });

  // 3. Create Recipients (NGO / Shelters)
  const recipientUser1 = await prisma.user.create({
    data: {
      name: 'Hope Haven Women & Children Shelter',
      email: 'hopehaven@ngo.org',
      password_hash: passwordHash,
      role: 'RECIPIENT',
      phone: '+1-555-9876',
      address: '350 Shelter Way, Bay Area',
    },
  });

  const recipient1 = await prisma.recipient.create({
    data: {
      user_id: recipientUser1.id,
      organization_name: 'Hope Haven Foundation',
      capacity: 120,
      verified: true,
      registration_number: 'NGO-2024-88412',
    },
  });

  const recipientUser2 = await prisma.user.create({
    data: {
      name: 'Community Food Kitchen',
      email: 'kitchen@ngo.org',
      password_hash: passwordHash,
      role: 'RECIPIENT',
      phone: '+1-555-5432',
      address: '88 Mission Street, Downtown',
    },
  });

  const recipient2 = await prisma.recipient.create({
    data: {
      user_id: recipientUser2.id,
      organization_name: 'Downtown Soup Kitchen',
      capacity: 250,
      verified: true,
      registration_number: 'NGO-2023-11029',
    },
  });

  // 4. Create Volunteers
  const volunteerUser1 = await prisma.user.create({
    data: {
      name: 'Alex Rivera (Express Van)',
      email: 'alex@volunteer.com',
      password_hash: passwordHash,
      role: 'VOLUNTEER',
      phone: '+1-555-3311',
      address: '15 Delivery Hub, Midtown',
    },
  });

  const volunteer1 = await prisma.volunteer.create({
    data: {
      user_id: volunteerUser1.id,
      availability_status: 'AVAILABLE',
      vehicle_type: 'VAN',
    },
  });

  const volunteerUser2 = await prisma.user.create({
    data: {
      name: 'Maria Santos',
      email: 'maria@volunteer.com',
      password_hash: passwordHash,
      role: 'VOLUNTEER',
      phone: '+1-555-7788',
      address: '99 Greenway Drive',
    },
  });

  const volunteer2 = await prisma.volunteer.create({
    data: {
      user_id: volunteerUser2.id,
      availability_status: 'AVAILABLE',
      vehicle_type: 'CAR',
    },
  });

  // 5. Create Food Listings
  const now = new Date();
  const hours = (h) => new Date(now.getTime() + h * 60 * 60 * 1000);

  const listing1 = await prisma.foodListing.create({
    data: {
      donor_id: donor1.id,
      food_type: 'Buffet Surplus: Grilled Chicken, Rice & Steamed Veggies',
      category: 'NON_VEG',
      quantity: 45.0,
      unit: 'servings',
      expiry_time: hours(3),
      pickup_location: 'Grand Hyatt Kitchen Rear Loading Dock B',
      pickup_lat: 37.7885,
      pickup_lng: -122.4072,
      status: 'AVAILABLE',
      image_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80',
    },
  });

  const listing2 = await prisma.foodListing.create({
    data: {
      donor_id: donor2.id,
      food_type: 'Fresh Organic Apples & Oranges (Excess Stock)',
      category: 'VEG',
      quantity: 25.0,
      unit: 'kg',
      expiry_time: hours(18),
      pickup_location: 'Fresh Mart Produce Department Counter 3',
      pickup_lat: 37.791,
      pickup_lng: -122.398,
      status: 'AVAILABLE',
      image_url: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=600&q=80',
    },
  });

  const listing3 = await prisma.foodListing.create({
    data: {
      donor_id: donor1.id,
      food_type: 'Assorted Fresh Bakery Items (Croissants, Muffins, Whole Wheat Bread)',
      category: 'PACKAGED',
      quantity: 60.0,
      unit: 'servings',
      expiry_time: hours(8),
      pickup_location: 'Grand Hyatt Bakery Front Counter',
      pickup_lat: 37.7885,
      pickup_lng: -122.4072,
      status: 'CLAIMED',
      image_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80',
    },
  });

  const listing4 = await prisma.foodListing.create({
    data: {
      donor_id: donor3.id,
      food_type: 'Homemade Vegetable Lasagna (Unopened Party Tray)',
      category: 'COOKED',
      quantity: 12.0,
      unit: 'servings',
      expiry_time: hours(5),
      pickup_location: '45 Oak Ridge Lane',
      pickup_lat: 37.775,
      pickup_lng: -122.418,
      status: 'AVAILABLE',
      image_url: 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?auto=format&fit=crop&w=600&q=80',
    },
  });

  const listing5 = await prisma.foodListing.create({
    data: {
      donor_id: donor1.id,
      food_type: 'Hot Gourmet Soup & Sandwich Trays (Banquet Surplus)',
      category: 'COOKED',
      quantity: 35.0,
      unit: 'servings',
      expiry_time: hours(4),
      pickup_location: 'Grand Hyatt Ballroom Service Entrance',
      pickup_lat: 37.7880,
      pickup_lng: -122.4065,
      status: 'CLAIMED',
      image_url: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=600&q=80',
    },
  });

  const listing6 = await prisma.foodListing.create({
    data: {
      donor_id: donor2.id,
      food_type: 'Packaged Dairy & Cheese Crate (Refrigerated)',
      category: 'PACKAGED',
      quantity: 30.0,
      unit: 'kg',
      expiry_time: hours(12),
      pickup_location: 'Fresh Mart Loading Bay 1',
      pickup_lat: 37.7915,
      pickup_lng: -122.3990,
      status: 'CLAIMED',
      image_url: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?auto=format&fit=crop&w=600&q=80',
    },
  });

  // 6. Create Claims & Pickups
  // Claim 1: Assigned to Alex Rivera (IN_TRANSIT)
  const claim1 = await prisma.claim.create({
    data: {
      listing_id: listing3.id,
      recipient_id: recipient1.id,
      status: 'CONFIRMED',
    },
  });
  const pickup1 = await prisma.pickup.create({
    data: {
      claim_id: claim1.id,
      volunteer_id: volunteer1.id,
      status: 'IN_TRANSIT',
      pickup_time: new Date(now.getTime() - 20 * 60 * 1000),
    },
  });

  // Claim 2: UNASSIGNED Pickup (ready for ANY volunteer to accept & self-assign)
  const claim2 = await prisma.claim.create({
    data: {
      listing_id: listing5.id,
      recipient_id: recipient2.id,
      status: 'CONFIRMED',
    },
  });
  const pickup2 = await prisma.pickup.create({
    data: {
      claim_id: claim2.id,
      volunteer_id: null, // UNASSIGNED OPEN TASK
      status: 'ASSIGNED',
    },
  });

  // Claim 3: Assigned to Maria Santos (ASSIGNED - Ready to Start Transit)
  const claim3 = await prisma.claim.create({
    data: {
      listing_id: listing6.id,
      recipient_id: recipient1.id,
      status: 'CONFIRMED',
    },
  });
  const pickup3 = await prisma.pickup.create({
    data: {
      claim_id: claim3.id,
      volunteer_id: volunteer2.id,
      status: 'ASSIGNED',
    },
  });

  // 7. Seed Notifications
  await prisma.notification.createMany({
    data: [
      {
        user_id: donorUser1.id,
        message: 'Your bakery listing was claimed by Hope Haven Foundation!',
      },
      {
        user_id: recipientUser1.id,
        message: 'Volunteer Alex Rivera is in transit delivering your food items.',
      },
      {
        user_id: volunteerUser1.id,
        message: 'Pickup assigned: Grand Hyatt Bakery -> Hope Haven Shelter.',
      },
      {
        user_id: volunteerUser2.id,
        message: 'New delivery assigned: Fresh Mart -> Hope Haven Shelter.',
      },
    ],
  });

  // 8. Seed Admin Log
  await prisma.adminLog.create({
    data: {
      admin_id: adminUser.id,
      action: 'VERIFIED_ORGANIZATION',
      target_table: 'recipients',
      target_id: recipient1.id,
    },
  });

  console.log('✅ Seeding completed successfully!');
  console.log('--------------------------------------------------');
  console.log('Demo Credentials:');
  console.log('Admin:       admin@foodbridge.org / password123');
  console.log('Donor 1:     grandhyatt@donor.com / password123');
  console.log('Donor 2:     freshmart@donor.com  / password123');
  console.log('Recipient:   hopehaven@ngo.org    / password123');
  console.log('Volunteer 1: alex@volunteer.com   / password123');
  console.log('Volunteer 2: maria@volunteer.com  / password123');
  console.log('--------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
