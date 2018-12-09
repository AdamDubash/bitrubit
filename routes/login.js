const express = require('express');
const router = express.Router();
const debug = require('debug')('router:login');
const qs = require('querystring');

const User = require('../models/user');
const passport = require('../auths/passport');
const Captcha = require('../libs/captcha');

// router.post('/', passport.authenticate('local', {
//      failureRedirect: '/login',
//      successRedirect: '/'
//     })
// );

router.post('/', async (req, res, next) => {
    const {captchaText, captchaId} = req.body;

    if(!await Captcha.compare(captchaId, captchaText)) {
        res.redirect('/login?s=' + qs.escape('Не корректно введена капча!'));
        Captcha.delete(captchaId);
        return;
    }

    Captcha.delete(captchaId);

    passport.authenticate('local', function(err, user, info) {
        if (err) return next(err); 

        if (!user) return res.redirect('/login?s=' + qs.escape('Неверная почта или пароль!')); 

        req.login(user, function(err) {
          if (err) return next(err);
          
          return res.redirect('/');
        });

      })(req, res, next);

      
})

router.get('/', (req, res) => {
    const s = req.query.s;

    res.render('login', {captcha: Captcha.generate(), msg: s});
});

router.get('/telegram', passport.authenticate('telegram'), (req, res) => {
    res.redirect('/');
});

router.get('/test', passport.isConfirmed, (req, res) => {
    console.log(req.isAuthenticated());
    console.log(req.cookies);
    console.log(req.user);
    console.log(req.session);
    res.send('hi');
});

module.exports = router;