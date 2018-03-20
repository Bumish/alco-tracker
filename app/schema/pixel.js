'use strict';

const Joi = require('joi');

module.exports = Joi.object().keys({
  channel: Joi.string().only(['pixel']).required(),
  id: Joi.string().regex(/^[0-9]+$/),
  userAgent: Joi.string().required(),
  ip: Joi.string().required(),
  error: Joi.string().allow('').strip(),
  projectId: Joi.number().integer().default(0),
  name: Joi.string().required(),
  uid: Joi.string().regex(/^[0-9]+$/),
  data: Joi.object().keys({}).unknown(true),
  session: Joi.object().keys({
    eventNum: Joi.number().integer(),
    pageNum: Joi.number().integer(),
    num: Joi.number().integer(),
  }),
}).options({stripUnknown: true});
