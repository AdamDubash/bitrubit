const express = require('express');
const router = express.Router();
const debug = require('debug')('router:confirmemail');

const passport = require('../auths/passport');
const User = require('../models/user');

router.get('/', passport.isLoggined, (req, res) => {

    if(!req.user.strategies.local.email) res.redirect('/');

    res.render('confirmemail', {email: req.user.strategies.local.email});
});

router.get('/:id/:code', async (req, res, next) => {
    const {id, code} = req.params;

    debug(id ,code);

    const result = await User.confirmEmail(id, code);
    
    if(!result) {
        next();
        return;
    }

    res.redirect('/');
});

module.exports = router;