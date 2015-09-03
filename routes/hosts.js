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

// models
var Host = require('../models/host');

router.route('/hosts/register')

  // post in users api
  .post(function(req, res) {
    Host.find().
    or([{ 'hostname': new RegExp(req.body.hostname, 'i') }, { 'email': new RegExp(req.body.email, 'i') }, { 'url': new RegExp(req.body.url, 'i') }])
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

          res.status(201).json({ message: 'Host account created', 'token': token, 'host': host });

          // set session token and set expire
          client.set(host.hostname, token);
          client.expire(host.hostname, expireTime); // expire session in {expireTime}

          client.hmset(token, host);
          client.expire(token, expireTime);
        });
      }
      else {
        var errors = [];
        var hostError = 'Hostname already in use';
        var emailError = 'Email already in use';
        var urlError = 'Url already in use';

        hosts.forEach(function(host) {
          if(host.hostname.toLowerCase() == req.body.hostname.toLowerCase()) {
            if(errors.indexOf(hostError) < 0) {
              errors.push(hostError);
            }
          }

          if(host.email.toLowerCase() == req.body.email.toLowerCase()) {
            if(errors.indexOf(emailError) < 0) {
              errors.push(emailError);
            }
          }

          if(host.url.toLowerCase() == req.body.url.toLowerCase()) {
            if(errors.indexOf(urlError) < 0) {
              errors.push(urlError);
            }
          }
        });

        res.status(409).send({ 'errors': errors });
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
        Host.find().or([{ 'hostname': req.body.hostname }, { 'email': req.body.email }]).exec(function(err, hosts) {
          if(hosts.length < 1) {
            res.status(404).json({ error: 'User does not exist' });
          }
          else {
            res.status(401).json({ error: 'Invalid password' });
          }
        });
      }
      else if(hosts.length > 1) {
        res.status(500).json({ error: 'Multiple users. Please contact support' });
      }
      else {
        var host = hosts[0];
        client.get(host.hostname, respond);

        function respond(err, token) {
          if(token != null) {
            res.json({ message: 'token exists', 'token': token, 'host': host });
            client.expire(host.hostname, expireTime); // reset expire to 20 minutes

          }
          else {
            token = uuid.v4(); // generates a new (random) session token. use v1 for time-based seed
            res.status(201).json({ message: 'token created', 'token': token, 'host': host });

            // set session token and set expire
            client.set(host.hostname, token);
            client.expire(host.hostname, expireTime); // expire session in {expireTime} minutes

            // set token to contain host info
            client.hmset(token, host);
            client.expire(token, expireTime);
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
