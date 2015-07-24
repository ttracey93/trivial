var express = require('express');
var router = express.Router();

// database connection
var mongoose   = require('mongoose');       // pull in mongodb orm
mongoose.connect('mongodb://trivial:admin@ds047612.mongolab.com:47612/trivial');

// redis connection
var redis = require("redis");
var uuid = require('node-uuid'); // for generating GUIDs as tokens
var client = redis.createClient();
var expireTime = 60 * 20; // 60 seconds, 20 times. AKA 20 minutes

// redis error handler
client.on("error", function (err) {
    console.log(err);
});

// models
var Host = require('../models/host');

router.route('/hosts/register')

  // post in users api
  .post(function(req, res) {
    Host.find().
    or([{ 'hostname': req.body.hostname }, { 'email': req.body.email }, { 'url': req.body.url }])
    .exec(function(err, hosts) {
      if(err) {
        res.send(err);
      }
      else if(hosts.length < 1) {
        var host = createHost(req.body);

        host.save(function(err) {
          if(err) {
            res.send(err);
          }

          var token = uuid.v4(); // generates a new (random) session token. use v1 for time-based seed

          res.status(201).json({ message: 'Host account created', 'token': token });

          // set session token and set expire
          client.set(host.hostname, token);
          client.expire(host.hostname, expireTime); // expire session in {expireTime} minutes

          console.log('client info set');
        });
      }
      else {
        res.status(409).send({ error: 'Host already exists', 'hosts': hosts });
      }
    })
  })
; // end /hosts/register



router.route('/hosts/login')

  // login service for hosts
  .post(function(req, res) {
    Host.find().or([{ 'hostname': req.body.hostname }, { 'email': req.body.email }])
    .and({ password: req.body.password }).exec(function(err, hosts) {
      if(err) {
        res.send(err);
      }

      if(hosts.length < 1) {
        res.status(404).json({ error: 'User does not exist' });
      }
      else if(hosts.length > 1) {
        res.status(500).json({ error: 'Multiple users. Please contact support' });
      }
      else {
        var host = hosts[0];
        client.get(host.hostname, respond);

        function respond(err, token) {
          if(token != null) {
            res.json({ message: 'token exists', 'token': token });
            client.expire(host.hostname, expireTime); // reset expire to 20 minutes
          }
          else {
            token = uuid.v4(); // generates a new (random) session token. use v1 for time-based seed
            res.json({ message: 'token created', 'token': token });

            // set session token and set expire
            client.set(host.hostname, token);
            client.expire(host.hostname, expireTime); // expire session in {expireTime} minutes
          }
        }
      }
    })
  })
;

// get host profile data
router.param('url', function(req, res, next, url) {
  // fetch host from DB and set in req
  Host.findOne({ 'url': url }, "hostname email profileImageId url bannerImageId", function(err, host) {
    if(err) {
      res.status(404).json({ error: err.message });
      console.log(err);
    }
    else {
      req.targetHost = host;
      next();
    }
  });
});

router.route('/hosts/:url')
  .get(function(req, res) {
    res.json({ 'host': req.targetHost });
  })
;

function createHost(params) {
  var host = new Host();
  host.hostname = params.hostname;
  host.password = params.password;
  host.email = params.email;
  host.url = params.url;
  host.profileImageId = params.profileImageId;
  host.bannerImageId = params.bannerImageId;

  return host;
}

module.exports = router;
