// event mongoose model
var mongoose  = require('mongoose');
var Schema    = mongoose.Schema;

var EventSchema = new Schema({
  name: String,
  description: String,
  address: String,
  city: String,
  state: String,
  zip: String,
  dateTime: String,
  owner: { type: Schema.Types.ObjectId, ref: 'Host' },
  host: String
});

module.exports = mongoose.model('Event', EventSchema);
