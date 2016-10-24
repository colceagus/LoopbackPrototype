const path = require('path');
const appRoot = require('app-root-path');

function slugify(name) {
  name = name.replace(/^[A-Z]+/, s => s.toLowerCase());
  return name.replace(/[A-Z]/g, s => '-' + s.toLowerCase());
}

module.exports = function(Model, options) {
  const configFilePath = path.join('./common/models',
                                   slugify(Model.modelName) + '.json');
  const config = appRoot.require(configFilePath);

  if (!config || !config.acls) {
    console.log('ClearBaseACLs: Failed to load' +
      ' overloading Model config from ', configFilePath);
    return;
  }

  // Dictionary with ACL property (method) Keys
  // Overriding the ACLs done per property
  // Keeps Default ACLs
  let modelAcls = {};

  Model.settings.acls.forEach(rule => modelAcls[rule.property] = rule);

  Model.settings.acls.length = 0;
  Model.settings.acls = {};

  config.acls.forEach(rule => modelAcls[rule.property] = rule);

  Model.settings.acls = modelAcls;

  console.log('Override ACLs: Success for model: ', Model.modelName);
};
