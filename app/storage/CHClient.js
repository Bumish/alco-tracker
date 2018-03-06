'use strict';

const fs = require('fs');

const Promise = require('bluebird');
const got = require('got');

const afs = Promise.promisifyAll(fs);


class CHClient {

  constructor(options, {log}) {

    options = options || {};

    this.log = log.child({module: 'CHClient'});
    this.ch_url = `${options.protocol}//${options.hostname}:${options.port}`;
    this.db = options.db;
    this.httpOptions = {
      timeout: 5000
    };

    this.log.info({host: this.ch_url}, 'construction CH reader');

  }

  run(q) {

    const queryParams = {
      database: this.db
    };

    this.log.debug(queryParams, 'Query');

    return got.post(
      this.ch_url,
      {query: queryParams, body: q}
    ).then(
      response => response.body
    ).catch(
      err => this.log.error(err, 'Error during querying data')
    );
  }

  query(q) {

    const queryParams = {
      database: this.db,
      query: q
    };

    this.log.debug(queryParams, 'Query');

    return got(
      this.ch_url,
      {query: queryParams}
    ).then(
      response => response.body
    ).catch(
      err => this.log.error(err, 'Error during querying data')
    );
  }

  query_sream(q) {

    const queryParams = {
      database: this.db,
      query: q
    };

    this.log.debug(queryParams, 'Query stream');
    return got.stream(this.ch_url, {query: queryParams});
  }

  tables_columns() {

    return this.query(`
      SELECT table, name, type 
      FROM system.columns 
      WHERE database = '${this.db}' FORMAT JSON
    `).then((result) => {
      return JSON.parse(result).data;
    });
  }


  uploadFile(fn, table){

    const queryParams = {
      database: this.db,
      query: `INSERT INTO ${table} FORMAT JSONEachRow`
    };

    this.log.debug(queryParams, 'Query');

    afs.createReadStream(fn)
    .pipe(got.stream.post(this.ch_url, Object.assign({}, this.httpOptions, {query: queryParams}) ))
    .on('error', (err, body, res) => {
      this.log.error(err, 'Upload error');
    })
    .on('response', response => {
      if(response.statusCode === 200){

        afs.unlinkAsync(fn).then(() => {});

      } else {

        this.log.warn({body: response.body, code: response.statusCode}, 'Wrong code');
      }
    });
  }

}

module.exports = CHClient;
