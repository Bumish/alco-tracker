'use strict';

const HttpConnector = require('../HttpConnector');
const pick = require('es6-pick');
const Joi = require('joi');

const Schema = Joi.object().keys({
  success: Joi.boolean().allow(true).required().strip(),
  isBot: Joi.number().integer().required(),
  device: Joi.object().keys({
    type: Joi.string().optional().allow('').default(''),
    brand: Joi.string().optional().allow('').default(''),
    model: Joi.string().optional().allow('').default('')
  }),
  os: Joi.object().keys({
    name: Joi.string().optional().allow('').default(''),
    version: Joi.string().optional().allow('').default(''),
    platform: Joi.string().optional().allow('').default('')
  }),
  client: Joi.object().keys({
    type: Joi.string().optional().allow('').default(''),
    name: Joi.string().optional().allow('').default(''),
    version: Joi.string().optional().allow('').default('')
  })
});


const handle = data => {

  const result = pick(data, 'success');

  if (data.isBot) {
    result.device = {
      isBot: 1,
      type: 'bot',
      brand: data.producer && data.producer.name,
      model: data.bot && data.bot.name
    };
  } else {
    result.isBot = 0;
    result.os = pick(data.os || {}, 'name', 'version', 'platform');
    result.client = pick(data.client || {}, 'type', 'name', 'version');
    result.device = pick(data.device || {}, 'type', 'brand', 'model');
  }

  return result;
};


class MatomoDeviceDetectorConnector {

  constructor(options, {log}) {

    this.log = log.child({module: 'DDet'});
    this.service = new HttpConnector(options, {log});
    this.prefix = options.prefix;
  }

  async get(msg) {
    const query = msg && msg.userAgent;
    const response = {};

    if (!query) {
      return response;
    }

    try {

      const data = await this.service.query({ua: query});

      if (!data || !data.success) {
        return response;
      }

      return await Joi.validate(
        handle(data),
        Schema
      );

    } catch (error) {
      this.log.error({query}, error);
    }

    return response;

  }
}

MatomoDeviceDetectorConnector.Schema = Schema;
MatomoDeviceDetectorConnector.handle = handle;

module.exports = MatomoDeviceDetectorConnector;
