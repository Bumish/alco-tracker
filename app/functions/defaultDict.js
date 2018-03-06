'use strict';

/**
 *
 * @param type
 * @return {{get: function(*), keys: function(): string[], dict: {}}}
 */
function defaultDict(type) {
  const dict = {};
  return {
    get: key => {
      if (!dict[key]) {
        dict[key] = new type();
      }
      return dict[key];
    },
    has: key => dict.hasOwnProperty(key),
    keys: () => Object.keys(dict),
    dict
  };
}


module.exports = defaultDict;
