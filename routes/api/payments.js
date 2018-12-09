const router = require('express').Router();

const Payment = require('../../models/payment');

router.get('/', async (req, res, next) => {
    const payments = await Payment.find({});

    res.json({data: payments})
});

module.exports = router;