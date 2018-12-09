const createError = require('http-errors');
const http = require('http');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const session = require('express-session');
const fileUpload = require('express-fileupload');
const MongoDBStore = require('connect-mongodb-session')(session);

const passport = require('./auths/passport');
const config = require('./config');
const notifs = require('./libs/notification');

const HOSTNAME = config.get('server:hostname');
const PORT = config.get('server:port');

const app = express();

const store = new MongoDBStore({
    uri: config.get('mongoose:uri'),
    collection: 'sessions'
});

// view engine setup
app.engine('ejs', require('ejs-locals'));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('tiny'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

const sessionConfig = {
    secret: 'akdsjfekalsdfjdD334214lds',
    store: store,
    expires: (new Date(Date.now() * 1.1)),
    resave: false,
    saveUninitialized: false
};
app.use(session(sessionConfig));

app.use(passport.initialize());
app.use(passport.session());

app.use(fileUpload());

app.use(async (req, res, next) => {
    res.locals.user = req.user;
    res.locals.hostname = HOSTNAME;
    res.locals.port = PORT;
    res.locals.msg = null;

    if(req.user && req.user.nid) {
        res.locals.unreadNotifs = await notifs.getUnreadCount(req.user.nid) || 0
    }

    next();
});

app.use('/setusername', require('./routes/setusername'));
app.use(passport.usernameSpecified)

require('./routes')(app);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    console.log(JSON.stringify(err));

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

const server = http.createServer(app);
  
require('./socket').init(server, sessionConfig);

module.exports = server;
