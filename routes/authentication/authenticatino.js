const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../../models/user'); // Admin/Clerk model
const Student = require('../../models/student'); // Student model

// Login route
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    let user;
    let isMatch;

    // Check if the user is admin/clerk or student
    if (username.startsWith('admin') || username.startsWith('clerk')) {
      // Admin/Clerk: Use User model
      user = await User.findOne({ username });
      
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Use bcrypt for admin and clerk password comparison
      isMatch = await bcrypt.compare(password, user.password);
    } else {
      // Student: Use Student model
      user = await Student.findOne({ email: username });
      
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Compare plain text DOB (password) for students
      isMatch = password === user.DOB; // Assuming the DOB is stored as the plain text password
    }

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, role: user.role || 'student' }, // Default to 'student' role if not found
      process.env.JWT_SECRET, // Replace with your secret key
      { expiresIn: '5d' } // Token expires in 1 hour
    );

    // Send token and user info in response
    res.json({ token, user, role: user.role|| "student"});
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
