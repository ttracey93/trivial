// user mongoose model
var mongoose  = require('mongoose');
var Schema    = mongoose.Schema;

var HostSchema = new Schema({
  hostname: String,
  email: String,
  password: String,
  url: String,
  profileImageId: String,
  bannerImageId: String
});

module.exports = mongoose.model('Host', HostSchema);
