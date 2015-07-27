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
    res.json({ message: 'Post to /events' });
  })

;

router.route('/events/:id')

  // get event info by id
  .get(function(req, res, id) {
    res.status(404).json({ 'token': uuid.v4() });
  })
;

module.exports = router;
