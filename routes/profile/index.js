const express = require('express');
const debug = require('debug')('router:profile');
const router = express.Router();

const History = require('../../models/history');

router.get('/', async (req, res) => {
    const latestGames = History.clearPrivateFields(await History.getLatestGames(req.user.id, 10));

    res.render('profile', {latestGames});
});

router.use('/updatepass', require('./updatepass'));
router.use('/cashout', require('./cashOut'));
router.use('/cashin', require('./cashIn'));
router.use('/updateAvatar', require('./updateAvatar'));
router.use('/notifications', require('./notifications'));

module.exports = router;