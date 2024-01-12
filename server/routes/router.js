const express = require('express');
const route = express.Router();
const controller = require('../controller/controller');


route.post('/contact',controller.create);
route.get('/contact',controller.find);
route.get('/contact/:id',controller.findId);
route.put('/contact/:id',controller.update);
route.delete('/contact/:id',controller.delete);

module.exports = route