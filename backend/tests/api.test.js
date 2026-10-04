process.env.NODE_ENV = 'test';
const request = require('supertest');
const app = require('../src/server');
const prisma = require('../src/prisma');

describe('FoodBridge Backend REST API Integration Tests', () => {
  let donorToken = '';
  let recipientToken = '';
  let createdListingId = '';

  beforeAll(async () => {
    // Setup test environment database tables
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // 1. Health Check Test
  test('GET /api/health returns 200 OK', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toEqual('OK');
  });

  // 2. Auth - Donor Registration
  test('POST /api/auth/register creates a Donor account', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test Bistro',
      email: `bistro_${Date.now()}@test.com`,
      password: 'password123',
      role: 'DONOR',
      phone: '555-0100',
      address: '123 Test Street',
      organization_name: 'Test Bistro LLC',
      donor_type: 'RESTAURANT',
    });

    expect(res.statusCode).toEqual(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toEqual('DONOR');
    donorToken = res.body.token;
  });

  // 3. Auth - Recipient Registration
  test('POST /api/auth/register creates a Recipient account', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test Care Shelter',
      email: `shelter_${Date.now()}@test.com`,
      password: 'password123',
      role: 'RECIPIENT',
      phone: '555-0200',
      address: '456 Relief Road',
      organization_name: 'Care Shelter NGO',
      capacity: 100,
    });

    expect(res.statusCode).toEqual(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toEqual('RECIPIENT');
    recipientToken = res.body.token;
  });

  // 4. Food Listings - Public Retrieval
  test('GET /api/listings returns food listings array', async () => {
    const res = await request(app).get('/api/listings');
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  // 5. Food Listings - Authorized Donor Creation
  test('POST /api/listings allows Donor to create food listing', async () => {
    const expiry = new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString();
    const res = await request(app)
      .post('/api/listings')
      .set('Authorization', `Bearer ${donorToken}`)
      .send({
        food_type: 'Test Pasta Trays',
        category: 'COOKED',
        quantity: 20,
        unit: 'servings',
        expiry_time: expiry,
        pickup_location: '123 Test Street Dock',
        pickup_lat: 37.7749,
        pickup_lng: -122.4194,
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body.food_type).toEqual('Test Pasta Trays');
    expect(res.body.status).toEqual('AVAILABLE');
    createdListingId = res.body.id;
  });

  // 6. RBAC Protection Test
  test('POST /api/listings rejects Recipient role from creating listing', async () => {
    const res = await request(app)
      .post('/api/listings')
      .set('Authorization', `Bearer ${recipientToken}`)
      .send({
        food_type: 'Illegal Listing',
        quantity: 5,
        unit: 'kg',
      });

    expect(res.statusCode).toEqual(403);
  });

  // 7. Claim Workflow Test
  test('POST /api/claims allows Recipient to claim available listing', async () => {
    if (!createdListingId) return;

    const res = await request(app)
      .post('/api/claims')
      .set('Authorization', `Bearer ${recipientToken}`)
      .send({
        listing_id: createdListingId,
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body.claim).toBeDefined();
    expect(res.body.claim.listing_id).toEqual(createdListingId);
  });
});
