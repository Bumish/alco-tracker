'use strict';

const path = require('path');

require('dotenv').config();

const TrackerService = require('./TrackerService');
const TrackerWebApi = require('./TrackerWebApi');
const LocalConfig = require('./config/LocalConfig');
const Storage = require('./Storage');

const localConfig = new LocalConfig({
  path: path.resolve(__dirname, '..', 'config')
});


(async () => {

  try {

    console.log('Starting Alcolytics tracker');

    const config = await localConfig.serviceConfig();

    console.log('config', config);

    const storage = new Storage(config);
    const trackerService = new TrackerService(config, storage);
    const trackerWebApi = new TrackerWebApi(config, trackerService);

    // Initializing storage
    await storage.init();

    // Initializing main service
    await trackerService.init();

    // Starting HTTP API
    await trackerWebApi.start();

    console.log('Ready');


  } catch (e) {

    console.error(e);

  }
})();


