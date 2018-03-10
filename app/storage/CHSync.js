'use strict';

const DefaultDict = require('../functions/defaultDict');
const Lazy = require('lazy.js');

const showCreateTable = (name, cols, table_options) => {
  let query = `CREATE TABLE ${name} (`;
  query += Object.keys(cols)
    .filter(c => !!cols[c])
    .map(c => ` "${c}" ${cols[c]}`)
    .join(', ');
  query += `) ENGINE = ${  table_options['engine']}`;
  return query;
};


const showAlterTable = (name, cols, table_options) => {
  let query = `ALTER TABLE ${name} `;
  query += Object.keys(cols)
    .filter(c => !!cols[c])
    .map(c => ` ADD COLUMN "${c}" ${cols[c]}`)
    .join(', ');
  return query;
};

/**
 *
 * @param schemaCols
 * @param currentCols
 */
const newCols = (schemaCols, currentCols) => schemaCols.filter(col => currentCols.indexOf(col) < 0);

/**
 * @property {CHClient} client
 */
class CHSync {

  constructor(options, {log, client}) {

    this.log = log.child({name: this.constructor.name});
    this.client = client;

    this.options = Object.assign({}, options);

    /**
     * @type {DefaultDict}
     */
    this.tablesCols = null;
    this.tablesNested = null;

  }

  async discover() {

    this.tablesCols = DefaultDict(Object);
    this.tablesNested = DefaultDict(Set);

    const list = await this.client.tables_columns();

    for (const row of list) {
      const {table, name, type} = row;
      const [key, sub] = name.split('.');
      this.tablesCols.get(table)[name] = type;
      if (sub) {
        this.tablesNested.get(table)
          .add(key);
      }
    }

    this.log.info({
      tables: this.tablesCols.keys()
        .join(', ')
    }, 'Discovered');
  }

  async sync() {

    this.log.info('Syncing...');

    const {tables, base} = this.options;

    await this.discover();

    for (const [table, conf] of Object.entries(tables)) {

      const exists = this.tablesCols.has(table);
      const currTable = this.tablesCols.get(table);

      let {_options, ...customCols} = conf;

      // Inheritance
      if (_options && _options.extend && tables[_options.extend]) {

        const {_options:inhOptions, ...ihnCustomCols} = tables[_options.extend];



        _options = Object.assign({}, inhOptions, _options);
        customCols = Object.assign({}, ihnCustomCols, customCols);
      }

      const schemaCols = Object.assign(
        {},
        base,
        customCols
      );



      if (!exists) {

        this.log.info(`Creating table ${table}`);
        const query = showCreateTable(table, schemaCols, _options);

        await this.client.execute(query);

      } else {

        const appendCols = Lazy(schemaCols)
          .keys()
          .without(Lazy(currTable)
            .keys()
          )
          .toArray();

        if (appendCols.length > 0) {

          this.log.info({new_cols: appendCols.join(', ')}, `Altering table ${table}`);


          const query = showAlterTable(
            table,
            Lazy(schemaCols)
              .pick(appendCols)
              .toObject(),
            _options
          );

          await this.client.execute(query);
        }
      }
    }

    await this.discover();

    this.log.info('Schema sync done');
  }

  tableConfig(table) {
    return {
      cols: this.tablesCols.get(table),
      nested: this.tablesNested.get(table)
    };
  }
}

module.exports = CHSync;
