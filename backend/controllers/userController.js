const User = require('../models/User');

// GET /api/users/search?email=
const searchUsers = async (req, res, next) => {
  try {
    const { email } = req.query;
    if (!email || email.length < 3) {
      return res.status(400).json({ error: 'Provide at least 3 characters to search' });
    }

    const users = await User.find({
      email: { $regex: email, $options: 'i' },
      _id: { $ne: req.user._id },
    })
      .select('name email avatar')
      .limit(10);

    res.json({ users });
  } catch (error) {
    next(error);
  }
};

module.exports = { searchUsers };
