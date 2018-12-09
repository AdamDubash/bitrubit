const path = require('path'),
    nconf = require('nconf');

nconf.file({file: path.join(__dirname, 'config.json')});

module.exports = nconf;