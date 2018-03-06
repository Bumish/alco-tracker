'use strict';

function mergeDeep(target, source) {
  let output = Object.assign({}, target);
  if (mergeDeep.isObject(target) && mergeDeep.isObject(source)) {
    Object.keys(source).forEach(key => {
      if (mergeDeep.isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, {[key]: source[key]});
        } else {
          output[key] = mergeDeep(target[key], source[key]);
        }
      } else {
        Object.assign(output, {[key]: source[key]});
      }
    });
  }
  return output;
}


mergeDeep.isObject = function (item) {
  return (item && typeof item === 'object' && !Array.isArray(item));
};

module.exports = mergeDeep;
