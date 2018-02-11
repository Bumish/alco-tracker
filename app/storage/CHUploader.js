'use strict';

const fs = require('fs');

const Promise = require('bluebird');
const got = require('got');

const afs = Promise.promisifyAll(fs);

class CHUploader {

  constructor(options){

    options = options || {};

    this.ch_url = `${options.protocol  }//${  options.hostname  }:${  options.port}`;
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

    afs.createReadStream(fn)
      .pipe(got.stream.post(this.ch_url, Object.assign({}, this.httpOptions, {query}) ))
      .on('error', (err, body, res) => {
        console.log('err', err);
      })
      .on('response', response => {
        if(response.statusCode === 200){

          afs.unlinkAsync(fn)
            .then(() => {});

        } else {
          console.log('response', response.body, response.statusCode, response.statusMessage);
        }
      });
  }
}

module.exports = CHUploader;

