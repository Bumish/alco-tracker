'use strict';

const url = require('url');


module.exports = function dsnParse(dsn) {

  const parts = url.parse(dsn);

  parts.path = parts.path && parts.path !== '/' && parts.path.substr(1);
  parts.db = parts.path;

  return parts;

};
