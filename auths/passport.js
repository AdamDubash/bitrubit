const passport = require('passport');

const localStrategy = require('./local');
const telegramStrategy = require('./telegram');
const User = require('../models/user');

passport.use(localStrategy);
passport.use(telegramStrategy);

passport.serializeUser((user, cb) => {
    cb(null, user.id);
    console.log('serialized', user.id);
});

passport.deserializeUser(async (id, cb) => {
    const user = await User.findById(id);

    cb(null, user)
});


passport.isLoggined = (req, res, next) => {
    if(!req.isAuthenticated()) {
        return res.redirect('/login')
    }

    next();
}

passport.usernameSpecified = (req, res, next) => {
     if(!req.isAuthenticated() || !req.user) return next();
     if(!req.user.username && req.user.strategies.telegram.id) {
         return res.redirect('/setusername');
     }
     next();
}

passport.isConfirmed = (req, res, next) => {

    //На первое время убираем подтверждения!
    return passport.isLoggined(req, res, next);

    const confirmCheck = () => {
        if(!req.user.username) {
            res.redirect('/profile?code=username');
            return;
        }

        if(req.user.strategies.local.email != null && !req.user.strategies.local.confirmed) {
            res.redirect('/confirmemail');
            return;
        }

        next();
    }

    passport.isLoggined(req, res, confirmCheck)
};

passport.isAdmin = (req, res, next) => {
    const user = req.user;

    if(!user) return res.redirect('/login');

    if(user.isAdmin) {
        return next();
    } else {
        res.redirect('/login');
    }
};


module.exports = passport;