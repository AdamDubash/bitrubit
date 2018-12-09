const router = require('express').Router();

router.get("/", (req, res, next) => {
   res.send('test');
});

router.use('/users', require('./users'));
router.use('/money', require('./money'));
router.use('/payments', require('./payments'));
router.use('/history', require('./history'));
router.use('/conf', require('./conf'));
router.use("/exchange", require("./exchange"))

module.exports = router;