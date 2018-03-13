'use strict';

const https = require('https');
const fs = require('fs');
const Promise = require('bluebird');
const WebSocket = require('ws');
const Joi = require('joi');
const readFileAsync = Promise.promisify(fs.readFile);

const {
  timeMark,
  timeDuration
} = require('./ServiceStat');

// WS errors catching
// ws.send('something', function ack(error) {
// If error is not defined, the send has been completed, otherwise the error
// object will indicate what failed.
// });

// Immediate errors can also be handled with `try...catch`, but **note** that
// since sends are inherently asynchronous, socket write failures will *not* be
// captured when this technique is used.
//     try { ws.send('something'); }
//     catch (e) { /* handle error */ }


/**
 * @property {Object|undefined} httpsOptions
 * @property {WebSocket} wss
 */
class TrackerWsApi {
  constructor(options, {trackerService, stat, log}) {

    this.log = log.child({name: this.constructor.name});

    this.options = options;
    this.httpsOpts = options.ws && options.ws.https;

    this.wss = null;
  }

  async init() {

    if (this.httpsOpts) {
      await this.startHttps(this.httpsOpts);
    }
  }


  async startHttps(transportOpts) {

    const {host, port, cert, key, ...tlsOpts} = transportOpts;
    this.log.info({host, port, tlsOpts}, 'starting WS on https');

    const server = https.createServer({
      cert: await readFileAsync(cert),
      key: await readFileAsync(key),
      ...tlsOpts
    });
    server.listen(port, host);

    this.wss = new WebSocket.Server({
      server,
      path: '/ws',
      perMessageDeflate: {
        zlibDeflateOptions: { // See zlib defaults.
          chunkSize: 1024,
          memLevel: 7,
          level: 3
        },
        zlibInflateOptions: {
          chunkSize: 10 * 1024
        },
        // Other options settable:
        clientNoContextTakeover: true, // Defaults to negotiated value.
        serverNoContextTakeover: true, // Defaults to negotiated value.
        clientMaxWindowBits: 10,       // Defaults to negotiated value.
        serverMaxWindowBits: 10,       // Defaults to negotiated value.
        // Below options specified as default values.
        concurrencyLimit: 10,          // Limits zlib concurrency for perf.
        threshold: 1024               // Size (in bytes) below which messages
        // should not be compressed.
      }
    });

    this.wss.on('connection', (ws, req) => {
      ws.isAlive = true;

      this.log.info('connected');

      this.log.info(req.headers);

      const ip2 = req.connection.remoteAddress;
      const ip3 = req.headers['x-forwarded-for'];

      ws.on('message', (message) => {
        console.log('received: %s', message);
      });
    });

    this.log.info('started');
  }


  broadcast(data) {

    this.wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }

}

module.exports = TrackerWsApi;
