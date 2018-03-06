'use strict';

const Mixpanel = require('mixpanel');
const pick = require('es6-pick');

const flatten = require('../functions/flatten');

class MixPanel {

  constructor(options, {log}) {

    this.defaults = {
      uploadInterval: 1, // seconds
      enabled: false
    };

    this.log = log.child({name: this.constructor.name});
    this.options = Object.assign({}, this.defaults, options);
    this.configured_flag = this.options.enabled && this.options.token && true;

    this.queue = [];

    this.mp = Mixpanel.init(this.options.token, {
      protocol: 'https'
    });

    setInterval(() => this.upload(), this.options.uploadInterval * 1000);

    this.log.info('Mixpanel writer activated');
  }

  /**
   * Initialize stub
   * @return {Promise<boolean>}
   */
  async init() {
    return true;
  }

  upload() {
    const calls = this.queue;
    this.queue = [];

    if (calls.length > 0) {

      this.mp.track_batch(calls.map(call => {
        const {name, ...rest} = call;
        return {
          event: name,
          properties: rest
        };
      }));
    }
  }

  write(msg) {

    const {type, time, ...rest} = msg;

    if (rest.uid) {
      rest.distinct_id = rest.uid;
    }

    rest.time = Math.round(time.getTime() / 1000);

    this.queue.push(flatten(rest));

  }
}


module.exports = MixPanel;
