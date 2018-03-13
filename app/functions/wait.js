'use strict';
const Promise = require('bluebird');

module.exports = function wait(ms) {
  return Promise((resolve, _) => {
    setTimeout(ms, () => resolve());
  })
};


