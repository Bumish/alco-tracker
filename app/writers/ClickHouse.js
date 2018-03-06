'use strict';

const CHBufferWriter = require('../storage/CHBufferWriter');
const CHClient = require('../storage/CHClient');
const dsnParse = require('../functions/dsnParse');
const unzip = require('../functions/unzip');


const skipTables = new Set(['migrations']);

const isObject = (value) => typeof value === 'object' && !Array.isArray(value);

const flatRow = (child, nested, cols, path = [], separator = '_') => {

  // console.log(nested)

  const accum = {};
  const root_path = path.join(separator);
  const kv = root_path && Object.keys(nested).indexOf(root_path) >= 0 ? {} : null;


  Object.keys(child).forEach(key => {
    if (isObject(child[key])) {
      Object.assign(accum, flatRow(child[key], nested, cols, path.concat([key]), separator));
    } else {
      const item_path = path.concat(key).join(separator);
      if (cols[item_path]) {
        accum[item_path] = child[key];
      } else if (kv) {
        kv[key] = child[key];
      } else {
        console.log(`!! not found ${item_path}`);
      }
    }
  });
  if (kv) {
    Object.assign(accum, flatRow(unzip(kv, String, String), {}, cols, [root_path], '.'));
  }
  return accum;
};

const handleColumns = (rows) => rows.filter(col => !skipTables.has(col.table)).reduce((acc, col) =>
  Object.assign(acc, {[col.table]: Object.assign({}, acc[col.table], {[col.name]: col.type})}), {});


const handleNested = (cols) => Object.keys(cols).reduce((tables, table) =>
  Object.assign(tables, {
    [table]: Object.keys(cols[table]).reduce((acc, e) => {
      if (e.indexOf('.') >= 0) {
        const path = e.slice(0, e.indexOf('.'));
        const key = e.slice(e.indexOf('.') + 1);
        if (!acc[path] && (key === 'key' || key === 'value')) {
          acc[path] = true;
        }
      }
      return acc;
    }, {})
  }), {});

const showCreateTable = (name, cols, table_options) => {
  let sql = `CREATE TABLE ${name} (`;
  sql += Object.keys(cols).map(c => ` "${c}" ${cols[c]}`).join(', ');
  sql += ') ENGINE = ' + table_options['engine'];
  return sql;
};

const showAlterTable = (name, cols, table_options) => {
  let sql = `ALTER TABLE ${name} `;
  sql += Object.keys(cols).map(c => ` ADD COLUMN "${c}" ${cols[c]}`).join(', ');
  return sql;
};

class ClickHouse {

  constructor(options, {log}) {

    this.defaults = {
      uploadInterval: 5,
      enabled: false
    };
    this.inited = false;


    this.log = log.child({module: 'CHDataWriter'});
    this.options = Object.assign({}, this.defaults, options);
    this.options.uploadEvery = this.options.uploadInterval * 1000;

    this.writers = new Map();

    this.getWriter = (table) => {
      if (!this.writers.has(table)) {
        this.writers.set(table, new CHBufferWriter({table}, {log}));
      }
      return this.writers.get(table);
    };

    const connOptions = dsnParse(this.options.dsn);

    this.client = new CHClient(connOptions, {log});
  }

  async init() {

    this.casInit();

    // Loading struct
    const colsList = await this.client.tables_columns();

    this.tablesCols = handleColumns(colsList);
    this.tablesNested = handleNested(this.tablesCols);

    // this.log.debug(this.tablesCols, ' cols');
    // this.log.debug(this.tablesNested, 'Nested cols');

    // Creating and updating tables
    for (const [table, configuration] of Object.entries(this.options.tables)) {
      const {table_options, ...cols} = configuration;

      if (!this.tablesCols[table]) {
        this.log.info(`Creating table ${table}`);
        const stmt = showCreateTable(table, cols, table_options);
        this.client.run(stmt);
      } else {
        const diff = Object.keys(cols).filter(c => Object.keys(this.tablesCols[table]).indexOf(c) < 0);
        if (diff.length > 0) {
          this.log.info(`Altering table ${table}. new cols: ${diff.join(',')}`);
          const stmt = showAlterTable(table, Object.assign({}, ...diff.map(c => ({[c]: cols[c]}))), table_options);
          this.client.run(stmt);
        }
      }
    }

    // Adding cols

    setInterval(
      () => this.upload(),
      this.options.uploadEvery);

    this.log.info('Module ready');
  }

  upload() {

    const writers = this.writers;
    this.writers = new Map();

    for (const [table, writer] of writers) {

      this.log.debug(`uploding ${table}`);

      writer.close().then(filename => {
        this.client.uploadFile(filename, table);
      });
    }
  }

  write(msg) {

    const {time, type, ...rest} = msg;

    const key = msg.name.toLowerCase().replace(/\s/g, '_');
    const table = this.options[type][key] || this.options[type].default;

    console.log(table);

    // date and time
    const dateString = time.toISOString().replace('T', ' ');
    rest.date = dateString.substr(0, 10);
    rest.dateTime = dateString.substr(0, 19);
    rest.timestamp = time.getTime();

    const row = flatRow(rest, this.tablesNested[table], this.tablesCols[table]);

    this.getWriter(table).push(row);

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
