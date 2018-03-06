'use strict';

const HttpConnector = require('../HttpConnector');
const pick = require('es6-pick');
const Joi = require('joi');

const Schema = Joi.object().keys({
  success: Joi.boolean().allow(true).required().strip(),
  country: Joi.object().keys({
    iso: Joi.string().optional().allow('').default(''),
    name_en: Joi.string().optional().allow('').default(''),
    name_ru: Joi.string().optional().allow('').default('')
  }),
  city: Joi.object().keys({
    id: Joi.number().integer().optional().default(0),
    name_en: Joi.string().optional().allow('').default(''),
    name_ru: Joi.string().optional().allow('').default('')
  }),
  region: Joi.object().keys({
    iso: Joi.string().optional().allow('').default(''),
    name_en: Joi.string().optional().allow('').default(''),
    name_ru: Joi.string().optional().allow('').default('')
  })
}).options({stripUnknown: true});

const handle = (data) => {

  return {
    success: data.success,
    country: pick(data.country || {}, 'iso', 'name_ru', 'name_en'),
    region: pick(data.region || {}, 'iso', 'name_ru', 'name_en'),
    city: pick(data.city || {}, 'id', 'name_ru', 'name_en')
  };
};


class SypexGeoConnector {

  constructor(options, {log}) {

    this.log = log.child({module: 'SxGeo'});
    this.service = new HttpConnector(options, {log});
    this.prefix = options.prefix;

  }

  async get(msg) {

    const query = msg && msg.ip;
    const response = {};

    if (!query) {
      return response;
    }

    try {

      const data = await this.service.query({ip: query});

      if (!data || !data.success) {
        return response;
      }

      return await Joi.validate(
        handle(data),
        Schema
      );

    } catch (error) {
      this.log.error(error);
    }

    return response;

  }
}

SypexGeoConnector.Schema = Schema;
SypexGeoConnector.handle = handle;


module.exports = SypexGeoConnector;
