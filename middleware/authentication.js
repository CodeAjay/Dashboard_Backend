const jwt = require('jsonwebtoken');
const User = require('../models/user'); // Import the User model
const Student = require('../models/student'); // Import the User model

exports.authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Check if the Authorization header exists
  if (!authHeader) {
    return res.status(401).json({ message: 'No token provided' });
  }

  // The token is usually in the format 'Bearer <token>'
  const token = authHeader.split(' ')[1]; // Extract the token part after 'Bearer'

  if (!token) {
    return res.status(401).json({ message: 'Malformed token' });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log(decoded,"decoded")
    // Fetch full user details from the database
    const user = decoded.role=="student"?await Student.findById(decoded.id):await User.findById(decoded.id);
    console.log(user, "user")
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Attach the full user details to the request object
    req.user = user;

    next(); // Proceed to the next middleware or route handler
  } catch (err) {
    console.error('Error verifying token:', err);
    return res.status(401).json({ message: 'Invalid token' });
  }
};


// Role verification middleware
exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }
    next();
  };
};
