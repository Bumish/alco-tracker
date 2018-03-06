const { tasks, shell, find, read, write } = require('ygor');
const { transform } = require('babel-core');

config.isProduction = process.env.NODE_ENV === 'production';

const path = require('path');
require('dotenv').config();
const pino = require('pino');


const TrackerService = require('./app/TrackerService');

async function init() {

  const config = await localConfig.serviceConfig();


}

async function dumpEventsSchema() {

}


tasks.add('dump_schema', dumpEventsSchema);

// .add('default', bundle)
