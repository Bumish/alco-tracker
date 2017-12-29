'use strict';

const Promise = require('bluebird');
const zk = require('node-zookeeper-client-async');

class ZookeeperConfig {

  constructor(options){

    console.log('Constructing zookeeper configurator');

    this.options = Object.assign({
      host: 'localhost',
      port: 2181,
      path: '/test'
    }, options);

    this.connString = this.options.host + ':' + this.options.port;
    this.configPath = this.options.path + '/config';

  }

  async connect(){

    this.client = zk.createAsyncClient(this.connString);
    await this.client.connectAsync();

  }

  async enshureStruct(){

    await this.client.mkdirpAsync(this.configPath);

  }


  async getData(path){

    const data = {};
    const nodes = await this.client.getChildrenAsync(path);

    await Promise.all(nodes.map(async node => {

      const node_path = `${path}/${node}`;
      const node_data = await this.client.getDataAsync(node_path);

      data[node] = node_data.stat.numChildren > 0
        ? await this.getData(node_path)
        : (node_data.data !== undefined) && node_data.data.toString('utf8');

    }));

    return data;

  }

  async load(){

    await this.connect();
    await this.enshureStruct();

    return await this.getData(this.configPath);
  }

}

module.exports = ZookeeperConfig;


