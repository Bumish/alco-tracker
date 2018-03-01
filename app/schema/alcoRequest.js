'use strict';

const Joi = require('joi');

module.exports = Joi.object().keys({
  name: Joi.string().required(),              // ch+
  projectId: Joi.number().integer().required(),// ch+
  uid: Joi.string().regex(/^[0-9]+$/),        // ch+
  userAgent: Joi.string().required(),         // ch+
  ip: Joi.string().required(),                // ch+
  browser: Joi.object().keys({                // O
    if: Joi.array(),                          // ch+
    sr: Joi.object().keys({                   // O
      asp: Joi.number().integer(),            // ch+
      avail: Joi.object().keys({              // O
        w: Joi.number().integer().required(), // ch+
        h: Joi.number().integer().required()  // ch+
      }).required(),                          // O
      tot: Joi.object().keys({                // O
        w: Joi.number().integer().required(), // ch+
        h: Joi.number().integer().required()  // ch+
      }).required(),                          // O
      oAngle: Joi.number().integer(),         // ch+
      oType: Joi.string()                     // ch+
    }),                                       // ch+
    wh: Joi.object().keys({                   // O
      w: Joi.number().integer().required(),   // ch+
      h: Joi.number().integer().required()    // ch+
    }).required(),                            // O
  }).required(),                              // O
  client: Joi.object().keys({                 // O
    platform: Joi.string().required(),        // ch+
    product: Joi.string().required(),         // ch+
    tz: Joi.string().allow('').required(),    // ch+
    tzOffset: Joi.number().integer().required(),// ch+
    ts: Joi.number().integer().required()     // ch+
  }).required(),                              // O
  cf: Joi.object().keys({                     // Och+ (client features)
    locstor: Joi.boolean().required(),        // ch+sub
    addel: Joi.boolean().required(),          // ch+sub
    promise: Joi.boolean().required(),        // ch+sub
    sbeacon: Joi.boolean().required(),        // ch+sub
    atob: Joi.boolean().required(),           // ch+sub
  }).optional(),                              // O
  data: Joi.object().keys({}).unknown(true).required(),// Och+
  library: Joi.object().keys({                // O
    libver: Joi.number().integer().required(),// ch+
    name: Joi.string().required(),            // ch+
    snippet: Joi.number().integer().required()// ch+
  }).required(),                              // O
  page: Joi.object().keys({                   // O
    hash: Joi.string().allow('').required(),  // +
    hostname: Joi.string().allow('').required(),// +
    path: Joi.string().allow('').required(),  // skip (can be used from url)
    proto: Joi.string().allow('').required(), // +
    query: Joi.string().allow('').required(), // skip (can be used from url)
    referrer: Joi.string().allow('').required(),// ch+
    url: Joi.string().allow('').required(),   // ch+
    title: Joi.string().allow('').required(), // ch+
  }).required(),                              // O
  scroll: Joi.object().keys({                 // O
    docHeight: Joi.number().integer().required(),// ch+
    clientHeight: Joi.number().integer().required(),// ch+
    topOffset: Joi.number().integer().required(),// ch+
    scroll: Joi.number().integer().required(),// ch+
    maxScroll: Joi.number().integer().required(),// ch+
    src: Joi.any().optional().strip()         // temp
  }).optional(),                              // O
  perf: Joi.object().keys({                   // Och+
    ce: Joi.number().integer().required(),    // ch+sub
    cs: Joi.number().integer().required(),    // ch+sub
    dc: Joi.number().integer().required(),    // ch+sub
    di: Joi.number().integer().required(),    // ch+sub
    dl: Joi.number().integer().required(),    // ch+sub
    rqs: Joi.number().integer().required(),   // ch+sub
    rse: Joi.number().integer().required(),   // ch+sub
    rss: Joi.number().integer().required(),   // ch+sub
    scs: Joi.number().integer().required(),   // ch+sub
  }).optional(),                              // O
  session: Joi.object().keys({                // O
    eventNum: Joi.number().integer(),         // ch+
    pageNum: Joi.number().integer(),          // ch+
    refHost: Joi.string().optional(),         // ch+
    start: Joi.number().integer().optional(), // ch+
    num: Joi.number().integer().optional(),   // ch+
    hasMarks: Joi.boolean().optional(),       // ch+
    type: Joi.string().optional(),            // ch+
    engine: Joi.string().optional(),          // ch+
    refHash: Joi.any().optional().strip(),    // ch+
    marks: Joi.object().unknown(true).optional()// ch+
  }).required(),                              // O
  user: Joi.object().keys({                   // O
    gaId: Joi.string().optional(),            // ch+
    ymId: Joi.string().optional()             // ch+
  }).unknown(true).required()                 // ch+ (optional user traits)
});

// === to rename (nested):
// session_marks
// user_traits
// data

// === Приведение типаов и чистка ключей и значений (в строку)
// user_traits
// session_marks
//

// .options({allowUnknown: true})
