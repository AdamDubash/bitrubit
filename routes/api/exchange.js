const router = require("express").Router()

const Exchange = require("../../models/exchange")

router.get('/', async (req, res, next) => {
    const exs = await Exchange.find({})

    res.json(exs)
})

router.get("/:id", async (req, res, next) => {
    try {
        const exs = await Exchange.find({ id: +req.params.id })

        res.json(exs)
    } catch(e) {
        res.json([])
    }
})

module.exports = router