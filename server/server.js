var log = require('debug')('loopback:server');
var loopback = require('loopback');
var boot = require('loopback-boot');
var app = module.exports = loopback();

// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts.
boot(app, __dirname, function(err) {
  if (err) throw err;

  app.start = function() {
    // start the web server
    return app.listen(function() {
      app.emit('started');
      var baseUrl = app.get('url').replace(/\/$/, '');
      log('Web server listening at: %s', baseUrl);
      if (app.get('loopback-component-explorer')) {
        var explorerPath = app.get('loopback-component-explorer').mountPath;
        log('Browse your REST API at %s%s', baseUrl, explorerPath);
      }
    });
  };

  // Middleware
  // Phases Order: initial, session, auth, parse, routes, final.

  // SESSION MIDDLEWARE PHASE:

  // Cookie Parser
  var cookieParser = require('cookie-parser');
  app.middleware('session:before', cookieParser(app.get('cookieSecret')));

  // Express Session
  var session = require('express-session');
  var RedisStore = require('connect-redis')(session);
  var store = new RedisStore({
    host: 'localhost',
    port: 6379,
    ttl: 60000
  });
  app.set('trust proxy', 1); // trust first proxy
  app.middleware('session', session({
    store: store,
    secret: app.get('sessionSecret'),
    saveUninitialized: true,
    resave: true,
    name: 'sessionId',
    cookie: {
      maxAge: 60000
    }
  }));

  app.middleware('parse:after', function(req, res, next) {
    // console.log('HELLO: ', req.session.id);
    // console.log('HELLO:', JSON.stringify(req.session));
    // console.log('HELLO: ', req.access_token);
    // console.log('HELLO: ', req.accessToken);
    // console.log('HELLO: ', req.session.access_token);
    // console.log('HELLO: ', req.session.accessToken);
    next();
  });

  // AUTH MIDDLEWARE PHASE: Access Token
  app.middleware('auth', loopback.token({
    model: app.models.AccessTokenModel
  }));

  // PARSE MIDDLEWARE PHASE: Body Parser
  var bodyParser = require('body-parser');
  app.middleware('parse', bodyParser.json());
  app.middleware('parse', bodyParser.urlencoded({extended: true}));

  /**
   * Flash messages for passport
   *
   * Setting the failureFlash option to true instructs Passport to flash an
   * error message using the message given by the strategy's verify callback,
   * if any. This is often the best approach, because the verify callback
   * can make the most accurate determination of why authentication failed.
   */
  var flash = require('express-flash');
  app.use(flash());

  // Passport
  var PassportConfigurator = require('loopback-component-passport').PassportConfigurator;
  var passportConfigurator = new PassportConfigurator(app);

  // Load Passport Configuration Files
  var strategyProvider = {};
  try {
    strategyProvider = require('../providers.json');
  } catch (err) {
    log('Please configure your passport strategy in `providers.json`.' +
        'Copy `providers.json.template` to `providers.json` and replace ' +
        'the clientID/clientSecret values with your own.', err);
    process.exit(1); // fatal error
  }

  passportConfigurator.init();

  // Configure Passport Models
  passportConfigurator.setupModels({
    userModel: app.models.UserModel,
    userIdentityModel: app.models.UserIdentityModel,
    userCredentialModel: app.models.UserCredentialModel
  });

  // Configure Passport Strategies
  for (var strategy in strategyProvider) {
    // Get the Strategy Configuration
    var strategyConfig = strategyProvider[strategy];

    // Configure Passport Session
    strategyConfig.session = strategyConfig.session !== false;

    // Provide Passport with the Strategy Configuration
    passportConfigurator.configureProvider(strategy, strategyConfig);
  }

  // start the server if `$ node server.js`
  if (require.main === module) {
    app.start();
  }
});
