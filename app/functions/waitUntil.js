'use strict';

const waitUntil = function (checkFn, limit, checkInterval = 10) {
  return new Promise((resolve, reject) => {
    let counter = 0;
    const check = () => {
      if (checkFn()) {
        resolve();
      } else {
        counter++;
        return limit && counter === limit ? reject(new Error('Limit exceed')) : setTimeout(() => check(), checkInterval);
      }
    };
  });
};

module.exports = waitUntil;
