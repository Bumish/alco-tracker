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
    set: (key, val) => dict[key] = val,
    has: key => dict.hasOwnProperty(key),
    keys: () => Object.keys(dict),
    entries: () => Object.entries(dict),
    dict
  };
}


module.exports = defaultDict;
