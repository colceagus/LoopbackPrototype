'use strict';

module.exports = function (app) {
  const User = app.loopback.getModel('User');
  console.log(User.settings.acls);
}

