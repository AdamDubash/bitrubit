const router = require('express').Router()

const notifs = require('../../libs/notification')
const Notification = require("../../models/notification")

router.get('/', (req, res, next) => {
    res.render('profile/notifications')
})

router.get('/page', async (req, res, next) => {
    const { id } = req.query

    if (isNaN(id)) {
        return next()
    }

    const list = await Notification.getPage(id, 50, req.user.nid) || []

    res.json(list)
})

router.get('/readall', async (req, res, next) => {
    await notifs.readAll(+req.user.nid)

    res.send('ok')
})

module.exports = router