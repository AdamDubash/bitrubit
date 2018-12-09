const express = require('express');
const router = express.Router();

const passport = require('../auths/passport');

/* GET home page. */
router.get('/',  function(req, res, next) {
    res.redirect('/games');
    // res.render('index', { title: 'Express' });
});

module.exports = router;