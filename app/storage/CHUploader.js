'use strict';

const fs = require('fs');

const Promise = require('bluebird');
const got = require('got');

const afs = Promise.promisifyAll(fs);

class CHUploader {

  constructor(options, services){

    options = options || {};

    this.log = services.log.child({module: 'CHUploader'});
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

module.exports = CHUploader;

