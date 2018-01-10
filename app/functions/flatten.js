'use strict';

module.exports = function flatten(object, separator = '.') {

  const isValidObject = value => {
    if (!value) {
      return false;
    }

    const isArray = Array.isArray(value);
    const isObject = Object.prototype.toString.call(value) === '[object Object]';

    return !isArray && isObject;
  };

  const walker = (child, path = []) =>
    Object.assign(
      {}, ...Object.keys(child).map(key => (isValidObject(child[key])
        ? walker(child[key], path.concat([key]))
        : {[path.concat([key]).join(separator)]: child[key]}))
    );

  return Object.assign({}, walker(object));
};

