'use strict';

const crypto = require('crypto');

const Measured = require('measured');
const StatsD = require('statsd-client');

class ServiceStat {
  constructor(options) {

    this.statsd = new StatsD(options.statsd);

    this.counter = Measured.createCollection();
    this.hists = {};

    this.secret = crypto.randomBytes(32).toString('hex');
  }

  getHist(name) {
    if (!this.hists[name]) {
      this.hists[name] = new Measured.Histogram();
    }
    return this.hists[name];
  }

  histsList() {
    return Object.keys(this.hists);
  }

  histPush(name, value) {
    const hist = this.getHist(name);
    hist.update(value);
    this.statsd.timing(`rt.${name}`, value);

  }

  mark(name) {
    this.counter.meter(name).mark();
    this.statsd.increment(`cnt.${name}`);
  }

  getSecret() {
    return this.secret;
  }

  checkSecret(secret) {
    return this.secret === secret;
  }

  getStat() {
    const stat = {
      counters: this.counter.toJSON()
    };
    for (const name of this.histsList()) {
      stat[`hist.${name}`] = this.getHist(name).toJSON();
    }
    return stat;
  }

  /**
   * Duration
   * @param startAt
   * @return {number} nanoseconds
   */
  static timeDuration(startAt) {
    const diff = process.hrtime(startAt);
    const time = diff[0] * 1e3 + diff[1] * 1e-6;
    return Math.round(time);
  };


  static timeMark() {
    return process.hrtime();
  }


}

module.exports = ServiceStat;
