'use strict';

const path = require('path');

require('dotenv').config();

const TrackerService = require('./TrackerService');
const TrackerWebApi = require('./TrackerWebApi');
const ServiceStat = require('./ServiceStat');
const LocalConfig = require('./config/LocalConfig');
const pino = require('pino');

const localConfig = new LocalConfig({
  path: path.resolve(__dirname, '..', 'config')
});


(async () => {

  try {

    const config = await localConfig.serviceConfig();
    config.isProduction = process.env.NODE_ENV === 'production';

    // Logger
    const log = pino(config.pino);
    const services = {log};

    log.info('Starting Alcolytics tracker');
    log.debug(config, 'Config');

    // Services
    services.stat = new ServiceStat(config, services);
    services.trackerService = new TrackerService(config, services);
    services.trackerWebApi = new TrackerWebApi(config, services);

    // Async storage init

    // Initializing main service
    await services.trackerService.init();

    // Starting HTTP API
    await services.trackerWebApi.start();

    log.info('Ready');


  } catch (e) {

    console.error(e);

  }
})();


