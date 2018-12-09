const shedule = require('node-schedule');
const debug = require('debug')('service:autoOut');

const config = require('../config');
const Comm = require('../models/comm');

const BTCWallet = require('../libs/btcw');
const btcw = new BTCWallet(config.get('btcw:url'), config.get('btcw:token'));

const QiwiApi = require('../libs/qiwi-api')

const withdrawal = async (conc, address, amount) => {
    switch (conc) {
        case 'btc':
            
            try {
                const res = await btcw.withdrawal(address, amount, "autoOut");
                updateComm(conc, amount)
                return true
            }catch(e) {
                console.log(e)
                return false
            }

            break;
        case 'rub':
            const qiwi = new QiwiApi(config.get('qiwi:token'))
            try{
                const opts = {
                    account: address,
                    amount: +amount,
                    comment: 'Автовывод с сайта ' + config.get('server:sitename')
                }

                const res = await qiwi.toWallet(opts)
                updateComm(conc, amount)
                return true
            } catch(e) {
                console.log(e)
                return false
            }
    }
};

const updateComm = async (conc, amount) => {
    await Comm.out(conc, -amount)
}

exports.start = () => {
    shedule.scheduleJob('* */4 * * *', async () => {
        const autoOut = config.get('autoOut');

        const comm = await Comm.findOne({});

        for (let conc in autoOut) {
            const {address, amount} = autoOut[conc];

            if(address === 'false') continue;

            if(comm.currentValue[conc] >= +autoOut[conc].amount) {
                withdrawal(conc, address, amount)
            }
        }
    });
};

