// user mongoose model
var mongoose  = require('mongoose');
var Schema    = mongoose.Schema;

var HostSchema = new Schema({
  any: {}
});

module.exports = mongoose.model('Host', HostSchema);
