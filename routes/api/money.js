const router = require('express').Router();

const Comm = require('../../models/comm');
const config = require('../../config');
const BTCWallet = require('../../libs/btcw');
const btcw = new BTCWallet(config.get('btcw:url'), config.get('btcw:token'));
const QiwiApi = require('../../libs/qiwi-api');

router.get('/', async (req, res, next) => {
    const comm = await Comm.find();

    res.json(comm);
});

router.get('/balance', async (req, res, next) => {
    const qiwi = new QiwiApi(config.get('qiwi:token'))

    const b = {
        rub: 'Parsing error',
        btc: 'Parsing error'
    }

    try {
        const result = await qiwi.getBalance()
        if (result && result.accounts[0] && result.accounts[0].balance) {
            b.rub = result.accounts[0].balance.amount
        }
    } catch(e) {
        console.error(e)
    }

    try {
        const response = await btcw.getBalance();
        
        b.btc = response.result;
    } catch(e) {
        console.error(e);
    }

    res.json(b)
});

router.post('/autoOut', (req, res, next) => {
   const {conc, address, amount} = req.body;

   if(!config.get(`autoOut:${conc}`)) {
       return next();
   }

   config.set(`autoOut:${conc}`, {address, amount});
   config.save();

   res.json({msg: 'Данные успешно обновлены!'});
});



module.exports = router;