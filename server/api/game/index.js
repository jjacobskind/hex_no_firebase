'use strict';

var express = require('express');
var controller = require('./game.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.get('/', controller.index);
router.get('/:id', auth.isAuthenticated(), controller.show);
router.post('/', auth.isAuthenticated(), controller.create);
router.post('/join', auth.isAuthenticated(), controller.join);
router.put('/test', auth.isAuthenticated(), controller.test);
router.patch('/:id', controller.update);
router.delete('/:id', controller.destroy);

module.exports = router;