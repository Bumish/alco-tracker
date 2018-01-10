'use strict';
const StorageClickHouse = require('./storage/ClickHouse');


class Storage {

  constructor(options) {

    this.defaults = {};
    this.options = Object.assign({}, this.defaults, options);

  }

  async init() {

    this.ch = new StorageClickHouse(this.options.clickhouse);

  }

}

module.exports = Storage;

