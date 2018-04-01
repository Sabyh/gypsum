((global, factory) => {
  if (typeof module !== 'undefined' && typeof exports === 'object') {
    const io = require('socket.io-client');
    const axios = require('axios');
    module.exports = factory(io, axios);
  } else if (global !== undefined) {
    global.gypsumClient = factory(global.axios, global.io);
  }
})(this, (axios, io) => {

  const gypsumClient = {};
  const configurations = {"hostName":"localhost","origin":":7772","models":[],"apps":[{"name":"api","apiType":3,"models":[{"name":"users","services":{"count":{"name":"count","event":"users Count","method":"get","path":"http://api.localhost:7772/users/count"},"find":{"name":"find","event":"users Find","method":"get","path":"http://api.localhost:7772/users"},"findone":{"name":"findone","event":"users FindOne","method":"get","path":"http://api.localhost:7772/users/findone"},"findbyid":{"name":"findbyid","event":"users FindById","method":"get","path":"http://api.localhost:7772/users/:id"},"insert":{"name":"insert","event":"users Insert","method":"post","path":"http://api.localhost:7772/users"},"insertone":{"name":"insertone","event":"users InsertOne","method":"post","path":"http://api.localhost:7772/users/insertone"},"search":{"name":"search","event":"users Search","method":"post","path":"http://api.localhost:7772/users/search"},"update":{"name":"update","event":"users Update","method":"put","path":"http://api.localhost:7772/users"},"updateone":{"name":"updateone","event":"users UpdateOne","method":"put","path":"http://api.localhost:7772/users/updateone"},"updatebyid":{"name":"updatebyid","event":"users UpdateById","method":"put","path":"http://api.localhost:7772/users/:id"},"delete":{"name":"delete","event":"users Delete","method":"delete","path":"http://api.localhost:7772/users"},"deleteone":{"name":"deleteone","event":"users DeleteOne","method":"delete","path":"http://api.localhost:7772/users/deleteone"},"deletebyid":{"name":"deletebyid","event":"users DeleteById","method":"delete","path":"http://api.localhost:7772/users/:id"}}}]}]};
  const apps = [];
  const defaults = {
    timeout: 10000,
    withCredentials: false
  }

  gypsumClient.config = function (options) {
    defaults.timeout = options.timeout || 10000;
    defaults.withCredentials = options.withCredentials !== undefined ? !!options.withCredentials : true;
  }

  gypsumClient.getApp = function (name, headers) {
    let app = apps.find(app => app.name === name);
    return app ? app.init(headers) : undefined;
  }

  /**
   * Util
   * ============================================================================================================================
   */
  const Util = {

    // Value to String
    // ------------------------------------------------------------------------------------------------------------------------
    valueToString(value) {
      let result = "";

      if (value === undefined)
        return 'undefined';

      if (value === null)
        return 'null';

      if (typeof value === 'number' || typeof value === 'string')
        return value;

      if (value instanceof RegExp || typeof value === 'boolean')
        return value.toString();

      if (Array.isArray(value)) {
        result += '[';
        for (let i = 0; i < value.length; i++) {
          result += this.valueToString(value[i]);
          if (i < value.length - 1)
            result += ',';
        }
        result += ']';
        return result;
      }

      if (typeof value === "object") {
        result += '{';
        for (let prop in value) {
          result += prop + ':';
          result += this.valueToString(value[prop]);
          result += ','
        }

        result = result.length > 1 ? result.slice(0, result.length - 1) : result;
        result += '}';
        return result;
      }

      return result;
    },

    // Object to Query String
    // ------------------------------------------------------------------------------------------------------------------------
    objectToQueryString(obj, encode) {
      let result = "";

      if (!obj || !Object.keys(obj).length)
        return result;

      for (let prop in obj)
        result += '&' + prop + '=' + this.valueToString(obj[prop]);

      return encode ? encodeURI(result.slice(1)) : result.slice(1);
    },

    // Clean Path
    // ------------------------------------------------------------------------------------------------------------------------
    cleanPath(path) {
      if (!path)
        return "";

      path = path.trim()
        .replace(/^\/|\/$/g, "")
        .replace(/:\/\//, '%')
        .replace(/\/{2,}/g, "/")
        .replace('%', '://')
        .replace(/(\w+)\/\.\./g, "$1");

      return path;
    }
  }

  /**
   * App Class
   * ============================================================================================================================
   */
  class App {

    constructor(name, apiType, namespaces) {
      this.name = name;
      this.apiType = apiType;
      this.namespaces = ns;
      this.socket;
      this.headers;
    }

    init(headers) {
      if (this.apiType === 1)
        return this;

      if (!headers && this.socket && this.socket.connected)
        return;

      this.headers = Object.assign(this.headers || {}, headers || {});

      if (this.socket)
        this.socket.disconnect();

      if (io) {
        this.socket = io(configurations.origin + '/' + this.name, {
          reconnection: true,
          query: { app: this.name },
          transportOptions: {
            polling: {
              extraHeaders: this.headers
            }
          },
          forceNew: true
        });
      }

      return this;
    }

    namespace(nsName) {
      if (this.namespaces && this.namespaces.indexOf(nsName) === -1)
        return;

      let app = new App(this.name + '/' + nsName, this.apiType);
      let appOptions = configurations.apps.find(_app => _app.name === this.name);
      
      if (!appOptions.models || !appOptions.models.length)
        return;
        
      for (let i = 0; i < appOptions.models.length; i++)
        app[appOptions.models[i].name] = new Model(appOptions.models[i].name, appOptions.models[i].services, app);

      return app;
    }
  }


  /**
   * Model Class
   * ============================================================================================================================
   */

  // Private Methods
  // ------------------------------------------------------------------------------------------------------------------------
  function respond(serviceName, res) {

    if (this.listeners.hasOwnProperty(serviceName)) {
      if (Number(res.code) < 400) {
        this.listeners[serviceName].res = res;
        for (let i = 0; i < this.listeners[serviceName].handlers.length; i++) {
          this.listeners[serviceName].handlers[i].call(this, res);
          if (this.listeners[serviceName].handlers[i].once)
            this.listeners[serviceName].handlers.splice(i--, 1);
        }

        if (!this.listeners[serviceName].handlers.length)
          this.off(serviceName);

      } else {
        for (let i = 0; i < this.listeners[serviceName].errorHandlers.length; i++)
          this.listeners[serviceName].errorHandlers[i].call(this, res);
      }
    }
  }

  function generateServiceUrl(path, params, query) {
    if (params && Object.keys(params).length) {
      path.replace(/(:[a-zA-Z0-9_-]+\?*)/g, (match, $1) => {
        let key = $1.slice(1);

        if (key.indexOf('?') > -1) {
          key = key.slice(0, key.length - 1);
          return params[key] || '';
        }

        return params[key] || undefined;
      });

      path = Util.cleanPath(path);
    }

    if (query && Object.keys(query).length)
      path += '?' + Util.objectToQueryString(query);

    return path;
  }

  class Model {
    // Constructor
    // ----------------------------------------------------------------------------------------------------------------------
    constructor(name, services, app) {
      this.name = name;
      this.services = services;
      this.listeners = {};
      this.lastEvent = '';
      this.app = app;
    }

    // Public Methods
    // ----------------------------------------------------------------------------------------------------------------------
    on(serviceName, callback, once) {
      if (!serviceName) {
        console.warn('service name was not defined');
        return this;
      }

      if (!callback) {
        console.warn('handler was not defined');
        return this;
      }

      serviceName = serviceName.toLowerCase();

      callback.once = once;

      if (!this.services.hasOwnProperty(serviceName)) {
        console.warn(serviceName, 'service for model:', this.name, 'does not exists');
        return this;
      }

      if (this.listeners.hasOwnProperty(serviceName)) {
        for (let i = 0; i < this.listeners[serviceName].handlers.length; i++)
          if (this.listeners[serviceName].handlers[i] === callback) {
            this.lastEvent = serviceName;
            return this;
          }

        this.listeners[serviceName].handlers.push(callback);
        this.lastEvent = serviceName;
        return this;
      }

      this.listeners[serviceName] = { res: null, handlers: [callback], errorHandlers: [] };

      if (this.app.socket && this.services[serviceName].event) {
        this.app.socket.on(this.services[serviceName].event, res => {
          respond.call(this, serviceName, res);
        });
      }

      this.lastEvent = serviceName;
      return this;
    }

    once(serviceName, callback) {
      return this.on(serviceName, callback, true);
    }

    then(callback) {
      if (this.lastEvent)
        return this.on(this.lastEvent, callback, true);

      console.warn('cannot call then without a dispatch!');
      return this;
    }

    off(serviceName, handler) {
      if (!serviceName) {
        console.warn('service name was not defined');
        return this;
      }

      serviceName = serviceName.toLowerCase();

      if (!handler && serviceName) {
        delete this.listeners[serviceName];
        if (this.app.socket)
          this.app.socket.off(serviceName);

      } else if (serviceName) {
        for (let i = 0; i < this.listeners[serviceName].handlers.length; i++)
          if (this.listeners[serviceName].handlers[i] === handler) {
            this.listeners[serviceName].handlers.splice(i, 1);
            break;
          }

        if (this.listeners[serviceName].handlers.length === 0)
          this.off(serviceName);
      }

      return this;
    }

    dispatch(serviceName, data, options) {
      if (!serviceName) {
        console.warn('service name was not defined');
        return this;
      }

      serviceName = serviceName.toLowerCase();

      if (!this.services.hasOwnProperty(serviceName)) {
        console.warn(serviceName, 'service for model:', this.name, 'does not exists');
        return this;
      }

      if (this.app.socket && this.services[serviceName].event) {
        this.app.socket.emit(this.services[serviceName].event, data);
      } else if (axios && this.services[serviceName].path) {
        let service = this.services[serviceName];
        options = options || {};
        axios({
          method: service.method,
          url: generateServiceUrl(service.path, data.params, data.query),
          data: data.body,
          headers: data.headers,
          withCredentials: options.withCredentials !== undefined ? !!options.withCredentials : defaults.withCredentials,
          timeout: options.timeout || defaults.timeout
        })
          .then(res => {
            respond.call(this, serviceName, res ? res.data : res);
          })
          .catch(err => {
            respond.call(this, serviceName, err);
          });
      } else {
        if (this.services[serviceName].event && !this.app.socket) {
          console.error('socket is required to dispatch', this.name, serviceName, 'service!');
        } else {
          console.error('axios is required to dispatch', this.name, serviceName, 'service!');
        }
      }

      this.lastEvent = serviceName;
      return this;
    }

    catch(errorCallback) {
      if (this.lastEvent && this.listeners.hasOwnProperty(this.lastEvent))
        this.listeners[this.lastEvent].errorHandlers.push(errorCallback);

      this.lastEvent = '';
      return this;
    }
  }

  /**
   * Instantiating Models
   * ============================================================================================================================
   */
  for (let i = 0; i < configurations.apps.length; i++) {
    let app = new App(configurations.apps[i].name, configurations.apps[i].apiType, configurations.apps[i].namespaces);

    for (let j = 0; j < configurations.apps[i].models; j++) {
      let model = configurations.apps[i].models[j];
      app[model.name] = new Model(model.name, model.services, app);
    }

    apps.push(app);
  }

  return gypsumClient;
});