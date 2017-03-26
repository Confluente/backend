
var log = require('./logger');
var expressServer = require('./expressServer');
var httpServer = require('http').createServer(expressServer);

var port = process.env.PORT || 80;

//Start server
httpServer.listen(port, function () {
  log.info('Listening on port ' + port);
});
