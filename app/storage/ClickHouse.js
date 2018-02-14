'use strict';

const dsnParse = require('../functions/dsnParse');

const CHUploader = require('./CHUploader');
const CHBufferWriter = require('./CHBufferWriter');
const CHReader = require('./CHReader');
const pick = require('es6-pick');

class ClickHouse {

  constructor(options, services) {

    const {log} = services;

    this.log = services.log.child({module: 'ClickHouse'});
    this.log.info('Starting ClickHouse connector');

    this.defaults = {
      dsn: 'http://localhost:8123/test',
      uploadInterval: 5
    };

    // Writers factory
    this.buildWriter = (table) => {
      return new CHBufferWriter({table}, {log});
    };

    this.options = Object.assign({}, this.defaults, options);
    const connOptions = dsnParse(this.options.dsn);

    this.uploader = new CHUploader(connOptions, {services, log});
    this.writers = new Map();

    // Reader

    this.reader = new CHReader(this.options, {services, log});

    // Периодически пересоздаем буферы, старые отправляем в кликхаус
    setInterval(() => {

      const writers = this.writers;
      this.writers = new Map();

      for (const [table, writer] of writers) {

        writer.close().then(filename => {
          this.uploader.uploadFile(filename, table);
        }).catch(err => {
          this.log.error(err, 'Error while processing bach.');
        });
      }
    }, this.options.uploadInterval * 1000);
  }

  push(table, object) {

    if (!this.writers.has(table)) {
      this.writers.set(table, this.buildWriter(table));
    }

    this.writers.get(table).push(object);
  }

}


module.exports = ClickHouse;
