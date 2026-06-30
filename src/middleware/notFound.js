// src/middleware/notFound.js
const notFound = (req, res, next) => {
    // Skip static file requests - let express.static handle them
    if (req.path.startsWith('/uploads')) {
        return next();
    }
    
    res.status(404).json({
        success: false,
        error: `Route not found - ${req.originalUrl}`
    });
};

module.exports = notFound;