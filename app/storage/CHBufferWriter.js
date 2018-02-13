'use strict';

const fs = require('fs');
const Promise = require('bluebird');
const fsa = Promise.promisifyAll(fs);
const wait = require('../functions/waitUntil');

const boolToInt = (k, v) => (typeof v === 'boolean' ? Number(v) : v);


class CHBufferWriter {

  constructor(table) {

    this.buffers = [];
    this.fileReady = false;
    this.writing = false;

    this.folder = 'upload_ch';
    this.startDate = new Date();
    this.objectName = `${this.folder}/${table}-${this.startDate.toISOString()}.log`;

    fsa.openAsync(this.objectName, 'w').then(fd => {

      this.fd = fd;
      this.fileReady = true;
      this.flushBuffer();

    }).catch(error => {

      console.error(error);

    });
  }

  flushBuffer() {

    if (!this.fileReady) {
      return console.error('file not ready');
    }

    const buffer = Buffer.concat(this.buffers);
    this.buffers = [];
    this.writeToFile(buffer);

  }

  writeToFile(data) {

    if (!this.fileReady) {
      return console.error('file not ready');
    }

    this.writing = true;

    fsa.writeAsync(this.fd, data).then(() => {

      this.writing = false;

    }).catch(error => {

      console.error('write error', error);

    });
  }


  push(object) {

    const chunk = new Buffer(`${JSON.stringify(object, boolToInt)  }\n`);

    this.fileReady
      ? this.writeToFile(chunk)
      : this.buffers.push(chunk);

  }

  async close() {

    try {

      if (this.buffers.length) {
        console.log('CHBufferWriter: buffer not empty, waiting');
        await wait(() => !this.buffers.length, 10, 10);
      }

      if (this.writing) {
        console.log('CHBufferWriter: file writing in process. waiting');
        await wait(() => !this.writing, 10, 10);
      }

      await fsa.closeAsync(this.fd);

      return this.objectName;

    } catch (e) {
      console.error(`CHBufferWriter: can't save ${this.objectName}. buf.len: ${this.buffers.length}; writing: ${this.writing}`);
      throw e;
    }
  }
}


module.exports = CHBufferWriter;
