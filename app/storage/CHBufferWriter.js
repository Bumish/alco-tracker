'use strict';

const fs = require('fs');

const Promise = require('bluebird');

const fsa = Promise.promisifyAll(fs);
const boolToInt = (k,v) => (typeof v === 'boolean' ? Number(v) : v);

class CHBufferWriter {

  constructor(table){

    this.buffers = [];
    this.fileReady = false;

    this.folder = 'upload_ch';
    this.startDate = new Date();
    this.objectName = `${this.folder  }/${  table  }-${  this.startDate.toISOString()  }.log`;

    fsa.openAsync(this.objectName, 'w')
      .then(fd => {

        this.fd = fd;
        this.fileReady = true;
        this.flushBuffer();

      })
      .catch(error => {

        console.error(error);

      })
  }

  flushBuffer(){

    if(!this.fileReady)
      return console.error('file not ready');

    const buffer = Buffer.concat(this.buffers);
    this.buffers = [];
    this.writeToFile(buffer);

  }

  writeToFile(data){

    if(!this.fileReady)
      return console.error('file not ready');

    fsa.writeAsync(this.fd, data)
      .then(() => {
        // console.log('write complere')
      })
      .catch(error => {
        console.error('write error', error);
      });
  }


  push(object){

    const chunk = new Buffer(`${JSON.stringify(object, boolToInt)  }\n`);

    this.fileReady
      ? this.writeToFile(chunk)
      : this.buffers.push(chunk);

  }

  close(){
    // TODO: разобраться почему тут иногда возникает ошибка
    return fsa.closeAsync(this.fd)
      .then(() => this.objectName);

  }
}


module.exports = CHBufferWriter;
