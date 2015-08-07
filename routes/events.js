var express = require('express');
var router = express.Router();

// redis connection
var redis = require("redis");
var uuid = require('node-uuid'); // for generating GUIDs as tokens
var client = redis.createClient();
var expireTime = 60 * 20; // 60 seconds, 20 times. AKA 20 minutes

// redis error handler
client.on("error", function (err) {
    console.log(err);
});

var Event = require('../models/event');

// event routes
router.route('/events')
  // add a new event
  .post(function(req, res) {
    var event = createEvent(req.body);
    event.save(function(err) {
      if(err) {
        res.status(500).json({ error: 'An unknown error occured' });
      }
      else {
        res.status(201).json({ message: 'Event created successfully', eventId: event._id });
      }
    });
  })
;

router.param('id', function(req, res, next, id) {
  console.log('ID: ' + id);
  Event.findOne({ '_id': id }, function(err, event) {
    if(err) {
      res.status(404).json({ error: 'Event does not exist' });
    }
    else {
      req.targetEvent = event;
      next();
    }
  });
});

router.route('/events/:id')

  // get event info by id
  .get(function(req, res, id) {
    res.json(req.targetEvent);
  })

  // update Event
  .put(function(req, res)) {
    var event = req.targetEvent;
    var data = req.body;

    event.name = data.name;
    event.description = data.description;
    event.address = data.address;
    event.city = data.city;
    event.state = data.state;
    event.zip = data.zip;
    event.dateTime = data.date + " " + data.time;

    event.save(function(err) {
      if(err) {
        res.status(500).json(err.message);
      }
      else {
        res.status(200).json(event);
      }
    });
  }
;

function createEvent(data) {
  var event = new Event();
  event.name = data.name;
  event.description = data.description;
  event.address = data.address;
  event.city = data.city;
  event.state = data.state;
  event.zip = data.zip;
  event.dateTime = data.date + " " + data.time;

  return event;
}

module.exports = router;
