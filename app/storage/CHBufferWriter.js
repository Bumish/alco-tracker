'use strict';

const fs = require('fs');
const Promise = require('bluebird');
const fsa = Promise.promisifyAll(fs);
const wait = require('../functions/waitUntil');

const boolToInt = (k, v) => (typeof v === 'boolean' ? Number(v) : v);


class CHBufferWriter {

  /**
   *
   * @param options
   * @param services
   */
  constructor(options, services) {

    const {table} = options;

    this.startDate = new Date();
    this.folder = 'upload_ch';
    this.fileName = `${this.startDate.toISOString()}.log`;

    this.log = services.log.child({group: 'CHBufferWriter', obj:this.fileName});

    this.buffers = [];
    this.fileReady = false;
    this.writing = false;
    this.objectName = `${this.folder}/${table}-${this.fileName}`;

    fsa.openAsync(this.objectName, 'w').then(fd => {

      this.fd = fd;
      this.fileReady = true;
      this.flushBuffer();

    }).catch(err => {

      this.log.error(err, 'Error writing to temp file');

    });
  }

  flushBuffer() {

    if (!this.fileReady) {
      return this.log.error('file not ready');
    }

    const buffer = Buffer.concat(this.buffers);
    this.buffers = [];
    this.writeToFile(buffer);

  }

  writeToFile(data) {

    if (!this.fileReady) {
      return this.log.error('file not ready');
    }

    this.writing = true;

    fsa.writeAsync(this.fd, data).then(() => {

      this.writing = false;

    }).catch(error => {

      this.log.error('write error', error);

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
        this.log.warn('buffer not empty, waiting');
        await wait(() => !this.buffers.length, 10, 50);

        if (this.buffers.length) {
          this.log.warn('buffer still not empty, waiting more');
        }
      }

      if (this.writing) {
        this.log.debug('file writing in process. waiting');
        await wait(() => !this.writing, 10, 50);
      }
      
      await fsa.closeAsync(this.fd);
      return this.objectName;

    } catch (e) {
      this.log.error({bufferLength: this.buffers.length, writing: this.writing}, 'Error while closing temp file.');
      throw e;
    }
  }
}


module.exports = CHBufferWriter;
