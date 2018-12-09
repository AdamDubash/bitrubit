const router = require('express').Router()

router.get('/', (req, res) => {
    res.render('contacts');
})

module.exports = router