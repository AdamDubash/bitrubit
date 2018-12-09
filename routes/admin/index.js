const express = require('express');
const router = express.Router();
const debug = require('debug')('router:admin');

const Comm = require('../../models/comm');
const Payment = require('../../models/payment');
const config = require('../../config');
const Exchange = require("../../models/exchange")
const User = require('../../models/user')

router.get('/', (req, res, next) => {
    //redirect to default page
    res.redirect('/admin/users');
});

router.get('/users', (req, res) => {
    res.render('admin/users')
});

router.get('/users/:id',  async (req, res, next) => {
    const {id} = req.params

    const user = await User.findOne({nid: +id})

    if(!user) {
        return next()
    }

    res.render('admin/user-editor', user)
})

router.get('/payments', (req, res) => {
   res.render('admin/payments');
});

router.get('/history', (req, res) => {
    res.render('admin/history');
});

router.get('/gamesconf', (req, res) => {
    const betsConf = config.get('gameBet');

    res.render('admin/gamesconf', {betsConf});
});

router.get('/money', async (req, res) => {
    const comm = (await Comm.find({}))[0];

    comm.autoOut = config.get('autoOut');
    comm.cashOut = config.get('cashOut');
    comm.qiwi = config.get('qiwi');
        
    res.render('admin/money', comm);
});

router.get('/exchange', async (req, res) => {
    const exchange = config.get("exchange")
    res.render('admin/admin-exchange', {exchange})
})

router.get("/exchange/id/:id", async (req, res, next) => {
    try {
        const ex = await Exchange.getById(+req.params.id)

        if(!ex) {
            return next()
        }

        res.render("admin/admin-exchange-ticket", ex)
    } catch(e) {
        next()
    }
})

router.post("/exchange/id/:id/status", async (req, res, next) => {
    const {code, msg} = req.body

    try {
        const ex = await Exchange.getById(+req.params.id)

        if(!ex) {
            return next()
        }

        ex.status.code = code
        ex.status.msg = msg

        ex.save()

        res.send("Ok")
    } catch (e) {
        res.status(500).send("Error")
    }
})

// router.get('/history', (req, res) => {
//
// });

module.exports =  router;