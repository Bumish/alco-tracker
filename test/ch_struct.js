'use strict';

function unzip(obj, keyFilter, valFilter) {

  const key = [];
  const value = [];

  if (obj) {
    for (let [k, v] of Object.entries(obj)) {
      if (keyFilter) {
        k = keyFilter(k);
      }
      if (valFilter) {
        v = valFilter(v);
      }
      key.push(k);
      value.push(v);
    }
  }

  return {
    key,
    value
  };
}


const cols = {
  id: 'UInt64',
  date: 'Date',
  dateTime: 'DateTime',
  timestamp: 'UInt64',
  projectId: 'UInt32',
  name: 'String',
  uid: 'UInt64',
  ip: 'String',
  userAgent: 'String',
  page_url: 'String',
  page_referrer: 'String',
  page_title: 'String',
  page_domain: 'String',
  page_proto: 'Enum8(\'\' = 0, \'http\' = 1, \'https\' = 2, \'other\' = 3)',
  page_query_utm_source: 'String',
  page_query_utm_campaign: 'String',
  page_query_utm_medium: 'String',
  page_query_utm_content: 'String',
  page_query_utm_term: 'String',
  'page_query.key': 'Array(String)',
  'page_query.value': 'Array(String)',
  session_type: 'String',
  session_engine: 'String',
  session_num: 'UInt16',
  session_hasMarks: 'UInt8',
  session_pageNum: 'UInt16',
  session_eventNum: 'UInt16',
  session_marks_utm_source: 'String',
  session_marks_utm_campaign: 'String',
  session_marks_utm_medium: 'String',
  session_marks_utm_content: 'String',
  session_marks_utm_term: 'String',
  'session_marks.key': 'Array(String)',
  'session_marks.value': 'Array(String)',
  session_start: 'UInt64',
  session_refHost: 'String',
  lib_name: 'String',
  lib_libver: 'UInt32',
  lib_snippet: 'UInt32',
  client_tz: 'String',
  client_ts: 'UInt64',
  client_tzOffset: 'Int32',
  client_platform: 'String',
  client_product: 'String',
  browser_if: 'Array(UInt8)',
  browser_wh_w: 'UInt16',
  browser_wh_h: 'UInt16',
  browser_sr_tot_w: 'UInt16',
  browser_sr_tot_h: 'UInt16',
  browser_sr_avail_w: 'UInt16',
  browser_sr_avail_h: 'UInt16',
  browser_sr_asp: 'UInt16',
  browser_sr_oAngle: 'UInt16',
  browser_sr_oType: 'String',
  sxg_country_iso: 'String',
  sxg_country_name_ru: 'String',
  sxg_country_name_en: 'String',
  sxg_region_iso: 'String',
  sxg_region_name_ru: 'String',
  sxg_region_name_en: 'String',
  sxg_city_id: 'UInt32',
  sxg_city_name_ru: 'String',
  sxg_city_name_en: 'String',
  mdd_isBot: 'Int8',
  mdd_client_type: 'String',
  mdd_client_name: 'String',
  mdd_client_version: 'String',
  mdd_os_name: 'String',
  mdd_os_version: 'String',
  mdd_os_platform: 'String',
  mdd_device_type: 'String',
  mdd_device_brand: 'String',
  mdd_device_model: 'String',
  user_id: 'String',
  user_gaId: 'String',
  user_ymId: 'String',
  'user_traits.key': 'Array(String)',
  'user_traits.value': 'Array(String)',
  'data.key': 'Array(String)',
  'data.value': 'Array(String)',
  scroll_docHeight: 'UInt16',
  scroll_clientHeight: 'UInt16',
  scroll_topOffset: 'Int32',
  scroll_scroll: 'UInt16',
  scroll_maxScroll: 'UInt16',
  cf_locstor: 'Int16',
  cf_addel: 'Int16',
  cf_promise: 'Int16',
  cf_sbeacon: 'Int16',
  cf_atob: 'Int16',
  perf_ce: 'Int16',
  perf_cs: 'Int16',
  perf_dc: 'Int16',
  perf_di: 'Int16',
  perf_dl: 'Int16',
  perf_rqs: 'Int16',
  perf_rse: 'Int16',
  perf_rss: 'Int16',
  perf_scs: 'Int16',
  huyvamtam: 'String',
  huyvamtamitam: 'String',
  page_query_gclid: 'String',
  page_query_yclid: 'String',
  session_marks_has_gclid: 'Int8',
  session_marks_has_yclid: 'Int8',
  cf_wpush: 'Int16',
  channel: 'Enum8(\'\' = 0, \'other\' = 1, \'alcojs\' = 5, \'webhook\' = 6, \'pixel\' = 7, \'r1\' = 8, \'r2\' = 9, \'r3\' = 10)'
};


const data = {
  date: '2018-03-05',
  dateTime: '2018-03-05 22:39:40',
  timestamp: 1520289580643,
  page: {
    query: {
      utm_source: '123',
      huy: 'vam'
    }
  },
  session: {marks: {}},
  user: {traits: {}},
  name: 'Page loaded',
  projectId: 12,
  uid: '4779592488672908363',
  lib: {
    name: 'alco.js',
    libver: 115,
    snippet: 1
  },
  client:
    {
      ts: 1520289580598,
      tz: 'MSK',
      tzOffset: 180000,
      platform: 'MacIntel',
      product: 'Gecko'
    },
  cf:
    {
      locstor: true,
      addel: true,
      promise: true,
      sbeacon: true,
      atob: true
    },
  browser:
    {
      if: [0, 0],
      wh: {
        w: 1440,
        h: 485
      },
      sr:
        {
          tot: {},
          avail: {},
          asp: 2000,
          oAngle: 0,
          oType: 'landscape-primary'
        }
    },
  perf:
    {
      cs: 0,
      ce: 8,
      scs: 0,
      rqs: 8,
      rss: 284,
      rse: 294,
      dl: 337,
      di: 778,
      dc: 972
    },
  ip: '95.153.129.199',
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.186 Safari/537.36',
  scroll: {},
  id: '4811745651740627475',
  mdd:
    {
      isBot: 0,
      os: {
        name: 'Mac',
        version: '10.13',
        platform: ''
      },
      client: {
        type: 'browser',
        name: 'Chrome',
        version: '64.0'
      },
      device: {
        type: 'desktop',
        brand: '',
        model: ''
      }
    },
  sxg:
    {
      country: {
        iso: 'RU',
        name_ru: 'Россия',
        name_en: 'Russia'
      },
      region:
        {
          name_ru: 'Краснодарский край',
          name_en: 'Krasnodarskiy Kray',
          iso: 'dfsdfs'
        },
      city: {
        id: 542420,
        name_ru: 'Краснодар',
        name_en: 'Krasnodar'
      }
    },
  data: {
    update_id: 3237028,
    message: {
      'message_id': 21,
      'from': {
        'id': 97444302,
        'is_bot': false,
        'first_name': 'Dmitry',
        'last_name': 'Rodin',
        'username': 'dmitryrodin',
        'language_code': 'en-RU'
      },
      'chat': {
        'id': -1001357144786,
        'title': 'Xeteq Alcolytics Internal',
        'type': 'supergroup'
      },
      'date': 1521487696,
      'new_chat_participant': {
        'id': 230749719,
        'is_bot': false,
        'first_name': 'Alex',
        'last_name': 'this.createSome();',
        'username': 'sosedsatany667'
      },
      'new_chat_member': {
        'id': 230749719,
        'is_bot': false,
        'first_name': 'Alex',
        'last_name': 'this.createSome();',
        'username': 'sosedsatany667'
      },
      'new_chat_members': [
        {
          'id': 230749719,
          'is_bot': false,
          'first_name': 'Alex',
          'last_name': 'this.createSome();',
          'username': 'sosedsatany667'
        }
      ]
    }
  }
};


const nestedKV = new Set();
Object.keys(cols)
  .forEach((e) => {
    if (e.indexOf('.') >= 0) {
      const path = e.slice(0, e.indexOf('.'));
      const key = e.slice(e.indexOf('.') + 1);
      nestedKV.add(path);
    }
  });

const emptySet = new Set();

const isObject = o => !!o && typeof o === 'object' && Object.prototype.toString.call(o) === '[object Object]';
const isArray = o => !!o && typeof o === 'object' && o instanceof Array;// Array.isArray(o);


const handleValue = (value) => {
  if (isArray(value)) {
    return value.map(e => JSON.stringify(e))
  }
  return value;
};

/**
 *
 * @param child {Object}
 * @param nested {Set}
 * @param cols {Object}
 * @param path {Array<string>}
 * @param separator {string}
 * @param noCheck {boolean}
 * @return {Object}
 */
const flatObject = (child, nested, cols, path = [], separator = '_', noCheck = false) => {
  const acc = {};
  const root_path = path.join(separator);
  const kv = root_path && nested && nested.has(root_path) ? {} : null;

  Object.keys(child)
    .forEach(key => {
      const val = child[key];
      const isObj = isObject(val);
      if (kv) {
        if (isObj) {
          Object.assign(
            kv,
            flatObject(val, null, {}, [], separator, true)
          );
        }
        else {
          kv[key] = val;
        }
      }
      else {
        const item_path = path.concat(key)
          .join(separator);
        if (isObj) {
          Object.assign(
            acc,
            flatObject(val, nested, cols, path.concat([key]), separator, noCheck)
          );
        }
        else if (cols[item_path] || noCheck) {
          acc[item_path] = val;
        }
        else {
          console.warn(`!! not found path:${path.join('.')}, key:${key}, val:${val}`);
        }
      }
    });
  return Object.assign(
    acc,
    kv && flatObject(unzip(kv, String, String), null, cols, [root_path], '.', true)
  );
};


const rec = flatObject(data, nestedKV, cols);

console.log(rec);




