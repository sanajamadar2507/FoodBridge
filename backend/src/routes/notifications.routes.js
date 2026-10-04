const express = require('express');
const prisma = require('../prisma');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

// GET notifications
router.get('/', async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { user_id: req.user.id },
      orderBy: { created_at: 'desc' },
      take: 30,
    });

    const unreadCount = await prisma.notification.count({
      where: { user_id: req.user.id, is_read: false },
    });

    return res.json({ notifications, unreadCount });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark single notification as read
router.patch('/:id/read', async (req, res) => {
  try {
    const notification = await prisma.notification.updateMany({
      where: { id: req.params.id, user_id: req.user.id },
      data: { is_read: true },
    });

    return res.json({ message: 'Notification marked as read' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update notification' });
  }
});

// Mark all notifications as read
router.patch('/read-all', async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { user_id: req.user.id, is_read: false },
      data: { is_read: true },
    });

    return res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update notifications' });
  }
});

module.exports = router;
