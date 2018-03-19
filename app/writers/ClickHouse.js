'use strict';

const CHClient = require('../storage/CHClient');
const CHSync = require('../storage/CHSync');

const dsnParse = require('../functions/dsnParse');
const unzip = require('../functions/unzip');

const isObject = o => (!!o && typeof o === 'object' && Object.prototype.toString.call(o) === '[object Object]');
const emptySet = new Set();

/**
 *
 * @param child {Object}
 * @param nested {Set}
 * @param cols {Object}
 * @param path {Array<string>}
 * @param separator {string}
 * @param noCheck {boolean}
 * @return {Object}
 */
const flatObject = (child, nested, cols, path = [], separator = '_', noCheck = false) => {
  const acc = {};
  const root_path = path.join(separator);
  const kv = root_path && nested && nested.has(root_path) ? {} : null;

  Object.keys(child)
    .forEach(key => {
      const val = child[key];
      const isObj = isObject(val);
      if (kv) {
        if (isObj) {
          Object.assign(
            kv,
            flatObject(val, null, {}, [], separator, true)
          );
        }
        else {
          kv[key] = val;
        }
      }
      else {
        const item_path = path.concat(key)
          .join(separator);
        if (isObj) {
          Object.assign(
            acc,
            flatObject(val, nested, cols, path.concat([key]), separator, noCheck)
          );
        }
        else if (cols[item_path] || noCheck) {
          acc[item_path] = val;
        }
        else {
          console.warn(`!! not found path:${path.join('.')}, key:${key}, val:${val}`);
        }
      }
    });
  return Object.assign(
    acc,
    kv && flatObject(unzip(kv, String, String), null, cols, [root_path], '.', true)
  );
};



class ClickHouse {

  constructor(options, {log, stat}) {

    this.log = log.child({name: this.constructor.name});
    this.stat = stat;

    this.options = Object.assign({
      enabled: false
    }, options);
    this.inited = false;

    const connOptions = dsnParse(this.options.dsn);

    const client = this.client = new CHClient(connOptions, {log, stat});
    this.sync = new CHSync(options, {
      log,
      client
    });

    this.formatter = (table, record) => {
      const {cols, nested} = this.sync.tableConfig(table);

      if (!cols || !nested) {
        this.log.error({
          cols,
          nested
        });
        throw new Error('wrong table config');
      }

      return flatObject(record, nested, cols);
    };
  }

  get configured() {

    return this.options.enabled && this.options.dsn && true;

  }

  async init() {

    this.casInit();

    await this.sync.sync();
    await this.client.init();

    this.log.info('started');
  }

  write(msg) {

    const {time, ...rest} = msg;

    const key = msg.name.toLowerCase()
      .replace(/\s/g, '_');
    const table = this.options[rest.channel][key] || this.options[rest.channel].default;

    // date and time
    const dateString = time.toISOString()
      .replace('T', ' ');
    rest.date = dateString.substr(0, 10);
    rest.dateTime = dateString.substr(0, 19);
    rest.timestamp = time.getTime();

    const row = this.formatter(table, rest);

    this.client.getWriter(table).push(row);

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
