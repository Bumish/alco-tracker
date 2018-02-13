'use strict';

const Joi = require('joi');

module.exports = Joi.object().keys({
  userAgent: Joi.string().required(),
  ip: Joi.string().required(),
  browser: Joi.object().keys({
    if: Joi.array(),
    sr: Joi.object().keys({
      asp: Joi.number().integer(),
      avail: Joi.object().keys({
        w: Joi.number().integer().required(),
        h: Joi.number().integer().required()
      }).required(),
      tot: Joi.object().keys({
        w: Joi.number().integer().required(),
        h: Joi.number().integer().required()
      }).required(),
      oAngle: Joi.number().integer(),
      oType: Joi.string()
    }),
    wh: Joi.object().keys({
      w: Joi.number().integer().required(),
      h: Joi.number().integer().required()
    }).required(),
  }).required(),
  client: Joi.object().keys({
    platform: Joi.string().required(),
    product: Joi.string().required(),
    tz: Joi.string().allow('').required(),
    tzOffset: Joi.number().integer().required(),
    ts: Joi.number().integer().required(),
  }).required(),
  data: Joi.object().keys({}).options({allowUnknown: true}).required(),
  library: Joi.object().keys({
    libver: Joi.number().integer().required(),
    name: Joi.string().required(),
    snippet: Joi.number().integer().required()
  }).required(),
  name: Joi.string().required(),
  page: Joi.object().keys({
    hash: Joi.string().allow('').required(),
    hostname: Joi.string().allow('').required(),
    path: Joi.string().allow('').required(),
    proto: Joi.string().allow('').required(),
    query: Joi.string().allow('').required(),
    referrer: Joi.string().allow('').required(),
    url: Joi.string().allow('').required(),
    title: Joi.string().allow('').required(),
  }).required(),
  scroll: Joi.object().keys({
    docHeight: Joi.number().integer().required(),
    clientHeight: Joi.number().integer().required(),
    topOffset: Joi.number().integer().required(),
    scroll: Joi.number().integer().required(),
    maxScroll: Joi.number().integer().required(),
  }).optional(),
  perf: Joi.object().keys({
    ce: Joi.number().integer().required(),
    cs: Joi.number().integer().required(),
    dc: Joi.number().integer().required(),
    di: Joi.number().integer().required(),
    dl: Joi.number().integer().required(),
    rqs: Joi.number().integer().required(),
    rse: Joi.number().integer().required(),
    rss: Joi.number().integer().required(),
    scs: Joi.number().integer().required(),
  }).optional(),
  projectId: Joi.number().integer().required(),
  uid: Joi.string().regex(/^[0-9]+$/),
  session: Joi.object().keys({
    eventNum: Joi.number().integer().required(),
    pageNum: Joi.number().integer().required(),
    refHost: Joi.string().optional(),
    start: Joi.number().integer().required(),
    num: Joi.number().integer().required(),
    hasMarks: Joi.boolean().required(),
    type: Joi.string().required(),
    engine: Joi.string().optional(),
    refHash: Joi.any().strip(),
    marks: Joi.object().options({allowUnknown: true}).required()
  }).required(),
  user: Joi.object().keys({}).options({allowUnknown: true}).required()
});
