const router = require('express').Router();

const config = require('../../config');
const QiwiWebhook = require('../../libs/qiwi-webhook')

router.post('/gamesbet', (req, res, next) => {
    const {conc, min, max} = req.body;

    if(isNaN(min) || isNaN(max)) {
        return res.json({msg: 'Некорректные входные данные!'});
    }

    config.set(`gameBet:${conc}`, {min: +min, max: +max});
    config.save();

    res.json({msg: 'Данные успешно обновлены!'});
});

router.post('/cashout', (req, res, next) => {
    const { conc, min, max } = req.body;

    if (isNaN(min) || isNaN(max)) {
        return res.json({ msg: 'Некорректные входные данные!' });
    }

    config.set(`cashOut:${conc}`, { min: +min, max: +max });
    config.save();

    res.json({ msg: 'Данные успешно обновлены!' });
});

router.post('/qiwi', async (req, res, next) => {
    const {phone, token} = req.body

    const qw = new QiwiWebhook(config.get('qiwi:token'))

    qw.deleteHook(config.get('qiwi:hookId'))


    config.set('qiwi:phone', phone)
    config.set('qiwi:token', token)
    config.set('qiwi:hookId', "")
    config.save()

    await require('../../services/qiwi-webook-init').init()

    res.json({msg: "Данные изменены. Сервисы перезапущены,но лучше все проверьте.("})
    
});

module.exports = router;