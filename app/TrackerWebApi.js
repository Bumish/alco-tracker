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

const Joi = require('joi');

const afs = Promise.promisifyAll(fs);
const {timeMark, timeDuration} = require('./ServiceStat');
const alcoRequesrSchema = require('./schema/alcoRequest');

class TrackerHttpApi {

  constructor(options, services) {

    const httpDefaults = {
      port: 8080,
      uidParam: 'uid'
    };

    this.options = options;
    this.options.http = Object.assign({}, httpDefaults, options.http);
    this.cookieMaxAge = this.options.http.cookieMaxAge;

    const {cookieMaxAge, trustProxy, uidParam} = this.options.http;

    console.log('Starting HTTP api. Environment:', this.options.isProduction ? 'production' : 'development');
    console.log(`Configured statsd at host ${options.statsd.host}`);
    console.log(`HTTP options: cookieMaxAge: ${cookieMaxAge}`);

    const {trackerService, stat} = services;

    // App stats
    this.stat = stat;

    // Tracker
    this.trackerService = trackerService;

    // Client options

    const {client} = options;
    this.lib = null;

    this.clientOptions = client && client.common || {};

    this.app = express();
    this.app.set('x-powered-by', false);
    this.app.set('trust proxy', trustProxy);
    this.app.set('etag', 'strong');
    this.app.use(cookieParser());
    this.app.use(cors({
      origin: true,
      credentials: true
    }));

    console.log('Trust proxy:', trustProxy && trustProxy.join(','));

    this.app.use((req, res, next) => {

      this.stat.mark('request');

      // Track handling time
      req.startAt = timeMark();

      // Handling uid
      const receivedUid = req.query[uidParam] || req.cookies[uidParam];

      req.uid = isValidUid(receivedUid) && receivedUid || this.trackerService.generateUid();

      res.cookie(uidParam, req.uid, {expires: new Date(Date.now() + cookieMaxAge * 1000), httpOnly: true});

      next();

    });

    this.app.get('/track', (req, res) => {

      this.stat.mark('trackGif');

      res.type('gif').send(emptyGif);

    });

    this.app.post('/track', bodyParser.json({type: '*/*'}), (req, res) => {

      this.stat.mark('trackPost');

      alcoRequesrSchema.validate(req.body, (err, value) => {
        if (err) {
          console.log(err);
        }
      });


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
    console.log('starting http api on port:', this.options.http.port);
    console.log(`to access stats: /stat?key=${this.stat.getSecret()}`);
    this.app.listen(this.options.http.port, this.options.http.host);

  }
}

module.exports = TrackerHttpApi;
