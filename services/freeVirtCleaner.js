const shedule = require('node-schedule');
const debug = require('debug')('service:freeVirtCleaner');

const mem = require('../libs/mem');

module.exports.start = () => {
    debug('started!');

    shedule.scheduleJob('0 0 * * *', () => {
          mem.freeVirt = {};
          debug('cleaned!');
    })
};