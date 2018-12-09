const PORT = require('./config').get('server:port');

(async () => {
  await require('./libs/mongoose');
  await (require('./models/comm')).initComm();
  require('./libs/mem').init();
  require('./services/freeVirtCleaner').start();
  require('./services/autoOut').start();
  require('./services/qiwi-webook-init').init();
  require('./services/exchange-course')
  require('./server').listen(PORT, () => console.log('Server is listening'));

})();