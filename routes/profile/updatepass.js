const express = require('express');
const debug = require('debug')('router:profile/updatepass');
const router = express.Router();

const User = require('../../models/user');

router.get('/', (req, res) => {
    res.render('profile/updatepass');
});

router.post('/', async (req, res) => {
    const {current, newPass, repeatPass} = req.body;

    const renderError = (errMsg) => {
        res.render('profile/updatepass', {msg: {error: errMsg}});
    };

    if(!current || !current.length || !req.user.checkPassword(current)) {
        return renderError("Вы неверно ввели текущий пароль!");
    }

    if(newPass && newPass.length < 5) {
        return renderError("Длина пароля должна быть больше 5 символов!");
    }

    if(newPass !== repeatPass) {
        return renderError("Вы неверно ввели текущий пароль!");
    }

    try {
        const result = await User.updatePassword(req.user.strategies.local.email, newPass);

        if(result.ok === 0) throw new Error("No changed");

        return res.render('profile/updatepass', {msg: {success: "Пароль успешно изменен"}});
    } catch (e) {
        return renderError("Произошла ошибка! Попробуйте ввести другой пароль")
    }

});

module.exports = router;
