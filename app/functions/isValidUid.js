'use strict';

const uidRegexp = /^\d{10,25}$/;

module.exports = function isValidUid(uid) {
  if (!uid) {
    return false;
  }
  return uidRegexp.test(uid);
};
