'use strict';

const fs = require('fs');
const path = require('path');

const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const Promise = require('bluebird');
const express = require('express');
const cors = require('cors');

const isValidUid = require('./functions/isValidUid');
const emptyGif = require('./functions/emptyGif');

const afs = Promise.promisifyAll(fs);
const {timeMark, timeDuration} = require('./ServiceStat');

class TrackerHttpApi {

  constructor(options, services) {

    this.options = Object.assign({}, this.defaults, options.http);

    console.log('Starting HTTP api. Environment:', this.options.isProduction ? 'production' : 'development');
    console.log(`Configured statsd at host ${options.statsd.host}`);

    const {trackerService, stat} = services;

    // App stats
    this.stat = stat;

    // Tracker
    this.trackerService = trackerService;
    this.defaults = {
      port: 8080,
      uidParam: 'uid'
    };


    this.lib = null;

    const uidParam = this.options.uidParam;
    const tp = this.options.trustProxy;

    // Client options

    const {client} = options;

    this.clientOptions = client && client.common || {};

    this.app = express();
    this.app.set('x-powered-by', false);
    this.app.set('trust proxy', tp);
    this.app.set('etag', 'strong');
    this.app.use(cookieParser());
    this.app.use(cors({
      origin: true,
      credentials: true
    }));

    console.log('Trust proxy:', tp && tp.join(','));

    this.app.use((req, res, next) => {

      // Track handling time
      req.startAt = timeMark();

      // Handling uid
      const receivedUid = req.query[uidParam] || req.cookies[uidParam];

      req.uid = isValidUid(receivedUid) && receivedUid || this.trackerService.generateUid();

      res.cookie(uidParam, req.uid, {expires: new Date(Date.now() + this.options.cookieMaxAge * 1000), httpOnly: true});

      next();

    });

    this.app.get('/track', (req, res) => {

      this.stat.mark('trackGif');

      res.type('gif').send(emptyGif);

    });

    this.app.post('/track', bodyParser.json({type: '*/*'}), (req, res) => {

      this.stat.mark('trackPost');

      const msg = Object.assign({}, req.body, {
        uid: req.uid,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });

      this.trackerService.track(msg).then(() => {
        this.stat.histPush('trackPostHandled', timeDuration(req.startAt));
      });

      res.json({result: 'queued'});

      this.stat.histPush('trackPostResponse', timeDuration(req.startAt));

    });

    this.app.get('/lib.js', (req, res) => {


      this.stat.mark('lib');

      const clientConfig = {
        initialUid: req.uid
      };

      Object.assign(clientConfig, this.clientOptions);

      const cmd = new Buffer(`window.alco&&window.alco('configure',${JSON.stringify(clientConfig)});`);
      res.send(Buffer.concat([cmd, this.lib]));

      this.stat.histPush('libResponse', timeDuration(req.startAt));

    });

    this.app.get('/stat', (req, res) => {

      res.json(this.stat.checkSecret(req.query.key)
        ? this.stat.getStat()
        : {error: 'wrong secret'}
      );

    });

    this.app.use((err, req, res, next) => {

      this.stat.mark('error');

      console.error('Error middleware', err.message, err.stack);
      if (!res.headersSent) {
        res.status(500).json({error: true});
      }

    });
  }

  async start() {

    const fn = this.options.isProduction ? 'lib.js' : 'lib-dev.js';
    console.log(`loading client library (${fn}).`);
    this.lib = await afs.readFileAsync(path.join(__dirname, '..', 'alcojs', fn));
    console.log(`loaded. size: ${this.lib.length}`);
    console.log('starting http api on port:', this.options.port);
    console.log(`to access stats: /stat?key=${this.stat.getSecret()}`);
    this.app.listen(this.options.port, this.options.host);

  }
}

module.exports = TrackerHttpApi;
