const express = require('express');
const debug = require('debug')('router:profile:updateAvatar');
const router = express.Router();
const fs = require('fs');

router.post('/', (req, res, next) => {
    const file = req.files.avatar;

    file.mv(`${__dirname}/../../public/avatars/${req.user.nid}.png`, (err) => {
        if(err) {
            return next(new Error("Can't upload file"));
        }

        res.redirect('/profile');
    });

});

module.exports = router;