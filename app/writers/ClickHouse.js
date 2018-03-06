'use strict';

const CHClient = require('../storage/CHClient');
const CHSync = require('../storage/CHSync');

const dsnParse = require('../functions/dsnParse');
const unzip = require('../functions/unzip');

const isObject = value => typeof value === 'object' && !Array.isArray(value);
const emptySet = new Set();

/**
 *
 * @param child {Object}
 * @param nested {Set}
 * @param cols {Object}
 * @param path {Array}
 * @param separator {string}
 * @return {{} & any}
 */
const flatObject = (child, nested, cols, path = [], separator = '_') => {
  const acc = {};
  const root_path = path.join(separator);
  const kv = root_path && nested.has(root_path) ? {} : null;

  Object.keys(child)
    .forEach(key => {
      if (isObject(child[key])) {
        Object.assign(acc, flatObject(child[key], nested, cols, path.concat([key]), separator));
      } else {
        const item_path = path.concat(key)
          .join(separator);
        if (cols[item_path]) {
          acc[item_path] = child[key];
        } else if (kv) {
          kv[key] = child[key];
        } else {
          console.warn(`!! not found ${item_path}`);
        }
      }
    });
  return Object.assign(acc, kv && flatObject(unzip(kv, String, String), emptySet, cols, [root_path], '.'));
};


class ClickHouse {

  constructor(options, {log}) {

    this.log = log.child({name: this.constructor.name});

    this.options = Object.assign({}, options);
    this.inited = false;

    const connOptions = dsnParse(this.options.dsn);
    const client = this.client = new CHClient(connOptions, {log});

    this.sync = new CHSync(options, {
      log,
      client
    });

    this.formatter = (table, record) => {
      const {cols, nested} = this.sync.tableConfig(table);

      if(!cols || !nested){
        this.log.error({cols, nested});
        throw new Error('Wrong table config');
      }

      return flatObject(record, nested, cols);
    };

  }

  async init() {

    this.casInit();

    await this.sync.sync();

    this.log.info('Ready');
  }

  write(msg) {

    const {time, type, ...rest} = msg;

    const key = msg.name.toLowerCase()
      .replace(/\s/g, '_');
    const table = this.options[type][key] || this.options[type].default;

    // date and time
    const dateString = time.toISOString()
      .replace('T', ' ');
    rest.date = dateString.substr(0, 10);
    rest.dateTime = dateString.substr(0, 19);
    rest.timestamp = time.getTime();

    const row = this.formatter(table, rest);

    this.client
      .getWriter(table)
      .push(row);

  }

  /**
   * Check and set init status
   * @return {boolean}
   */
  casInit() {
    if (this.inited) {
      throw new Error('Already initialized');
    }
    this.inited = true;
    return false;
  }

}

module.exports = ClickHouse;
