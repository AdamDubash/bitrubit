const router = require('express').Router();

const History = require('../../models/history');

router.get('/', async (req, res, next) => {
    const history = await History.find({});

    res.json({data: history})
});

module.exports = router;