"use strict";

const JSONStream = require('JSONStream');
const es = require('event-stream');

const dsnParse = require('../functions/dsnParse');

const CHUploader = require('./CHUploader');
const CHBufferWriter = require('./CHBufferWriter');
const CHReader = require('./CHReader');

class ClickHouse {

  constructor(options){

    this.defaults = {
      dsn: 'http://localhost:8123/test',
      uploadInterval: 5
    };

    this.options = Object.assign({}, this.defaults, options);
    const connOptions = dsnParse(this.options.dsn);

    this.uploader = new CHUploader(connOptions);
    this.writers = new Map();

    // Reader

    this.reader = new CHReader(this.options.dsn);

    // Периодически пересоздаем буферы, старые отправляем в кликхаус
    setInterval(() => {

      const writers = this.writers;
      this.writers = new Map();

      for (let [table, writer] of writers) {

        writer
          .close()
          .then(filename => {
            this.uploader.uploadFile(filename, table);
          });
      }
    }, this.options.uploadInterval * 1000);
  }

  push(table, object){

    if(!this.writers.has(table)){
      this.writers.set(table, new CHBufferWriter(table));
    }

    this.writers.get(table).push(object);
  }

}


module.exports = ClickHouse;
