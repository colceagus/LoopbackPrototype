module.exports = function(server) {
  // Install a `/` route that returns server status
  var router = server.loopback.Router();
  router.get('/', server.loopback.status());

  //verified
  router.get('/verified', function(req, res) {
    res.render('verified');
  });

  server.use(router);
};
