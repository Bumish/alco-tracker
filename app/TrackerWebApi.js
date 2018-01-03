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
const isValidUid = require('./functions/isValidUid');
const emptyGif = require('./functions/emptyGif');
const StatsD = require('statsd-client');
const Measured = require('measured');

// Stats
const reqsStat = Measured.createCollection();
const rtHistTrack = new Measured.Histogram();
const rtHistLib = new Measured.Histogram();
const statsSecret = require('crypto').randomBytes(32).toString('hex');

/**
 * Duration
 * @param startAt
 * @return {number} nanoseconds
 */
const duration = function (startAt) {
  const diff = process.hrtime(startAt);
  const time = diff[0] * 1e3 + diff[1] * 1e-6;
  return Math.round(time);
};

class TrackerHttpApi {

  constructor(options, trackerService) {

    console.log('Starting HTTP api. Environment:', isProduction ? 'production' : 'development');

    // Statsd

    console.log(`Configured statsd at host ${options.statsd.host}`);
    this.statsd = new StatsD(options.statsd);

    // Tracker
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

      // Execution time
      req.startAt = process.hrtime();

      // Handling uid
      let receivedUid = req.query[uidParam] || req.cookies[uidParam];

      req.uid = isValidUid(receivedUid) && receivedUid || this.trackerService.generateUid();

      res.cookie(uidParam, req.uid, {expires: new Date(Date.now() + this.options.cookieMaxAge * 1000), httpOnly: true});

      next();

    });

    this.app.get('/track', (req, res) => {

      reqsStat.meter('trackGif').mark();
      this.statsd.increment('reqs.trackGif');

      res.type('gif');
      res.send(emptyGif);

    });

    this.app.post('/track', bodyParser.json({type: '*/*'}), (req, res) => {

      reqsStat.meter('trackPost').mark();
      this.statsd.increment('reqs.trackPost');

      const msg = Object.assign({}, req.body, {
        uid: req.uid,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });

      this.trackerService.track(msg);

      res.json({result: 'queued'});

      rtHistTrack.update(duration(req.startAt));
      this.statsd.timing('rt.trackPost', duration(req.startAt));

    });

    this.app.get('/lib.js', (req, res) => {

      reqsStat.meter('lib').mark();
      this.statsd.increment('reqs.lib');

      const cmd = new Buffer(`window.alco&&window.alco('configure',{initialUid:'${req.uid}'});`);
      res.send(Buffer.concat([cmd, this.lib]));

      rtHistLib.update(duration(req.startAt));
      this.statsd.timing('rt.lib', duration(req.startAt));

    });

    this.app.get('/stat', (req, res) => {

      res.json(req.query.key === statsSecret
        ? {
          reqs: reqsStat.toJSON(),
          track: rtHistTrack.toJSON(),
          lib: rtHistLib.toJSON()
        }
        : {error: 'wrong secret'}
      );

    });

    this.app.use(function (err, req, res, next) {

      reqsStat.meter('error').mark();

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
    console.log(`to access stats: /stat?key=${statsSecret}`);
    this.app.listen(this.options.port, this.options.host);

  }
}

module.exports = TrackerHttpApi;
