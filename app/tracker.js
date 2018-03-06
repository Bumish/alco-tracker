'use strict';

const path = require('path');

require('dotenv')
  .config();

const TrackerService = require('./TrackerService');
const TrackerWebApi = require('./TrackerWebApi');
const ServiceStat = require('./ServiceStat');
const LocalConfig = require('./config/LocalConfig');
const pino = require('pino');

const localConfig = new LocalConfig({
  path: path.resolve(__dirname, '..', 'config')
});

const config = localConfig.serviceConfig();
config.isProduction = process.env.NODE_ENV === 'production';

// Logger
const log = pino(config.pino);
const services = {log};

// Stat
services.stat = new ServiceStat(config, services);


(async () => {

  try {
    log.info('Starting Alcolytics tracker');

    // Services
    services.trackerService = new TrackerService(config, services);
    services.trackerWebApi = new TrackerWebApi(config, services);

    // Initializing main service
    await services.trackerService.init();

    // Starting HTTP API
    await services.trackerWebApi.start();

    log.info('Alcolytics ready');

  } catch (error) {
    log.error(error);
  }
})();

process.on('unhandledRejection', error => {
  services.stat.mark('unhandledRejection');
  console.error('unhandledRejection', error);
});
