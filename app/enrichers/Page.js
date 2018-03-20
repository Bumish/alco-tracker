'use strict';

const pick = require('es6-pick');
const Joi = require('joi');
const url = require('url');

const Schema = Joi.object().keys({

  domain: Joi.string().required(),
  query: Joi.object().keys({
    utm_source: Joi.string(),
    utm_campaign: Joi.string(),
    utm_medium: Joi.string(),
    utm_content: Joi.string(),
    utm_term: Joi.string(),
  }).default({}).required().unknown(true),
  proto: Joi.string().allow(['http', 'https', 'other']).required()

});

const validProtos = new Set(['http', 'https']);
const otherProto = 'other';

const handle = (page_url) => {

  const parsedURL = url.parse(page_url, true);
  const proto = parsedURL.protocol.slice(0,-1);
  const query = parsedURL.query;
  
  Object.keys(parsedURL.query)
    .forEach(key => {
      query[key] = query[key] === '' ? undefined: String(query[key])
    });

  return {
    domain: parsedURL.hostname,
    proto: validProtos.has(proto) >= 0 ? proto : otherProto,
    query: query
  };
};


class PageEnricher {

  constructor(options, {log, stat}) {

    this.log = log.child({module: 'Page'});
    this.stat = stat;
    this.prefix = 'page';

  }

  async get(msg) {

    const query = msg && msg.page && msg.page.url;
    const response = {};

    if (!query) {
      return response;
    }

    try {

      return await Joi.validate(
        handle(query),
        Schema
      );

    } catch (error) {
      this.log.error(error);
      this.stat.mark('error.enrich.validation');
    }

    return response;

  }
}

PageEnricher.Schema = Schema;
PageEnricher.handle = handle;

module.exports = PageEnricher;
