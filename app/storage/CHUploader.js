'use strict';

const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));

const got = require('got');

class CHUploader {

  constructor(options){

    options = options || {};

    this.ch_url = options.protocol + '//' + options.hostname + ':' + options.port;
    this.db = options.db;
    this.httpOptions = {
      timeout: 5000
    }
  }

  uploadFile(fn, table){

    const query = {
      database: this.db,
      query: `INSERT INTO ${table} FORMAT JSONEachRow`
    };

    fs.createReadStream(fn)
      .pipe(got.stream.post(this.ch_url, Object.assign({}, this.httpOptions, {query: query}) ))
      .on('error', (error, body, response) => {
        console.log('err', error);
      })
      .on('response', (response) => {
        if(response.statusCode === 200){

          fs.unlinkAsync(fn)
            .then(() => {});

        } else {
          console.log('response', response.body, response.statusCode, response.statusMessage);
        }
      });
  }
}

module.exports = CHUploader;

