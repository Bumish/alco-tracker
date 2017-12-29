'use strict';

const Mixpanel = require('mixpanel');
const pick = require('es6-pick');
const flatten = require('../functions/flatten');

class MixPanel {

  constructor(options){

    this.defaults = {
      uploadInterval: 1, // seconds
      enabled: false
    };

    this.options = Object.assign({}, this.defaults, options);
    this.configured = this.options.enabled && this.options.token && true;

    this.queue = [];

    if(!this.configured) return;

    this.mp = Mixpanel.init(this.options.token, {
      protocol: 'https'
    });

    setInterval(() => this.upload(), this.options.uploadInterval * 1000);

    console.log('Mixpanel writer activated');
  }

  isConfigured(){
    return this.configured;
  }

  upload(){

    const calls = this.queue;
    this.queue = [];

    if(calls.length > 0){

      this.mp.track_batch(calls.map(call => {
        const {name, ...rest} = call;
        return {
          event: name,
          properties: rest
        }
      }));
    }
  };

  push(msg){


    if(!this.configured){
      return;
    }

    const mpEvent = flatten(pick(msg, 'name', 'id', 'ip', 'projectId', 'session',  'browser', 'client', 'device',
      'ymClientId', 'gaClientId', 'os', 'country', 'region', 'city', 'page', 'data', 'user', 'library'
    ));

    mpEvent.distinct_id = msg.uid;
    mpEvent.time = Math.round(msg.time.getTime() / 1000);

    this.queue.push(mpEvent);

  }
}


module.exports = MixPanel;
