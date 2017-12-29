'use strict';

const isProduction = process.env.NODE_ENV === 'production';
const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const cors = require('cors');
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const url = require('url');
const path = require('path');
const pick = require('es6-pick');


class TrackerHttpApi {

  constructor(options, trackerService) {

    console.log('Starting HTTP api. Environment:', isProduction ? 'production': 'development');

    this.trackerService = trackerService;
    this.defaults = {
      port: 8080,
      uidParam: 'uid'
    };

    this.options = Object.assign({}, this.defaults, options.http);
    this.lib = null;

    const uidParam = this.options.uidParam;
    const tp = this.options.trustProxy;

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

      req.uid = req.query[uidParam]
        ? req.query[uidParam]
        : req.cookies[uidParam] || this.trackerService.generateUid();

      res.cookie(uidParam, req.uid, { expires: new Date(Date.now() + this.options.cookieMaxAge * 1000), httpOnly: true });

      next();

    });

    this.app.post('/track', bodyParser.json({type:'*/*'}), (req, res) => {

      const msg = Object.assign({}, req.body, {
        uid: req.uid,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });

      this.trackerService.track(msg);

      res.json({result: 'queued'});

    });

    this.app.get('/lib.js', (req, res) => {

      const commands = `window.alco&&window.alco('setInitialUid','${req.uid}');`;
      const contentLength = Buffer.byteLength(commands) + this.lib.byteLength;
      res.setHeader('Content-Length', contentLength);
      res.type('js');
      res.write(commands);
      res.write(this.lib);
      res.end();

    });

    this.app.use(function(err, req, res, next) {
      console.error(err.stack);
      res.status(500).json({error: true});
    });
  }

  async start() {

    const fn = isProduction ? 'lib.js' : 'lib-dev.js';
    console.log(`loading client library (${fn}).`);
    this.lib = await fs.readFileAsync(path.join(__dirname, '..', 'alcojs', fn));
    console.log(`loaded. size: ${this.lib.length}`);
    console.log('starting http api on port:', this.options.port);
    this.app.listen(this.options.port, this.options.host);

  }
}

module.exports = TrackerHttpApi;
