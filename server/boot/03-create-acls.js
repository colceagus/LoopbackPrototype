var log = require('debug')('loopback:boot:03-create-acls');

var createDefaultAcls = function(app, callback) {
  var models = app.models();
  var noOfModels = models.length;
  //console.log(models[0]);
  var aclEntries = models.map(model => {
    return {
      model: model.modelName,
      acls: model.settings.acls
    };
  });

  var Acl = app.models.ACL;

  var totalAcls = aclEntries.reduce((acc, elem) => {
    return acc + (elem.acls ? elem.acls.length : 0);
  }, 0);
//  log('aclEntries: ', JSON.stringify(aclEntries, null, 4));
  log('totalAcls: ', totalAcls);

  var aclNo = 0;
  aclEntries.forEach(modelEntry => {
    if (modelEntry.acls) {
      // log('Acl Entry: ', modelEntry);
      modelEntry.acls.forEach(acl => {
        log('Creating ACL for model ', modelEntry.model, acl);
        var entry = {
          model: modelEntry.model,
          principalType: acl.principalType,
          principalId: acl.principalId,
          property: acl.property,
          accessType: acl.accessType,
          permission: acl.permission
        };

        Acl.findOrCreate({
          where: {
            and: [
              {model: modelEntry.model},
              {principalType: acl.principalType},
              {principalId: acl.principalId},
              {property: acl.property},
              {accessType: acl.accessType},
              {permission: acl.permission}
            ]
          }
        },
        entry,
        (err, createdAcl, created) => {
          if (err) {
            return callback(err, null);
          }

          aclNo += 1;
          log('Current ACL number: ', aclNo);
          log('Created ACL: ', createdAcl);
          if (aclNo === totalAcls) {
            callback(null, aclNo);
          }
        });
      });
    }
  });
};

module.exports = function(app, callback) {
  var createDefaultAclsCall = function(callback) {
    createDefaultAcls(app, function(err, result) {
      if (err) {
        var message = 'Error creating acl: ' + err;
        log(message);
        return callback(err, result);
      }

      callback(null, result);
    });
  };

  if (app.datasources.PostgreSQL.connected) {
    createDefaultAcls(app, callback);
  } else {
    app.datasources.PostgreSQL.once('connected', createDefaultAclsCall);
  }
};
