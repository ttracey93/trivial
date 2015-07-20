var express = require('express');
var router = express.Router();

// database connection
var mongoose   = require('mongoose');       // pull in mongodb orm
mongoose.connect('mongodb://trivial:admin@ds047612.mongolab.com:47612/trivial');

// models
var User = require('../models/user');

router.route('/users')

  // post in users api
  .post(function(req, res) {
    var user = new User();
    user.username = req.body.username;

    // save and handle errors
    user.save(function(err) {
      if(err) {
        res.send(err);
      }

      res.json({ message: 'User created' });
    });
  })

  // get all users
  .get(function(req, res) {
    User.find(function(err, users) {
      if(err) {
        res.send(err);
      }

      res.json(users);
    });
  })
; // end users api

// users by id
router.route('/users/:user_id')

  // get a user by their id
  .get(function(req, res) {
    User.findById(req.params.user_id, function(err, user) {
      if(err) {
        res.send(err);
      }

      res.json(user);
    });
  })

  // update a user
  .put(function(req, res) {
    User.findById(req.params.user_id, function(err, user) {
      if(err) {
        res.send(err);
      }

      user.username = req.body.username;

      user.save(function(err) {
        if(err) {
          res.send(err);
        }

        res.json({ message: 'User updated' });
      });
    });
  })

  //delete a user
  .delete(function(req, res) {
    User.remove({ _id: req.params.user_id }, function(err, user) {
      if(err) {
        res.send(err);
      }

      res.json({ message: 'User deleted' });
    });
  })
; // end users by id

module.exports = router;
