const assert = require('assert');
const Joi = require('joi');

const inp0 = {
  'isBot': true,
  'os': null,
  'client': null,
  'bot': {
    'name': 'Googlebot',
    'category': 'Search bot',
    'url': 'http:\/\/www.google.com\/bot.html',
    'producer': {'name': 'Google Inc.', 'url': 'http:\/\/www.google.com'}
  },
  'device': {
    'type': '',
    'brand': '',
    'model': ''
  },
  'execution': 0.012300968170166016,
  'success': true
};

const inp1 = {
  isBot: false,
  os: {name: 'Mac', short_name: 'MAC', version: '10.13', platform: ''},
  client:
    {
      type: 'browser',
      name: 'Chrome',
      short_name: 'CH',
      version: '64.0',
      engine: 'Blink',
      engine_version: ''
    },
  bot: null,
  device: {type: 'desktop', brand: '', model: ''},
  execution: 0.0027599334716796875,
  success: true
};


(async () => {
  const deviceDetector = require('../app/enrichers/deviceDetector');
  const {Schema, handle} = deviceDetector;

  const validated0 = await Joi.validate(handle(inp0), Schema);
  console.log(validated0);

  const validated1 = await Joi.validate(handle(inp1), Schema);
  console.log(validated1);


})();

//
// describe('Schema', function () {
//   describe('deviceDetector', async function () {
//
//
//
//     it('should return -1 when the value is not present', function () {
//       assert.equal(Object.keys(validated0), ['isBot', 'device']);
//     });
//
//
//   });
// });
//
//
