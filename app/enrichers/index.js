'use strict';
const MatomoDeviceDetector = require('./MatomoDeviceDetector');
const SypexGeo = require('./SypexGeo');
const Page = require('./Page');

module.exports = {
  page: Page,
  matomo_deviced: MatomoDeviceDetector,
  sypexgeo: SypexGeo
};
