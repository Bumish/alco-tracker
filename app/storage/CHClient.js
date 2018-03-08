'use strict';

const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const {timeMark, timeDuration} = require('../ServiceStat');
const got = require('got');

const CHBufferWriter = require('./CHBufferWriter');

/**
 * Base ClickHouse lib.
 * Used for raw data queries and modifications
 * Also provide object-push style writing
 * @property {ServiceStat} stat Internal stat service
 */
class CHClient {

  /**
   *
   * @param options
   * @param log
   * @param services
   */
  constructor(options, {log, ...services}) {

    this.log = log.child({name: this.constructor.name});
    this.log.info({url: this.url}, 'Starting ClickHouse client');

    // Binding services
    Object.assign(this, services);

    this.options = Object.assign({
      uploadInterval: 5000,
      enabled: false
    }, options);

    // GOT http options
    this.uploadOptions = {
      timeout: 10000,
      retries: 1,
      followRedirect: false
    };

    const {protocol, hostname, port, db} = this.options;
    this.db = db;
    this.url = `${protocol}//${hostname}:${port}`;

    this.writers = new Map();

    /**
     * Returns writer for table
     * @param table
     * @return {CHBufferWriter}
     */
    this.getWriter = (table) => {
      if (!this.writers.has(table)) {
        this.writers.set(table, new CHBufferWriter({table}, {log, ...services}));
      }
      return this.writers.get(table);
    };
  }

  init() {

    setInterval(
      () => this.flushWriters(),
      this.options.uploadInterval);

    this.log.info('Started');
  }


  /**
   * Execution data modification query
   * @param query
   */
  execute(query) {

    const queryParams = {
      database: this.db
    };

    this.log.debug(Object.assign({query}, queryParams), 'Query');

    return got.post(
      this.url, {
        query: queryParams,
        body: query
      })
      .then(res => res.body)
      .catch(err => this.log.error({
        err: `${err.statusCode}: ${err.statusMessage}`,
        body: err.response.body
      }, 'Error during executing query'));
  }

  /**
   * Executes query and return resul
   * @param query <string> SQL query
   * @return Promise<Buffer>
   */
  query(query) {

    const params = {
      database: this.db,
      query
    };

    this.log.debug(params, 'Query');

    return got(this.url, {query: params})
      .then(response => response.body)
      .catch(
        err => this.log.error(err, 'Error during querying data'));
  }

  /**
   * Executes query and return stream
   * @param query <string> SQL query
   * @return Stream
   */
  querySream(query) {

    const queryParams = {
      database: this.db,
      query
    };

    this.log.debug(queryParams, 'Query stream');
    return got.stream(this.url, {query: queryParams});
  }

  /**
   * Returns DB structure
   * @return Promise<Buffer>
   */
  tables_columns() {
    return this.query(`SELECT table, name, type FROM system.columns WHERE database = '${this.db}' FORMAT JSON`)
      .then(result => JSON.parse(result.toString()))
      .then(parsed => parsed.data);
  }


  /**
   * Flushing writers
   */
  flushWriters() {
    const tasks = [...this.writers.values()];
    this.writers.clear();

    for (const task of tasks) {

      this.log.debug(`uploding ${task.table}`);

      task.close()
        .then(({table, filename, buffer}) => {
          this.handleBuffer({
            table,
            filename,
            buffer
          });
        })
        .catch(error => {
          this.log.error(error, 'File close error')
        });
    }
  }

  /**
   * Uploading each-line-json to ClickHouse
   */
  handleBuffer({table, filename, buffer}) {

    if (!buffer.byteLength) {
      return this.unlinkFile(filename);
    }

    const queryParams = {
      database: this.db,
      query: `INSERT INTO ${table} FORMAT JSONEachRow`
    };

    this.stat.mark(`ch-upload-${table}`);
    this.log.debug(queryParams, 'Query');

    const startAt = timeMark();

    got.stream.post(this.url, Object.assign({}, this.uploadOptions, {
      query: queryParams,
      body: buffer
    }))
      .on('error', (error, body, response) => {
        this.stat.histPush(`ch-upload-${table}-error`, timeDuration(startAt));
        this.log.warn({
          body: response.body,
          code: response.statusCode
        }, 'Error uploading to CH');
      })
      .on('response', res => {
        if (res.statusCode === 200) {
          this.stat.histPush(`ch-upload-${table}`, timeDuration(startAt));
          this.unlinkFile(filename).then(null);
          this.log.debug(`Upload result: ${res.statusCode} ${res.statusMessage}`);
        }
        else {
          this.log.warn({
            body: res.body,
            code: res.statusCode
          }, 'Wrong code');
        }
      });
  }

  unlinkFile(filename) {
    return fs.unlinkAsync(filename)
      .then(() => {
        this.log.debug('file unlinked');
      });
  }

}

module.exports = CHClient;
