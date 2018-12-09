const passport = require('../auths/passport');

module.exports = (app) => {
  app.use('/', require('./main'));

  app.use('/reg', require('./reg'));
  
  app.use('/login', require('./login'));

  app.use('/profile', passport.isConfirmed, require('./profile'));

  app.use('/logout', passport.isLoggined, require('./logout'));

  app.use('/confirmemail', passport.isLoggined, require('./confirmemail'));

  app.use('/games', require('./games'));

  app.use('/admin', passport.isLoggined, passport.isAdmin, require('./admin'));

  app.use('/api', passport.isLoggined, passport.isAdmin, require('./api'));

  app.use('/payments', require('./payments'));

  app.use('/contacts', require('./contacts'));

  app.use('/rules', require('./rules'));

  app.use('/exchange', require('./exchange'));

  app.get('/test', (req, res) => {
    res.render('test')
  })
};
