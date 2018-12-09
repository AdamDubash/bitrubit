const Strategy = require('passport-local').Strategy;

const User = require('../models/user');

const strategy = new Strategy(async (username, password, cb) => {

    try{
        const user = await User.login(username, password);

        if(!user) {
            cb(null, false, { message: 'Неверный логин или пароль!'});
            return;
        }

        cb(null, user);

    } catch(e) {
        cb(e);
    }

});

module.exports = strategy;