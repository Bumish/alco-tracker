'use strict';

const simpleflake = require('simpleflake');
const pick = require('es6-pick');

const CHWriter = require('./writers/ClickHouse');
const MPWriter = require('./writers/MixPanel');
const HttpConnector = require('./HttpConnector');

class TrackerService {

  constructor(config, storage) {

    this.config = config;
    this.storage = storage;

    this.sypexgeoService = new HttpConnector(config.services.sypexgeo);
    this.devicedService = new HttpConnector(config.services.deviced);

    const availableWriters = [
      new CHWriter(config.clickhouse),
      new MPWriter(config.mixpanel)
    ];

    this.writers = availableWriters.filter(e => e.isConfigured());
  }

  async init() {

  }

  async enrich(msg) {

    if (msg.ip) {
      const geo = await this.sypexgeoService.query({ip: msg.ip});

      if (geo.success === true) {
        msg.country = Object.assign(pick(geo.country || {}, 'iso', 'name_ru', 'name_en'), msg.country);
        msg.region = Object.assign(pick(geo.region || {}, 'iso', 'name_ru', 'name_en'), msg.region);
        msg.city = Object.assign(pick(geo.city || {}, 'id', 'name_ru', 'name_en'), msg.city);
      }
    }

    if (msg.userAgent) {

      const dd = await this.devicedService.query({ua: msg.userAgent});

      if (dd.success === true) {

        msg.isBot = dd.isBot;

        if (dd.isBot) {

          msg.device = Object.assign({
            type: 'bot',
            brand: dd.producer && dd.producer.name,
            model: dd.bot && dd.bot.name
          }, msg.device || {});

        } else {

          msg.os = Object.assign(pick(dd.os || {}, 'name', 'version', 'platform'), msg.os || {});
          msg.client = Object.assign(pick(dd.client || {}, 'type', 'name', 'version'), msg.client || {});
          msg.device = Object.assign(pick(dd.device || {}, 'type', 'brand', 'model'), msg.device || {});

        }
      }
    }

    return msg;
  }

  async track(msg) {

    msg.id = this.generateEventId();
    msg.time = new Date();

    await this.enrich(msg)
      .then(msg => {
        this.writers.map(w => {
          w.push(Object.assign({}, msg));
        });
      })
      .catch(e => {
        console.error(e);
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
