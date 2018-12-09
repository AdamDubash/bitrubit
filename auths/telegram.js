const Strategy = require('passport-telegram-official');

const TOKEN =  require('../config').get('telegram:token');
const User = require('../models/user');

const strategy = new Strategy({
    botToken: TOKEN,
}, async (profile, cb) => {
    const user = await User.authTelegram(profile.id, profile.username);

    cb(null, user);
});

module.exports = strategy;