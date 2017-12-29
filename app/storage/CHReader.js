'use strict';

const got = require('got');
const url = require('url');

const dsnParse = require('../functions/dsnParse');

class CHReader {

  constructor(dsn){

    const connectionOptions = dsnParse(dsn);

    this.ch_db = connectionOptions.path || 'unknown';

    // CH options

    this.ch_host = connectionOptions.hostname || 'localhost';
    this.ch_port = connectionOptions.port || '8123';


    this.ch_url = this.ch_host + ':' + this.ch_port;

    console.log('construction CH reader', this.ch_host);

  }


  query(q){

    console.log('quering data from clickhouse', q);

    let url_query = {
      database: this.ch_db,
      query: q
    };

    return got(this.ch_url, {query: url_query})
      .then(response => {
        // console.log(response.body);
        return response.body;
      })
      .catch(error => {
        console.log(error.response.body);
      });
  }


  query_sream(q){

    console.log('quering data from clickhouse', q);

    let url_query = {
      database: this.ch_db,
      query: q
    };

    return got.stream(this.ch_url, {query: url_query})


  }
}

module.exports = CHReader;
