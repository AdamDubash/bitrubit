const express = require('express');
const router = express.Router();

const User = require('../models/user');

const usernameNotSettted = (req, res, next) => {
    if (req.user && !req.user.username) {
        next()
    }

    res.redirect('/');
}

router.get('/', usernameNotSettted, (req, res, next) => {
    res.render('setusername');
});

router.post('/', usernameNotSettted, async (req, res, next) => {
    const {username} = req.body;

    const sendResponse = (code, msg) => {
        return res.status(code).send(msg);
    }

    if(!username || username.length < 3 || username.length > 10) {
        return sendResponse(400, "Длина имени должна быть от 3х до 10 символов!")
    }

    const user = await User.findOne({username});

    if (user) {
        return sendResponse(400, "Это имя уже занято!")
    }

    try {
        await User.setUsername(req.user.id, username);
        return sendResponse(200, "Успешно!");
    } catch(e) {
        console.log(e);
        sendResponse(500, "Ошибка на стороне сервера")
    }
});

module.exports = router;