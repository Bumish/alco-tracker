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

  return {key, value};
}


const fields = new Set([
  'date',
  'dateTime',
  'timestamp',
  'id',
  'projectId',
  'name',
  'uid',
  'ip',
  'userAgent',
  'page_url',
  'page_referrer',
  'page_title',
  'page_domain',
  'page_proto',
  'page_query_utm_source',
  'page_query_utm_campaign',
  'page_query_utm_medium',
  'page_query_utm_content',
  'page_query_utm_term',
  'page_query.key',
  'page_query.value',
  'session_type',
  'session_engine',
  'session_num',
  'session_hasMarks',
  'session_pageNum',
  'session_eventNum',
  'session_marks_utm_source',
  'session_marks_utm_campaign',
  'session_marks_utm_medium',
  'session_marks_utm_content',
  'session_marks_utm_term',
  'session_marks.key',
  'session_marks.value',
  'session_start',
  'session_refHost',
  'lib_name',
  'lib_libver',
  'lib_snippet',
  'client_tz',
  'client_ts',
  'client_tzOffset',
  'client_platform',
  'client_product',
  'browser_if',
  'browser_wh_w',
  'browser_wh_h',
  'browser_sr_tot_w',
  'browser_sr_tot_h',
  'browser_sr_avail_w',
  'browser_sr_avail_h',
  'browser_sr_asp',
  'browser_sr_oAngle',
  'browser_sr_oType',
  'sxg_country_iso',
  'sxg_country_name_ru',
  'sxg_country_name_en',
  'sxg_region_iso',
  'sxg_region_name_ru',
  'sxg_region_name_en',
  'sxg_city_id',
  'sxg_city_name_ru',
  'sxg_city_name_en',
  'mdd_isBot',
  'mdd_client_type',
  'mdd_client_name',
  'mdd_client_version',
  'mdd_os_name',
  'mdd_os_version',
  'mdd_os_platform',
  'mdd_device_type',
  'mdd_device_brand',
  'mdd_device_model',
  'user_id',
  'user_gaId',
  'user_ymId',
  'user_traits.key',
  'user_traits.value',
  'data.key',
  'data.value',
  'scroll_docHeight',
  'scroll_clientHeight',
  'scroll_topOffset',
  'scroll_scroll',
  'scroll_maxScroll',
  'cf_locstor',
  'cf_addel',
  'cf_promise',
  'cf_sbeacon',
  'cf_atob',
  'perf_ce',
  'perf_cs',
  'perf_dc',
  'perf_di',
  'perf_dl',
  'perf_rqs',
  'perf_rse',
  'perf_rss',
  'perf_scs'
]);


const data = {
  date: '2018-03-05',
  dateTime: '2018-03-05 22:39:40',
  timestamp: 1520289580643,
  page: {query: {utm_source: '123', huy: 'vam'}},
  session: {marks: {}},
  user: {traits: {}},
  data: {},
  name: 'Page loaded',
  projectId: 12,
  uid: '4779592488672908363',
  lib: {name: 'alco.js', libver: 115, snippet: 1},
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
      wh: {w: 1440, h: 485},
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
      os: {name: 'Mac', version: '10.13', platform: ''},
      client: {type: 'browser', name: 'Chrome', version: '64.0'},
      device: {type: 'desktop', brand: '', model: ''}
    },
  sxg:
    {
      country: {iso: 'RU', name_ru: 'Россия', name_en: 'Russia'},
      region:
        {
          name_ru: 'Краснодарский край',
          name_en: 'Krasnodarskiy Kray',
          id: 0
        },
      city: {id: 542420, name_ru: 'Краснодар', name_en: 'Krasnodar'}
    }
};

const nestedKV = [...fields].reduce((acc, e) => {
  if (e.indexOf('.') >= 0) {
    const path = e.slice(0, e.indexOf('.'));
    const key = e.slice(e.indexOf('.') + 1);
    if (!acc[path] && (key === 'key' || key === 'value')) {
      acc[path] = true;
    }
  }
  return acc;
}, {});


const isObject = (value) => typeof value === 'object' && !Array.isArray(value);

const walker = (child, separator = '_', path = []) => {
  const accum = {};
  const root_path = path.join(separator);
  const kv = Object.keys(nestedKV).indexOf(root_path) >= 0 ? {} : null;

  Object.keys(child).forEach(key => {

    if (isObject(child[key])) {

      Object.assign(accum, walker(child[key], separator, path.concat([key])));

    } else {

      const item_path = path.concat(key).join(separator);

      if (fields.has(item_path)) {
        accum[item_path] = child[key];
      } else if (kv) {
        kv[key] = child[key];
      } else {
        console.log(`!! not found ${item_path}`);
      }
    }
  });
  if (kv) {
    accum[root_path] = kv;
  }
  return accum;
};


const rec = walker(data, '_');

console.log(rec);




