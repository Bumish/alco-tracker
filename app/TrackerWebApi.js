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
const AlcoJSSchema = require('./schema/alcojs');
const PixelSchema = require('./schema/pixel');

const asyncUtil = fn =>
  (req, res, next, ...args) =>
    fn(req, res, next, ...args)
      .catch(next);


class TrackerHttpApi {

  constructor(options, services) {

    const httpDefaults = {
      port: 8080,
      uidParam: 'uid'
    };

    this.log = services.log;
    this.options = options;
    this.options.http = Object.assign({}, httpDefaults, options.http);
    this.cookieMaxAge = this.options.http.cookieMaxAge;

    const {isProduction, http} = options;
    const {cookieMaxAge, trustProxy, uidParam} = http;


    this.log.info({
      isProduction,
      cookieMaxAge,
      trustProxy
    }, 'Starting HTTP api');

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
    this.app.use((req, res, next) => {
      // hack to handle json body without json headers
      if (req.path === '/track' && req.method === 'POST') {
        req.headers['content-type'] = 'application/json';
      }
      next();
    });
    this.app.use(bodyParser.json({limit: '5kb'}));
    this.app.use(bodyParser.urlencoded({
      extended: false,
      limit: '5kb'
    }));
    this.app.use(cookieParser());
    this.app.use(cors({
      origin: true,
      credentials: true
    }));

    this.app.use((req, res, next) => {

      this.stat.mark('request');

      // Track handling time
      req.startAt = timeMark();

      // Handling uid
      const receivedUid = req.query[uidParam] || req.cookies[uidParam];

      req.uid = isValidUid(receivedUid) && receivedUid || this.trackerService.generateUid();

      res.cookie(uidParam, req.uid, {
        expires: new Date(Date.now() + cookieMaxAge * 1000),
        httpOnly: true
      });

      next();

    });

    this.app.get('/img', asyncUtil(async (req, res) => {

      this.stat.mark('trackGif');
      res.type('gif')
        .send(emptyGif);

      const meta = {
        channel: 'pixel',
        uid: req.uid,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      };

      try {

        // if (req.query['b64']){
        const raw = Buffer.from(req.query['b64'], 'base64')
          .toString();
        const msg = Object.assign({}, JSON.parse(raw), meta);
        // }

        if (msg['error']) {
          this.log.warn('Tracking using pixel');
        }

        const clean = await Joi.validate(msg, PixelSchema);

        await this.trackerService.toStore(clean);

        this.stat.histPush('trackGifHandled', timeDuration(req.startAt));

      } catch (error) {
        this.log.error(error);
      }

    }));

    this.app.post('/track', asyncUtil(async (req, res) => {

      this.stat.mark('trackPost');

      const meta = {
        channel: 'alcojs',
        uid: req.uid,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      };

      if (Object.keys(req.body).length === 0) {
        return this.log.info(meta, 'Empty PostData');
      }

      const msg = Object.assign({}, req.body, meta);

      res.json({result: 'queued'});

      try {

        const clean = await AlcoJSSchema.validate(msg);

        await this.trackerService.toStore(clean);

        this.stat.histPush('trackPostHandled', timeDuration(req.startAt));


      } catch (err) {

        this.stat.mark('err-validation-alcojs');
        this.log.error(msg, err.message);

      }

      this.stat.histPush('trackPostResponse', timeDuration(req.startAt));

    }));

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

    this.app.all('/webhook/:projectId/:service/:action', (req, res) => {

      this.stat.mark('webhook');

      const msg = {
        channel: 'webhook',
        name: `${req.params.service}/${req.params.action}`,
        projectId: req.params.projectId,
        service: req.params.service,
        action: req.params.action,
        data: Object.assign({}, req.body, req.query),
        remote_ip: req.ip
      };

      res.json({result: 'queued'});

      this.trackerService.toStore(msg)
        .then(() => {
          this.stat.histPush('webhookHandled', timeDuration(req.startAt));
        });

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
        res.status(500)
          .json({error: true});
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
