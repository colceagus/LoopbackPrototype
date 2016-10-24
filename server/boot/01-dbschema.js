// Create Default Models Schema in Database
var createDefaultModels = (app) => {
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
    if (!actual) {
      ds.autoupdate(appModels, function(err) {
        if (err) throw (err);
        console.log('Created Default Models: ', !actual);
      });
    }
  });
};

// Populate User Roles
var createRoles = (app) => {

};

// Populate Database with Initial Data (Roles, Mappings etc.)
var bootstrapData = (app) => {
  // Create Roles
  createRoles(app);
};

// Export boot script for Loopback
module.exports = (app) => {
  console.log('exported dbschema');

  createDefaultModels(app);

  bootstrapData(app);
};
