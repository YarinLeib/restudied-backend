const jwt = require('jsonwebtoken');

const isAuthenticated = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(' ')[1];

    const payload = jwt.verify(token, process.env.JWT_SECRET);

    req.payload = payload;

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'jwt expired' });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'invalid token' });
    }

    return res.status(401).json({ message: 'token not provided or not valid' });
  }
};

module.exports = {
  isAuthenticated,
};
