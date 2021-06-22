import express from 'express';
// import homepageController from '../controllers/homepageController';
import chatBotController from '../controllers/chatBotController';

let router = express.Router();

let initWebRoutes = (app) => {
  router.get('/', (req, res) => {
    res.send('ok');
  });
  router.get('/health-check', (req, res) => {
    res.send('ok');
  });
  router.get('/webhook', chatBotController.getWebhook);
  router.post('/webhook', chatBotController.postWebhook);

  return app.use('/', router);
};

module.exports = initWebRoutes;
