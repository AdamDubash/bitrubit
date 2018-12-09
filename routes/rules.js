const router = require('express').Router()

router.get('/', (req, res) => {
    res.render('rules');
})

module.exports = router