const express = require('express');
const readBalance = require('../utils/readBalance');
const router = express.Router();

// GET /api/stats
router.get('/', async (req, res, next) => {
    try {
        const response = await readBalance(req.query.userAddress);
        return res.json(response);
    } catch (err) {
        next(err);
    }
});

module.exports = router;