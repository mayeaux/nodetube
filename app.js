/**
 * Module dependencies.
 */
const express = require('express');
const compression = require('compression');
const session = require('express-session');
const bodyParser = require('body-parser');
const logger = require('morgan');
const chalk = require('chalk');
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
const favicon = require('serve-favicon');
const useragent = require('express-useragent');
var multipart = require('connect-multiparty');
const Promise = require('bluebird');
const ngrok = require('ngrok');
const commandExists = require('command-exists');
const errorHandler = require('errorhandler');
const jsHelpers = require('./lib/helpers/js-helpers');

/** FOR FINDING ERRANT LOGS **/
if(process.env.SHOW_LOG_LOCATION == 'true' || 1 == 2){
  jsHelpers.showLogLocation();
}

mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);

/** Code for clustering, running on multiple CPUS **/
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

/** Load environment variables from .env file, where API keys and passwords are configured. **/
dotenv.load({path: '.env.settings'});
dotenv.load({path: '.env.private'});

const amountOfProcesses = process.env.WEB_CONCURRENCY || numCPUs;

// set upload server, upload url and save files directory
const settings = require('./lib/helpers/settings');

const saveAndServeFilesDirectory = settings.saveAndServeFilesDirectory;

const portNumber =  process.env.PORT || 3000;

if(cluster.isMaster){
  console.log('BOOTING APP...\n');

  console.log(`PLUS ENABLED: ${process.env.PLUS_ENABLED}\n`);

  console.log(`NODE_ENV: ${process.env.NODE_ENV}\n`);

  console.log(`RUNNING WITH THIS MANY PROCESSES: ${amountOfProcesses}\n`);

  console.log(`SAVE AND SERVE FILES DIRECTORY: ${saveAndServeFilesDirectory}\n`);

  console.log(`THE MOST CONTROVERSIAL UPLOAD RATING ALLOWED ON THIS INSTANCE IS: ${process.env.MAX_RATING_ALLOWED} \n`);

  for(let i = 0; i < amountOfProcesses; i++){
    // Create a worker
    cluster.fork();
  }

  if(process.env.CACHING_ON == 'true'){
    console.log('CACHING IS ON');
    const runcaching = require('./caching/runCaching');
  } else {
    console.log('CACHING IS OFF \n');
  }

} else {

  (async function(){

    // site visit
    const Notification = require('./models').Notification;
    const routes = require('./routes');

    const customMiddleware = require('./middlewares/custom');
    const widgetMiddleware = require('./middlewares/shared/widgets');
    const socialRedirectMiddleware = require('./middlewares/shared/socialRedirects');

    const missedFile404Middleware = require('./middlewares/shared/missedFile404Middleware');

    const stripeSubscriptionMiddleware = require('./middlewares/shared/stripeSubscriptionChecker');

    process.on('uncaughtException', (err) => {
      console.log('Uncaught Exception: ', err);
      console.log(err.stack);
    });
    //
    process.on('unhandledRejection', (reason, p) => {
      console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
      // application specific logging, throwing an error, or other logic here
    });

    process.on('rejectionHandled', (err) => {
      console.log(err.code);
    });

    console.log(`FRONTEND SERVER: ${process.env.FRONTEND_SERVER} \n`);

    if(process.env.LOG_CACHING == 'true'){
      console.log('CACHING LOGS WILL COME THROUGH CONSOLE \n');
    } else {
      console.log('CACHING LOGS WILL NOT COME THROUGH \n');
    }

    /** connect to MongoDB **/
    const mongoUri = process.env.MONGODB_URI || process.env.MONGODB_DOCKER_URI || process.env.MONGO_URI || process.env.MONGOLAB_URI;

    mongoose.Promise = global.Promise;

    mongoose.connect(mongoUri, {
      keepAlive: true,
      reconnectTries: Number.MAX_VALUE,
      useNewUrlParser: true
    });

    if(process.env.MONGOOSE_DEBUG == 'true' || process.env.MONGOOSE_DEBUG == 'on' || 1 == 2){
      mongoose.set('debug', true);
    }

    mongoose.connection.on('error', (err) => {
      console.error(err);
      console.log('%s MongoDB connection error. Please make sure MongoDB is running.', chalk.red('✗'));
      process.exit();
    });

    console.log('CONNECTED TO DATABASE AT: ' + mongoUri + '\n');

    /** create express app **/
    const app = express();

    app.use(favicon(path.join(__dirname, 'public', 'images/favicon.ico')));

    /*
     * Express configuration.
     */

    app.set('port', portNumber);
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

    if(process.env.SAVE_AND_SERVE_FILES == 'true'){
      // TODO: there is a bug here where the user's account profile picture is being cached and doesnt appear updated, pull that out of this route (should have maxage: 0 )
      app.use('/uploads', express.static(saveAndServeFilesDirectory, {maxAge: 31557600000}));
    }

    if(process.env.LOCAL_BACKUP_ON == 'true'){
      console.log(`ALLOWING FILE SERVED VIA LOCAL DRIVE: ${process.env.LOCAL_BACKUP_DIRECTORY}`);
      app.use('/uploads', express.static(process.env.LOCAL_BACKUP_DIRECTORY, {maxAge: 31557600000}));
    }

    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended: true}));
    app.use(expressValidator());

    app.use(express.static(path.join(__dirname, 'public'), {maxAge: 31557600000}));

    app.use(express.static(path.join(__dirname, 'hls'), {}));

    /** Putting logger after express.static to suppress static logs,
     * put it before express.static to see static GET requests come through**/
    if(process.env.NODE_ENV == 'development'){
      app.use(logger('dev'));
    } else if(process.env.NODE_ENV == 'production'){
      app.use(logger('dev'));
    }

    app.use(missedFile404Middleware);

    app.use(session({
      cookie: {expires: new Date(2147483647000)},
      resave: true,
      saveUninitialized: true,
      secret: process.env.SESSION_SECRET,
      store: new MongoStore({
        url: mongoUri,
        autoReconnect: true,
        clear_interval: 3600
      })
    }));
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(flash());

    app.use(function(req, res, next){
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
        requestPath === '/api/channel/thumbnail/delete' ||
        requestPath.match(editUploadRegexp) ||
        requestPath.match(deleteUploadThumbnailRegexp) ||
        requestPath === '/livestream/on-live-auth' ||
        requestPath === '/livestream/on-live-done' ||
        requestPath === '/save-subscription' // turning it off here for time being, can't figure a way to get the token in the JS
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

    app.use(multipart());

    app.use(stripeSubscriptionMiddleware);

    /** PASS NODE ENV TO VIEWS **/
    app.use(async function(req, res, next){

      res.locals.nodeEnv = process.env.NODE_ENV;

      res.locals.maxRatingAllowed = process.env.MAX_RATING_ALLOWED;

      next();
    });

    for(const middleware in customMiddleware){
      app.use(customMiddleware[middleware]);
    }

    // run all the widget middleware software which adds credentials to res.local
    for(const middleware in widgetMiddleware){
      app.use(widgetMiddleware[middleware]);
    }

    // run all the widget middleware software which adds credentials to res.local
    app.use(socialRedirectMiddleware);

    /** META TAGS FOR SOCIAL AND SET POPULAR DEFAULT VARIABLE **/
    app.use(async function(req, res, next){
      res.locals.meta = {
        description: process.env.META_DESCRIPTION,
        image: process.env.META_IMAGE
      };

      // set popular default to 'all' or 'overview'
      res.locals.popularDefault = process.env.POPULAR_DEFAULT  || 'all';

      next();

    });

    /** HOW MANY UNREAD NOTIFS **/
    app.use(async function(req, res, next){
      if(req.user){
        let unreadNotifs = await Notification.countDocuments({read: false, user: req.user._id});
        res.locals.unreadNotifAmount = unreadNotifs;
        // console.log(unreadNotifs + ' unreadnotifs')

      }
      next();
    });

    app.use(async function(req, res, next){
      var SI_SYMBOL = ['', 'k', 'M', 'G', 'T', 'P', 'E'];

      function abbreviateNumber(number){

        // what tier? (determines SI symbol)
        var tier = Math.log10(number) / 3 | 0;

        // if zero, we don't need a suffix
        if(tier == 0)return number;

        // get suffix and determine scale
        var suffix = SI_SYMBOL[tier];
        var scale = Math.pow(10, tier * 3);

        // scale the number
        var scaled = number / scale;

        // format number and add suffix
        return scaled.toFixed(1) + suffix;
      }

      res.locals.abbreviateNumber = abbreviateNumber;

      function numberWithCommas(x){
        var parts = x.toString().split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        return parts.join('.');
      }

      res.locals.numberWithCommas = numberWithCommas;

      next();
    });

    /** Prevent blocked sitevisitors from accessing site **/
    app.use(async(req, res, next) => {

      if(req.siteVisitor.blocked == true){
        await Promise.delay(1000 * 15);
        res.send('Something went wrong, please try again');
      } else {
        next();
      }
    });

    /** Setting up returnTo path for user login **/
    app.use((req, res, next) => {
      // After successful login, redirect back to the intended page
      if(!req.user &&
        req.path !== '/login' &&
        req.path !== '/signup' && !req.path.match(/^\/auth/) && !req.path.match(/\./)
      ){
        req.session.returnTo = req.path;
        // if the req user is coming back to account let them go there
      } else if(req.user && req.path == '/account'){
        req.session.returnTo = req.path;
      }
      next();
    });

    /** Automatically timeout after 30s (for Heroku) **/
    app.use(timeout('3000s'));

    // take site down for maintenance
    if(process.env.DOING_MAINTENANCE == 'true'){
      app.use('*', function(req, res){
        return res.render('maintain', {
          title: 'Maintenance'
        });
      });
    }

    /** ROUTES PER APP TYPE **/
    if(process.env.FILE_HOST == 'true'){

      routes.fileHostRoutes(app);

    } else if(process.env.LIVESTREAM_APP == 'true'){

      routes.livestreamRoutes(app);

    } else {

      routes.frontendRoutes(app);

    }

    // handle robots.txt
    app.get('/robots.txt', function(req, res){
      res.type('text/plain');
      res.send('User-agent: *\nAllow: /');
    });

    // catch requests that didn't hit a path and 404
    app.get('*', function(req, res){

      res.status(404);

      return res.render('error/404', {
        title: 'Not Found'
      });
    });

    /** ERROR HANDLING **/

    app.use(function(err, req, res){
      console.log(err.stack);
      if(res.status){
        res.status(500);
        res.render('error/500');

        // for some reason, res is actually 'next'?
      } else {
        console.log(res.toString());
        res();
      }

    });

    /** error handler **/
    if(process.env.NODE_ENV === 'development'){
      app.use(errorHandler());
    }

    /** ip block error handler **/
    app.use(async function(err, req, res, next){
      // console.log(err);
      if(err.name == 'IpDeniedError'){

        await Promise.delay(1000 * 15);
        return res.send('The server returned an error, please try again');
      } else {
        next();
      }
    });

    /** start server **/
    app.listen(app.get('port'), () => {
      console.log('\n %s App is running at http://localhost:%d in %s mode', chalk.green('✓'), app.get('port'), app.get('env'));
      console.log('  Press CTRL-C to stop\n');
    });

    require('dns').lookup(require('os').hostname(), function(err, localIp){
      console.log(`NodeTube can be accessed on your local network at ${localIp}:${portNumber}\n`);
    });

    // warn user if ffmpeg is not installed
    commandExists('ffmpeg')
      .then(function(){
        // ffmpeg installed
      }).catch(function(){
        console.log('WARNING: ffmpeg IS NOT INSTALLED. Video uploads will fail. \n');
      });

    if(process.env.MODERATION_UPDATES_TO_DISCORD == 'true') console.log('SENDING MODERATION REQUESTS TO DISCORD \n');

    if(process.env.UPLOAD_TO_B2 == 'true'){
      console.log(`UPLOAD TO BACKBLAZE ON, BUCKET: ${process.env.BACKBLAZE_BUCKET}\n`);
    }

    module.exports = app;

  })();

  if(process.env.RUN_NGROK == 'true'){
    runNgrok();
  }
}

async function runNgrok(){

  let ngrokOptions = {
    addr: portNumber
  };

  if(process.env.NGROK_SUBDOMAIN && process.env.NGROK_AUTHTOKEN){
    ngrokOptions.authtoken = process.env.NGROK_AUTHTOKEN;
    ngrokOptions.subdomain = process.env.NGROK_SUBDOMAIN;
  }

  const url = await ngrok.connect(ngrokOptions);

  console.log(`Access NodeTube on the public web via ${url}. This link will be changed if you restart the app, to
  use Ngrok with a permanent subdomain please purchase a token and update the settings in .env.private (see runNgrok function in app.js)`);
}

