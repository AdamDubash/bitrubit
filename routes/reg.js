const express = require('express');
const router = express.Router();
const User = require('../models/user');
const debug = require('debug')('router:reg');
const qs = require('querystring');
const validator = require('validator');

const Captcha = require('../libs/captcha');

router.get('/', (req, res) => {
    const s = req.query.s;

    res.render('reg', {captcha: Captcha.generate(), msg: s});
});

router.post('/', async (req, res, next) => {
    const {email, username, password, captchaId, captchaText} = req.body;

    const errorRedirect = msg => {
        return res.redirect('/reg?s=' + qs.escape(msg));
    };

    if(!await Captcha.compare(captchaId, captchaText)) {
        Captcha.delete(captchaId);
        return errorRedirect("Не корректно введена каптча!");
    }

    debug(email, username, password);
    /*add some validation methods!*/

    Captcha.delete(captchaId);

    //validation
    if(typeof email !== 'string' || !validator.isEmail(email))  {
        return errorRedirect("Не корректный email");
    }

    if(typeof password !== 'string' || !validator.isLength(password, {min: 5, max: 20}))  {
        return errorRedirect("Длина пароля должна быть от 5 до 20 символов");
    }

    if(typeof username !== 'string' || !validator.isLength(username, {min: 3, max: 10}))  {
        return errorRedirect("Длина имени пользователя должна быть от 3 до 10 символов");
    }

    const checkEmail = await User.findOne({'strategies.local.email': email});

    if(checkEmail) {
        return errorRedirect("Данный почтовый адрес уже используется в системе!");
    }

    const checkUsername = await User.findOne({username});

    if(checkUsername) {
        return errorRedirect("Данное имя пользователя уже занято!");
    }

    try{
        const user = await User.register(email, username, password);
        
        debug('registered local', user.username);
        debug('email code',user.id, user.strategies.local.code);

        //send email with code
        // mailservice.send(email, id, code);

        req.login(user, (err) => {
            if(err) return next(err);

            res.redirect('/');
        });
    } catch (e) {
        return next(e);
    }
});

module.exports = router;