'use strict';

const path = require('path');
const fs = require('fs');

const ejs = require('ejs');
const yaml = require('js-yaml');

class LocalConfig {

  constructor(options) {

    this.defaults = {
      path: '../../config',
      fn: 'config.yaml'
    };

    this.options = Object.assign({}, this.defaults, options);
    this.configFn = path.join(this.options.path, this.options.fn);

  }


  async load() {

    if (!fs.existsSync(this.configFn)) {
      return console.error('config not found');
    }

    const rawConfig = fs.readFileSync(this.configFn).toString();
    const compiledConfig = ejs.render(rawConfig, {env: process.env});

    return yaml.load(compiledConfig);

  }
}


module.exports = LocalConfig;

