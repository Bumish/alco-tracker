'use strict';

const got = require('got');

const dsnParse = require('../functions/dsnParse');

class CHReader {

  constructor(options, services) {

    const {log} = services;
    this.log = log.child({module: 'CHReader'});
    const {dsn} = options;
    const connectionOptions = dsnParse(dsn);

    this.ch_db = connectionOptions.path || 'unknown';

    // CH options

    this.ch_host = connectionOptions.hostname || 'localhost';
    this.ch_port = connectionOptions.port || '8123';


    this.ch_url = `${this.ch_host  }:${  this.ch_port}`;

    this.log.info({host: this.ch_host}, 'construction CH reader');

  }


  query(q) {

    const queryParams = {
      database: this.ch_db,
      query: q
    };

    this.log.debug(queryParams, 'Query');

    return got(this.ch_url, {query: queryParams})
      .then(response => response.body)
      .catch(err => this.log.error(err, 'Error during querying data'));
  }


  query_sream(q) {

    const queryParams = {
      database: this.ch_db,
      query: q
    };

    this.log.debug(queryParams, 'Query stream');
    return got.stream(this.ch_url, {query: queryParams});
  }
}

module.exports = CHReader;
