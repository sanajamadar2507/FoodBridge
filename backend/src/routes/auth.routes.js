const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../prisma');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// Register new user (Donor, Recipient, Volunteer, or Admin)
router.post('/register', async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      phone,
      address,
      // Donor specific fields
      organization_name,
      donor_type,
      // Recipient specific fields
      capacity,
      registration_number,
      // Volunteer specific fields
      vehicle_type,
    } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Name, email, password, and role are required' });
    }

    const validRoles = ['DONOR', 'RECIPIENT', 'VOLUNTEER', 'ADMIN'];
    if (!validRoles.includes(role.toUpperCase())) {
      return res.status(400).json({ error: 'Invalid role specified' });
    }

    const normalizedRole = role.toUpperCase();

    // Check existing email
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    // Transaction to create User and corresponding Profile
    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          password_hash,
          role: normalizedRole,
          phone: phone || null,
          address: address || null,
        },
      });

      if (normalizedRole === 'DONOR') {
        await tx.donor.create({
          data: {
            user_id: user.id,
            organization_name: organization_name || name,
            donor_type: donor_type || 'RESTAURANT',
            verified: false,
          },
        });
      } else if (normalizedRole === 'RECIPIENT') {
        await tx.recipient.create({
          data: {
            user_id: user.id,
            organization_name: organization_name || name,
            capacity: capacity ? parseInt(capacity) : 50,
            registration_number: registration_number || null,
            verified: false,
          },
        });
      } else if (normalizedRole === 'VOLUNTEER') {
        await tx.volunteer.create({
          data: {
            user_id: user.id,
            vehicle_type: vehicle_type || 'CAR',
            availability_status: 'AVAILABLE',
          },
        });
      }

      return user;
    });

    // Create welcome notification
    await prisma.notification.create({
      data: {
        user_id: newUser.id,
        message: `Welcome to FoodBridge, ${newUser.name}! Your ${normalizedRole} account has been created.`,
      },
    });

    const fullUser = await prisma.user.findUnique({
      where: { id: newUser.id },
      include: { donor: true, recipient: true, volunteer: true },
    });

    const token = jwt.sign({ userId: fullUser.id, role: fullUser.role }, JWT_SECRET, {
      expiresIn: '7d',
    });

    const { password_hash: _, ...userWithoutPassword } = fullUser;

    return res.status(201).json({
      message: 'User registered successfully',
      token,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Server error during registration' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { donor: true, recipient: true, volunteer: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: '7d',
    });

    const { password_hash: _, ...userWithoutPassword } = user;

    return res.json({
      message: 'Login successful',
      token,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Server error during login' });
  }
});

// Get Current User Profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { donor: true, recipient: true, volunteer: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { password_hash: _, ...userWithoutPassword } = user;
    return res.json(userWithoutPassword);
  } catch (error) {
    return res.status(500).json({ error: 'Server error fetching user profile' });
  }
});

module.exports = router;
