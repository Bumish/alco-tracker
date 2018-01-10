'use strict';

const got = require('got');
const tmplCompile = require('string-template/compile');
const debug = require('debug')('http-connector');

class HTTPConnector {

  constructor(options) {

    if (!options.url) {
      console.warn('HTTPConnector: You should provide api url');
    }

    this.options = options;
    this.url = tmplCompile(options.url);
    this.gotOptions = {
      timeout: 10000,
      retries: 2,
      json: options.json === true
    };
  }


  query(params) {

    const url = this.url(params);

    debug(`quering ${url}`);

    return got(url, Object.assign({}, this.gotOptions, {query: params})).then(
      response => {

        const {body} = response;
        debug(`query result success:${body && body.success}`);

        return body;

      }).catch(err => {

      console.error(err);
      return {
        success: false,
        error: err.message
      };

    });

  }
}


module.exports = HTTPConnector;
