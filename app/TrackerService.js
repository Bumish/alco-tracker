'use strict';

const simpleflake = require('simpleflake');
const Enrichers = require('./enrichers');
const Writers = require('./writers');

class TrackerService {

  constructor(config, {storage, log, stat}) {

    this.log = log.child({name: this.constructor.name});

    this.config = config;
    this.storage = storage;

    this.enrichers = Object.keys(Enrichers).map(k => {
      return new Enrichers[k](config.services[k], {log});
    });

    this.writers = Object.keys(Writers).reduce((acc, k) => {
      const w = new Writers[k](config.writers[k], {log, stat});
      return acc.concat(w.configured ? [w] : []);
    },[]);

    setInterval(() => {
      const currentStat = stat.getStat();
      this.log.info(currentStat.counters)
    },3e5)

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
