var express = require('express');
var router = express.Router();

// database connection
var mongoose   = require('mongoose');       // pull in mongodb orm
mongoose.connect('mongodb://trivial:admin@ds047612.mongolab.com:47612/trivial');

// models
var User = require('../models/user');

// passport
var passport = require('passport');
var FacebookStrategy = require('passport-facebook');

passport.use(new FacebookStrategy({
    clientID: '1625346341083596',
    clientSecret: '3cbcdc85cc8cf9641b7af6bdb304d446',
    callbackURL: "http://localhost:3000/api/facebook/callback",
    enableProof: false
  },
  function(accessToken, refreshToken, profile, done) {
    User.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return done(err, user);
    });
  }
));

router.route('/facebook/callback')
  .get(function(req, res) {
    console.log('get on fb callback');
  })

  .post(function(req, res) {
    console.log('post on fb callback');
  })
;

router.route('/users/register')

  // post in users api
  .get(passport.authenticate('facebook'), function(req, res) {
    res.json({ message: 'User created' });
  })
; // end users api

module.exports = router;
