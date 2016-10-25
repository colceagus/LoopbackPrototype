var log = require('debug')('boot:02-create-users');

var createDefaultUsers = (app) => {
  log('Creating roles and users');

  var User = app.models.UserModel;
  var Role = app.models.Role;
  var RoleMapping = app.models.RoleMapping;

  var users = [];

  var roles = [
    {
      name: 'admin',
      users: [
        {
          firstName: 'Admin',
          lastName: 'User',
          email: 'admin@admin.com',
          username: 'admin',
          password: 'admin'
        },
        {
          firstName: 'dummy',
          lastName: 'AdminUser',
          email: 'dummyadmin@admin.com',
          username: 'dummyadmin',
          password: 'admin'
        }
      ]
    },
    {
      name: 'user',
      users: [
        {
          firstName: 'Guest',
          lastName: 'User',
          email: 'user@user.com',
          username: 'user',
          password: 'user'
        }
      ]
    }
  ];

  roles.forEach(role => {
    Role.findOrCreate(
      {where: {name: role.name}},
      {name: role.name},
      (err, createdRole, created) => {
        if (err) {
          return console.error('error creating role: findOrCreate(' +
                                        role.name + ')', err);
        }

        created ? log('created role ', createdRole.name) :
                  log('found role ', createdRole.name);

        role.users.forEach(roleUser => {
          User.findOrCreate(
            {where: {email: roleUser.email}},
            roleUser,
            (err, createdUser, created) => {
              if (err) {
                return console.error('error creating user: findOrCreate(' +
                                              roleUser + ')', err);
              }

              created ? log('created user', createdUser.username) :
                        log('found user', createdUser.username);

              const roleMapping = {
                principalType: RoleMapping.USER,
                principalId: createdUser.id
              };

              RoleMapping.findOrCreate(
                {
                  where: {
                    and: [
                      {principalType: RoleMapping.USER},
                      {principalId: createdUser.id}
                    ]
                  }
                },
                roleMapping,
                (err, createdRoleMapping, created) => {
                  if (err) {
                    return console.error('error creating ' +
                      'role mapping: findOrCreate(' + roleMapping + ') ', err);
                  }

                  users.push(createdUser);
                });
            });
        });
      });
  });

  return users;
};

module.exports = (app) => {
  createDefaultUsers(app);
};
