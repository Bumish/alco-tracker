'use strict';

const path = require('path');

require('dotenv').config();

const TrackerService = require('./TrackerService');
const TrackerWebApi = require('./TrackerWebApi');
const ServiceStat = require('./ServiceStat');
const LocalConfig = require('./config/LocalConfig');
const Storage = require('./Storage');

const localConfig = new LocalConfig({
  path: path.resolve(__dirname, '..', 'config')
});


(async () => {

  try {

    console.log('Starting Alcolytics tracker');

    const config = await localConfig.serviceConfig();
    config.isProduction = process.env.NODE_ENV === 'production';

    console.log('config', config);

    const services = {
      stat: new ServiceStat(config),
      storage: new Storage(config)
    };

    services.trackerService = new TrackerService(config, services);
    services.trackerWebApi = new TrackerWebApi(config, services);

    // Initializing storage
    await services.storage.init();

    // Initializing main service
    await services.trackerService.init();

    // Starting HTTP API
    await services.trackerWebApi.start();

    console.log('Ready');


  } catch (e) {

    console.error(e);

  }
})();


