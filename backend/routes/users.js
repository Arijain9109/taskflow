const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// @GET /api/users/search?email= - Search user by email (for adding to project)
router.get('/search', protect, async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ message: 'Email query is required' });

    const user = await User.findOne({ email: { $regex: email, $options: 'i' } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ _id: user._id, name: user.name, email: user.email });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
