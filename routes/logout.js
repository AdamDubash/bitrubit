const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    req.logout();
    // res.locals.user = null;
    res.redirect('/');
});

module.exports = router;