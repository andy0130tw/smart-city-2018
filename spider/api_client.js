'use strict';

var request = require('request');

class ApiClient {
  constructor () {
    
  }

  get (api, params) {
    return this.request('get', api, params, 'qs');
  }

  post (api, params) {
    return this.request('post', api, params);
  }

  put (api, params) {
    return this.request('put', api, params);
  }

  request (method, api, params, postField) {
    let url = api;
    let data = {
      url: url,
      json: true,
      gzip: true
      
    };
    if (!postField) {
      postField = 'form';
    }
    data[postField] = params;

    return new Promise((resolve, reject) => {
      request[method](data, async (err, resp, json) => {
        if (err || resp.statusCode >= 400) {
          if (err) {
            return reject(err, resp);
          } else if (json !== undefined && json.hasOwnProperty('errors')) {
            return reject(json.errors, resp);
          } else {
            return reject(resp.statusCode, resp);
          }
        }
        
        resolve(json);
      });
    });
  }
}

module.exports = ApiClient;
