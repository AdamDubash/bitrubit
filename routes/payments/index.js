const router = require('express').Router();

router.use('/btc-ipn', require('./btc-ipn'));
router.use('/qiwi-webhook', require('./qiwi-webhook'));

module.exports = router;
