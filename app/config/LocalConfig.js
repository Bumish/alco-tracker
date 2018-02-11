'use strict';

const path = require('path');
const fs = require('fs');

const ejs = require('ejs');
const yaml = require('js-yaml');

class LocalConfig {

  constructor(options) {

    this.defaults = {
      path: '../../config',
      serviceConfig: 'config.yml',
      customConfig: 'custom/config.yml'
    };

    this.options = Object.assign({}, this.defaults, options);
    this.serviceConfigFn = path.join(this.options.path, this.options.serviceConfig);
    this.customConfigFn = path.join(this.options.path, this.options.customConfig);

  }

  loadConfig(fn){

    const rawConfig = fs.readFileSync(fn).toString();
    const compiledConfig = ejs.render(rawConfig, {env: process.env});

    return yaml.load(compiledConfig);

  }

  async serviceConfig() {

    if (!fs.existsSync(this.serviceConfigFn)) {
      return console.error('config not found');
    }

    const custom = await this.customConfig();
    const main = this.loadConfig(this.serviceConfigFn);

    const config = Object.assign(main, custom);
    config.isProduction = process.env.NODE_ENV === 'production';

    return config;

  }

  async customConfig() {

    if (!fs.existsSync(this.customConfigFn)) {
      console.log('custom config not present');
      return {};
    }

    return this.loadConfig(this.customConfigFn);

  }

}


module.exports = LocalConfig;

