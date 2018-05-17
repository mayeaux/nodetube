/**
 * Module dependencies.
 */
const express = require('express');
const compression = require('compression');
const session = require('express-session');
const bodyParser = require('body-parser');
const logger = require('morgan');
const chalk = require('chalk');
const errorHandler = require('errorhandler');
const lusca = require('lusca');
const dotenv = require('dotenv');
const MongoStore = require('connect-mongo')(session);
const flash = require('express-flash');
const path = require('path');
const mongoose = require('mongoose');
const passport = require('passport');
const expressValidator = require('express-validator');
const expressStatusMonitor = require('express-status-monitor');
const sass = require('node-sass-middleware');
const timeout = require('connect-timeout');
const sslRedirect = require('heroku-ssl-redirect');
const favicon = require('serve-favicon');
const Ddos = require('ddos');
const useragent = require('express-useragent');
var multipart = require('connect-multiparty');
var apicache = require('apicache');
var cors = require('cors');
const Promise = require('bluebird');
const ipfilter = require('express-ipfilter').IpFilter;
const _ = require('lodash');

/** Code for clustering, running on multiple CPUS **/
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

/** Load environment variables from .env file, where API keys and passwords are configured. **/
dotenv.load({path: '.env.settings'});
dotenv.load({path: '.env.private'});

const amountOfProcesses = process.env.WEB_CONCURRENCY || numCPUs;

if(process.env.CACHING_ON == 'true'){
  const runcaching = require('./caching/runCaching')
}


/** Code to find errant console logs **/
['log', 'warn', 'error'].forEach(function(method) {
  var old = console[method];
  console[method] = function() {
    var stack = (new Error()).stack.split(/\n/);
    // Chrome includes a single "Error" line, FF doesn't.
    if (stack[0].indexOf('Error') === 0) {
      stack = stack.slice(1);
    }
    var args = [].slice.apply(arguments).concat([stack[1].trim()]);
    return old.apply(console, args);
  };
});

const settings = require('./lib/helpers/settings');

const saveAndServeFilesDirectory = settings.saveAndServeFilesDirectory;

console.log(`SAVE AND SERVE FILES DIRECTORY: ${saveAndServeFilesDirectory}`);


if (cluster.isMaster) {
  for (let i = 0; i < amountOfProcesses; i++) {
    // Create a worker
    cluster.fork();
  }

} else {

  console.log(`Running with this many processes: ${amountOfProcesses}`);

  (async function() {

    // site visit
    const Notification = require('./models').Notification;
    const routes = require('./config/routes');

    const customMiddleware = require('./middlewares/custom');
    const widgetMiddleware = require('./middlewares/shared/widgets');

    const missedFile404Middleware = require('./middlewares/shared/missedFile404Middleware');

    //
    process.on('uncaughtException', (err) => {
      // console.log(err);
      // console.log(err.code);
      console.log(`Uncaught Exception: `, err);
      console.log(err.stack);
    });
    //
    process.on('unhandledRejection', (reason, p) => {
      console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
      // application specific logging, throwing an error, or other logic here
    });

    process.on('rejectionHandled', (err) => {

      // console.log('ugh')
      console.log(err.code);
      // console.log(`Unhandled Rejection: `, err);
      // console.log(err.stack);
    });

    process.on('message', (err) => {

      // console.log('ugh')
      // console.log(err.code);
      // console.log(`Unhandled Rejection: `, err);
      // console.log(err.stack);
    });

    console.log(`FRONTEND SERVER: ${process.env.FRONTEND_SERVER}`);


    // require('./lib/deleteUsers');

    /** connect to MongoDB **/
    const mongoUri = process.env.MONGODB_DOCKER_URI || process.env.MONGO_URI || process.env.MONGODB_URI || process.env.MONGOLAB_URI || 'mongodb://localhost:27017/april15pewtube';

    mongoose.Promise = global.Promise;

    mongoose.Promise = global.Promise;
    mongoose.connect(mongoUri, {
      keepAlive: true,
      reconnectTries: Number.MAX_VALUE
    });

    if(process.env.MONGOOSE_DEBUG == 'true' || process.env.MONGOOSE_DEBUG == 'on'){
      mongoose.set('debug', true);
    }

    mongoose.connection.on('error', (err) => {
      console.error(err);
      console.log('%s MongoDB connection error. Please make sure MongoDB is running.', chalk.red('✗'));
      process.exit();
    });

    console.log('Connected to ' + mongoUri);

    if(process.env.EMAIL_LISTENER_ON == 'true'){
      const emailListenerScript = require('./scripts/shared/saveUnseenEmails')
    }

    /** create express app **/
    const app = express();



    app.use(favicon(path.join(__dirname, 'public', 'images/favicon.ico')));

    /*
     * Express configuration.
     */
    app.set('port', process.env.PORT || 3000);
    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'pug');

    // TODO: put this behind auth
    // status monitor
    app.use(expressStatusMonitor({
      path: '/hiddenStatus'
    }));


    app.use(compression());
    app.use(sass({
      src: path.join(__dirname, 'public'),
      dest: path.join(__dirname, 'public')
    }));

    if(process.env.NODE_ENV == 'development'){
      app.use(logger('dev'));
    }

    console.log(`SERVE UPLOADS PATH: ${saveAndServeFilesDirectory}`);

    app.use('/uploads', express.static(saveAndServeFilesDirectory, {maxAge: 31557600000}));

    if(process.env.LOCAL_BACKUP_ON == 'true'){
      console.log(`ALLOWING FILE SERVED VIA LOCAL DRIVE: ${process.env.LOCAL_BACKUP_DIRECTORY}`);
      app.use('/uploads', express.static(process.env.LOCAL_BACKUP_DIRECTORY, {maxAge: 31557600000}));
    }

    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended: true}));
    app.use(expressValidator());

    app.use(express.static(path.join(__dirname, 'public'), {maxAge: 31557600000}));

    app.use(express.static(path.join(__dirname, 'hls'), {}));

    app.use(missedFile404Middleware);

    app.use(function (err, req, res, next) {
      console.log('THING');
      console.log(err);
      // logic
    });

    app.use(session({
      cookie: {expires: new Date(2147483647000)},
      resave: true,
      saveUninitialized: true,
      secret: process.env.PEWTUBE_SESSION_SECRET || process.env.SESSION_SECRET,
      store: new MongoStore({
        url: mongoUri,
        autoReconnect: true,
        clear_interval: 3600
      })
    }));
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(flash());



    app.use(function (req, res, next) {
      req.headers.origin = req.headers.origin || req.headers.host;
      next();
    });



    // exclude paths for csrf
    app.use((req, res, next) => {

      // allowing edit page to send uploads
      const requestPath = req.path;
      const editUploadRegexp = /\/api\/upload\/(.*)\/edit/;
      const deleteUploadThumbnailRegexp = /\/api\/upload\/(.*)\/thumbnail\/delete/;

      // skip csrf for certain routes
      // TODO: sure this is the right code design?
      if(
        requestPath === '/upload' ||
        requestPath === '/account/profile' ||
        requestPath === 'api/channel/thumbnail/delete' ||
        requestPath.match(editUploadRegexp) ||
        requestPath.match(deleteUploadThumbnailRegexp) ||
        requestPath === '/livestream/on-live-auth' ||
        requestPath === '/livestream/on-live-done'
      ){
        next();
      } else {
        lusca.csrf()(req, res, next);
      }
    });

    app.use(lusca.xframe('SAMEORIGIN'));
    app.use(lusca.xssProtection(true));

    // pass user to frontend
    app.use((req, res, next) => {
      res.locals.user = req.user;
      next();
    });

    app.use(useragent.express());


    // TODO: where is this being used?
    app.use((req, res, next) => {
      if (process.env.NODE_ENV == 'production') {
        res.locals.linkPrepend = 'https://pew.tube';
      } else {
        res.locals.linkPrepend = '';
      }
      next();
    });

    // not being used currently
    function nocache(req, res, next) {
      res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
      res.header('Expires', '-1');
      res.header('Pragma', 'no-cache');
      next();
    }

    app.use(multipart());

    /** PASS NODE ENV TO VIEWS **/
    app.use(async function (req, res, next) {

      res.locals.nodeEnv = process.env.NODE_ENV;

      next()
    });


    for(const middleware in customMiddleware){
      app.use(customMiddleware[middleware])
    }

    for(const middleware in widgetMiddleware){
      app.use(widgetMiddleware[middleware])
    }





    /** META TRACKER **/
    app.use(async function (req, res, next) {
      res.locals.meta = {
        description: process.env.META_DESCRIPTION,
        image: process.env.META_IMAGE
      };

      next()

    });


    /** HOW MANY UNREAD NOTIFS **/

    app.use(async function (req, res, next) {
      if (req.user) {
        let unreadNotifs = await Notification.count({read: false, user: req.user._id});
        res.locals.unreadNotifAmount = unreadNotifs;

        // console.log(unreadNotifs + ' unreadnotifs')

      }


      next();
    });

    /** Prevent blocked sitevisitors from accessing site **/
    app.use(async (req, res, next) => {

      // console.log(req.siteVisitor.ip);
      //
      // console.log(req.siteVisitor.blocked);


      if(req.siteVisitor.blocked == true){
        await Promise.delay(1000 * 15);
        res.send('Something went wrong, please try again');
      } else {
        next()
      }
    });



    // TODO: not sure what this code achieves
    app.use((req, res, next) => {
      // After successful login, redirect back to the intended page
      if (!req.user &&
        req.path !== '/login' &&
        req.path !== '/signup' && !req.path.match(/^\/auth/) && !req.path.match(/\./)
      ){
        req.session.returnTo = req.path;
        // if the req user is coming back to account let them go there
      } else if (req.user && req.path == '/account') {
        req.session.returnTo = req.path;
      }
      next();
    });


    /** Automatically timeout after 30s (for Heroku) **/
    app.use(timeout('3000s'));

    // take site down for maintenance
    if (process.env.DOING_MAINTENANCE == 'true') {
      app.use('*', function (req, res, next) {
        return res.render('maintain', {
          title: 'Maintenance'
        });
      });
    }

    /** ROUTES PER APP TYPE **/
    if (process.env.FILE_HOST == 'true') {

     routes.fileHostRoutes(app)

    } else if (process.env.LIVESTREAM_APP == 'true') {

      routes.livestreamRoutes(app)

    } else {

      routes.frontendRoutes(app)

    }

    // handle robots.txt
    app.get('/robots.txt', function (req, res) {
      res.type('text/plain');
      res.send("User-agent: *\nAllow: /");
    });

    // catch requests that didn't hit a path and 404
    app.get('*', function (res, res, next) {

      res.status(404);

      return res.render('error/404', {
        title: 'Not Found'
      });
    });

    app.use(function(err, req, res, next){
      console.error(err);
      res.status(500);
      res.render('error');
    });


    /** ip block error handler **/
    app.use(async function (err, req, res, next) {
      // console.log(err);
      if (err.name == 'IpDeniedError') {

        await Promise.delay(1000 * 15);
        return res.send('The server returned an error, please try again');
      } else {
        next()
      }
    });

    /** error handler **/
    // if (process.env.NODE_ENV === 'development') {
    //   app.use(errorHandler());
    // }

    /** start server **/
    app.listen(app.get('port'), () => {
      console.log('%s App is running at http://localhost:%d in %s mode', chalk.green('✓'), app.get('port'), app.get('env'));
      console.log('  Press CTRL-C to stop\n');
    });

    module.exports = app;

  })();

}
