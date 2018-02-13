'use strict';

const pick = require('es6-pick');
const Joi = require('joi');

const CHBufferWriter = require('../storage/CHBufferWriter');
const CHUploader = require('../storage/CHUploader');
const dsnParse = require('../functions/dsnParse');
const flatten = require('../functions/flatten');
const unzip = require('../functions/unzip');
const eventSchema = require('../schema/clickHouseEvent');

const EVENTS_TABLE = 'events';
const WEBHOOKS_TABLE = 'webhooks';

class ClickHouse {

  constructor(options) {

    this.defaults = {
      uploadInterval: 5,
      enabled: false
    };

    this.options = Object.assign({}, this.defaults, options);
    this.configured = this.options.enabled && this.options.dsn && true;

    this.writers = new Map();

    if (this.configured) {
      const connOptions = dsnParse(this.options.dsn);

      this.uploader = new CHUploader(connOptions);

      console.log('ClickHouse writer activated');
    }

    setInterval(() => this.upload(), this.options.uploadInterval * 1000);
  }

  isConfigured() {
    return this.configured;
  }

  getWriter(table) {
    if (!this.writers.has(table)) {
      this.writers.set(table, new CHBufferWriter(table));
    }
    return this.writers.get(table);
  }

  upload() {

    if (!this.configured) {
      return;
    }

    const writers = this.writers;
    this.writers = new Map();

    for (const [table, writer] of writers) {
      writer.close().then(filename => {
        this.uploader.uploadFile(filename, table);
      });
    }
  }


  send_webhook(msg) {

    if (!this.configured) {
      return;
    }

    let record = pick(msg, 'id', 'projectId', 'service', 'action', 'request_ip');

    record.timestamp = msg.time.getTime();
    record.dateTime = msg.time.toISOString().slice(0, 19).replace('T', ' ');
    record.date = record.dateTime.substr(0, 10);

    record.data = unzip(msg.data, String, String);
    record = flatten(record, '.');

    this.getWriter(WEBHOOKS_TABLE).push(record);

  }

  send_event(msg) {

    if (!this.configured) {
      return;
    }

    const {page, session, library, data, client, browser, country, region, city, os, device, user, ...rest} = msg;

    let record = pick(rest, 'id', 'projectId', 'name', 'uid', 'ip', 'userAgent');

    record.timestamp = rest.time.getTime();
    record.dateTime = rest.time.toISOString().slice(0, 19).replace('T', ' ');
    record.date = record.dateTime.substr(0, 10);

    record.page = pick(page, 'url', 'referrer', 'title');

    record.user = pick(user || {}, 'id', 'traits', 'ymId', 'gaId');
    record.user.traits = unzip(record.user.traits, String, String);

    record.session = pick(session, 'type', 'engine', 'num', 'hasMarks', 'start', 'refHost', 'pageNum', 'eventNum');

    const marks = session.marks || {};

    record.campaign = marks.utm_campaign || marks.os_campaign;
    record.source = marks.utm_source || marks.os_source;

    record.session.marks = unzip(session.marks, String, String);

    record.lib = pick(library || {}, 'name', 'libver', 'snippet');
    record.client = pick(client || {}, 'type', 'name', 'version', 'tz', 'ts', 'tzOffset', 'platform', 'product');
    record.browser = pick(browser || {}, 'if', 'wh');
    record.browser.sr = pick(browser.sr || {}, 'tot', 'avail', 'asp', 'oAngle', 'oType');
    record.country = pick(country || {}, 'iso', 'name_ru', 'name_en');
    record.region = pick(region || {}, 'iso', 'name_ru', 'name_en');
    record.city = pick(city || {}, 'id', 'name_ru', 'name_en');
    record.os = pick(os || {}, 'name', 'version', 'platform');
    record.device = pick(device || {}, 'type', 'brand', 'model');
    record.isBot = typeof rest.isBot === 'boolean' ? Number(rest.isBot) : -1;
    record.data = unzip(data, String, String);

    record = flatten(record, '_');

    Joi.validate(record, eventSchema).then(values => {

      this.getWriter(EVENTS_TABLE).push(values);

    }).catch(err => {

      console.error(err);

    });


  }
}

module.exports = ClickHouse;
