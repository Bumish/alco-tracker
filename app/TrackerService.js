'use strict';

const simpleflake = require('simpleflake');
const enrichers = require('./enrichers');
const writers = require('./writers');

class TrackerService {

  constructor(config, {storage, log}) {

    this.log = log.child({mod: 'TrackerService'});

    this.config = config;
    this.storage = storage;

    this.enrichers = Object.keys(enrichers).map(k => {
      return new enrichers[k](config.services[k], {log});
    });

    this.writers = Object.keys(writers).reduce((acc, k) => {
      const w = new writers[k](config.writers[k], {log});
      return acc.concat(w.configured ? [w] : []);
    },[]);
  }

  async init() {
    await Promise.all(this.writers.map(w => w.init()));
  }

  async enrich(msg) {

    (await Promise.all(
      this.enrichers.map(e => e.get(msg))
    )).forEach((data, i) => {
      if (data) {
        const section = this.enrichers[i].prefix;
        msg[section] = Object.assign(msg[section] || {}, data);
      }
    });

    return msg;
  }

  async toStore(msg) {

    msg.id = this.generateEventId();
    msg.time = new Date();

    await this.enrich(msg).then(msg => {
      this.writers.map(w => {
        w.write(Object.assign({}, msg));
      });
    }).catch(e => {
      this.log.error(e);
    });

  }

  generateEventId() {
    return simpleflake().toString('base10');
  }

  generateUid() {
    return simpleflake().toString('base10');
  }
}

module.exports = TrackerService;
