'use strict';

const Mixpanel = require('mixpanel');
const pick = require('es6-pick');

const flatten = require('../functions/flatten');

class MixPanel {

  constructor(options, services) {

    this.defaults = {
      uploadInterval: 1, // seconds
      enabled: false
    };

    this.log = services.log.child({module: 'MPDataWriter'});
    this.options = Object.assign({}, this.defaults, options);
    this.configured = this.options.enabled && this.options.token && true;

    this.queue = [];

    if (!this.configured) {
      return;
    }

    this.mp = Mixpanel.init(this.options.token, {
      protocol: 'https'
    });

    setInterval(() => this.upload(), this.options.uploadInterval * 1000);

    this.log.info('Mixpanel writer activated');
  }

  isConfigured() {
    return this.configured;
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


  send_webhook(msg) {

    msg.time = Math.round(msg.time.getTime() / 1000);
    msg.name = `${msg.service}-${msg.action}`;

    this.queue.push(msg);

  }


  send_event(msg) {


    if (!this.configured) {
      return;
    }

    const mpEvent = flatten(pick(msg, 'name', 'id', 'ip', 'projectId', 'session', 'browser', 'client', 'device',
      'ymClientId', 'gaClientId', 'os', 'country', 'region', 'city', 'page', 'data', 'user', 'library', 'perf'
    ));

    mpEvent.time = Math.round(msg.time.getTime() / 1000);
    mpEvent.distinct_id = msg.uid;

    this.queue.push(mpEvent);

  }
}


module.exports = MixPanel;
