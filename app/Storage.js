'use strict';
const StorageClickHouse = require('./storage/ClickHouse');


class Storage {

  constructor(options, services) {

    this.defaults = {};
    this.options = Object.assign({}, this.defaults, options);

    this.ch = new StorageClickHouse(this.options.clickhouse, services);

  }

}

module.exports = Storage;

