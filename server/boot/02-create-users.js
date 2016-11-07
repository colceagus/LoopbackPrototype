var log = require('debug')('loopback:boot:02-create-users');

var createDefaultUsers = (app, callback) => {
  // log('Creating roles and users');

  // Required Models (User, Role and RoleMapping)
  var User = app.models.UserModel;
  var Role = app.models.Role;
  var RoleMapping = app.models.RoleMapping;

  // Array of Users created to be returned by the function
  var users = [];

  // Roles Definition and Users belonging to the Roles
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

  // Number of users to create
  var userCount = roles.reduce((acc, current) => {
    return acc + current.users.length;
  }, 0);

  // log('Number of users to create: ', userCount);

  // Counter for create Users function call (not necessarily created)
  var createUserCallsMade = 0;

  // Create Roles, Users for the Roles created and User-Role Mappings
  roles.forEach(role => {
    Role.findOrCreate(
      {where: {name: role.name}},
      {name: role.name},
      (err, createdRole, created) => {
        if (err) {
          log('Error creating role: findOrCreate(' + role.name + ')', err);
          return callback(err, role.name);
        }

        (created) ? log('created role ', createdRole.name) :
                    log('found role ', createdRole.name);

        role.users.forEach(roleUser => {
          User.findOrCreate(
            {where: {email: roleUser.email}},
            roleUser,
            (err, createdUser, created) => {
              if (err) {
                var message = 'Error creating user: findOrCreate(' +
                               roleUser + ')' + err.toString();
                // log(message);

                return callback(err, roleUser.name);
              }

              created ? log('created user', createdUser.username) :
                        log('found user', createdUser.username);

              const roleMapping = {
                principalType: RoleMapping.USER,
                principalId: createdUser.id,
                roleId: createdRole.id
              };

              // Using RoleMapping Model instead of role.principals.create
              // because it created new RoleMapping entries with each server
              // (re)start
              RoleMapping.findOrCreate(
                {
                  where: {
                    and: [
                      {principalType: RoleMapping.USER},
                      {principalId: createdUser.id},
                      {roleId: createdRole.id}
                    ]
                  }
                },
                roleMapping,
                (err, createdRoleMapping, created) => {
                  if (err) {
                    var message = 'error creating ' +
                      'role mapping: findOrCreate(' +
                       roleMapping + ') ' + err.toString();
                    log(message);
                    return callback(err, roleMapping);
                  }

                  // Add the user to the created users array
                  users.push({
                    username: roleUser.username,
                    email: roleUser.email,
                    role: createdRole.name
                  });

                  // Increase the number of calls made
                  // We could have used users.length instead of userCount
                  createUserCallsMade += 1;
                  if (createUserCallsMade === userCount) {
                    callback(null, users);
                  }
                });
            });
        });
      });
  });

  // Return created Users
  return users;
};

module.exports = (app, callback) => {
  var createDefaultUsersCall = function() {
    createDefaultUsers(app, function(err, result) {
      if (err) {
        var message = 'Error creating default Roles and Users ' +
                      'on ' + result + '. ' + err;
        // log(message);
        return callback(err, null);
      }

      // log('Created Default Users and Roles: ', result);

      callback(null, result);
    });
  };

  if (app.datasources.PostgreSQL.connected) {
    createDefaultUsersCall();
  } else {
    app.datasources.PostgreSQL.once('connected', createDefaultUsersCall);
  }
};
