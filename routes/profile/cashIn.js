const express = require('express');
const debug = require('debug')('router:profile/cashin');
const router = express.Router();

const User = require('../../models/user');
const mem = require('../../libs/mem');
const config = require('../../config');
const Payment = require('../../models/payment');

const Qiwi = require('../../libs/qiwi-api');


router.get('/', async (req, res) => {
    const gotVirtToday = mem.freeVirt[req.user.id];
    const renderData = {
        gotVirtToday,
        qiwi: config.get('qiwi:phone')
    };

    renderData.payments =  await Payment.getLatestPayments(req.user.nid, 'IN', 10);

    res.render('profile/cashin', renderData);
});


const addVirt = (req, res, next) => {
    const {conc} = req.body;

    if(conc !== 'virt') {
        return next();
    }

    if(!mem.freeVirt[req.user.id]) {
        mem.freeVirt[req.user.id] = true;
        User.updateCash(req.user.username, 'virt', 250);
    }

    res.redirect('/profile/');
};

router.post('/', addVirt);

router.get('/qiwi-url', async (req, res) => {
    const qiwiClient = new Qiwi(config.get('qiwi:token'));
    
    const account = config.get('qiwi:phone');
    const amount = 500;
    const comment = req.user.nid.toString();

    const url = await qiwiClient.generatePaymentFormLink({account, amount, comment});

    res.redirect(url);
});

module.exports = router;