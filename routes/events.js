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
var Host = require('../models/host');

// event routes
router.route('/events')
  // add a new event
  .post(function(req, res) {
    Host.findOne({ 'hostname': req.body.host.hostname }, function(err, host) {
      if(err) {
        res.status(500).json({ 'error': err.message });
      }
      else {
        var event = createEvent(req.body, host);

        event.save(function(err) {
          if(err) {
            res.status(500).json({ error: 'An unknown error occured' });
          }
          else {
            res.status(201).json({ message: 'Event created successfully', eventId: event._id });
          }
        });
      }
    });
  })
;

router.param('id', function(req, res, next, id) {
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
  .put(function(req, res) {
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
  })
;

router.param('owner', function(req, res, next, owner) {
  Host.findOne({ 'hostname': new RegExp(owner, 'i') }, function(err, host) {
    if(err) {
      res.status(404).json({ error: 'Host does not exist' });
    }
    else {
      req.targetHost = host;
      next();
    }
  });
});

router.route('/events/byOwner/:owner')

  // get event listing by owner
  .get(function(req, res) {
    var host = req.targetHost;

    Event.find({ 'owner': host._id }, function(err, events) {
      if(err) {
        res.status(500).json({ 'error': err.message });
      }
      else {
        if(events.length > 0) {
          res.status(200).json({ 'events': events });
        }
        else {
          res.status(404).json({ 'message': 'No events for user' });
        }
      }
    });
  })
;

router.param('city', function(req, res, next, city) {
  req.targetCity = city;
  next();
});

router.param('state', function(req, res, next, state) {
  req.targetState = state;
  next();
});

router.route('/events/search/:city/:state')

  //event listing by city and state
  .get(function(req, res) {
    Event.find({ 'city': new RegExp(req.targetCity, 'i'), 'state': new RegExp(req.targetState, 'i') }, function(err, events) {
      if(err) {
        res.status(500).json({ 'error': err.message });
      }
      else {
        res.status(200).json({ 'events': events });
      }
    });
  })
;

function createEvent(data, host) {
  var event = new Event();
  event.name = data.name;
  event.description = data.description;
  event.address = data.address;
  event.city = data.city;
  event.state = data.state;
  event.zip = data.zip;
  event.dateTime = data.date + " " + data.time;
  event.owner = host._id;
  event.host = host.hostname;

  return event;
}

module.exports = router;
