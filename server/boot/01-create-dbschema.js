var log = require('debug')('loopback:boot:01-create-dbschema');

// Create Default Models Schema in Database
var createDefaultModels = (app, callback) => {
  var appModels = [];

  app.models().forEach(model => appModels.push(model.modelName));

  // Remove Default User Model because we're going to extend it anyway
  var userModelIndex = appModels.indexOf('User');
  if (userModelIndex > -1) {
    appModels.splice(userModelIndex, 1);
  }

  // Get all Models that use the Database Datasource
  var ds = app.dataSources.PostgreSQL;
  ds.isActual(appModels, function(err, actual) {
    if (err) {
      // Error occurred checking the differences
      // between database schema and models
      log('Error verifying database against model definitions.', err);
      return callback(err, false);
    }

    if (actual) {
      // Models are up to date with Datasource Schema
      // return false because models were not updated
      // or created
      return callback(null, !actual);
    }

    ds.autoupdate(appModels, function(err) {
      if (err) {
        // Error occurred while updating the models
        log('Error autoupdating models.', err);
        return callback(err, false);
      }

      callback(null, !actual);
    });
  });
};

// Export boot script for Loopback
module.exports = (app, callback) => {
  var createDefaultModelsCall = function() {
    createDefaultModels(app, function(err, result) {
      if (err) {
        // this message will be preceded by the createDefaultModels
        // function's error messages to be able to identify the problem.
        var message = 'Error creating Database Schema ' +
                      'from Model Definitions.' + err;

        log(message);

        return callback(err, null);
      }

      var message = result ? 'Database Schema created or has been updated ' +
                             'from Model Definitions.' :

                             'Database Schema is up to date ' +
                             'with Model Definitions.';

      log(message);

      callback(null, result);
    });
  };

  if (app.datasources.PostgreSQL.connected) {
    createDefaultModels();
  } else {
    app.datasources.PostgreSQL.once('connected', createDefaultModelsCall);
  }
};
