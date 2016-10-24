module.exports = function(app) {
  const User = app.loopback.getModel('User');
  console.log(User.settings.acls);
  //const Person = app.loopback.getModel('Person');
  //console.log(Person.settings.acls);
};
