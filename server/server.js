var log = require('debug')('loopback:server');
var loopback = require('loopback');
var boot = require('loopback-boot');
var app = module.exports = loopback();

// Bootstrap Passport
var passport = require('loopback-component-passport');
var PassportConfigurator = passport.PassportConfigurator;
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

/**
 * Flash messages for passport
 *
 * Setting the failureFlash option to true instructs Passport to flash an
 * error message using the message given by the strategy's verify callback,
 * if any. This is often the best approach, because the verify callback
 * can make the most accurate determination of why authentication failed.
 */
var flash = require('express-flash');

// Bootstrap the Application, configure Models, Datasources and Middleware.
// Sub-apps like REST API are mounted via boot scripts.
boot(app, __dirname, function(err) {
  // Initialize Passport
  passportConfigurator.init();

  // Flash messages for passport errors
  app.use(flash());

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

  // Start function of the Application
  // Starts listening on host:port defined in config.env.json
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

  // start the server if `$ node server.js`
  if (require.main === module) {
    app.start();
  }
});
