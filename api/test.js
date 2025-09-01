module.exports = async function handler(req, res) {
    res.json({
        message: 'Simple test endpoint working!',
        method: req.method,
        timestamp: new Date().toISOString()
    });
};
