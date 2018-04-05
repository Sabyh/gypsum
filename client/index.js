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
  const configurations = {"hostName":"localhost","origin":":7772","models":[],"apps":[{"name":"api","apiType":3,"models":[{"name":"users","services":{"sendactivationemail":{"name":"sendactivationemail","event":"users sendactivationemail","method":"get","path":"http://api.localhost:7772/users/sendactivationemail"},"activateuser":{"name":"activateuser","event":"users activateuser","method":"get","path":"http://api.localhost:7772/users/activateuser"},"forgetpassword":{"name":"forgetpassword","event":"users forgetpassword","method":"get","path":"http://api.localhost:7772/users/forgetpassword"},"signin":{"name":"signin","event":"users signin","method":"post","path":"http://api.localhost:7772/users/signin"},"signup":{"name":"signup","event":"users signup","method":"post","path":"http://api.localhost:7772/users/signup"},"findbyid":{"name":"findbyid","event":"users findbyid","method":"get","path":"http://api.localhost:7772/users/findbyid/:id"},"findone":{"name":"findone","event":"users findone","method":"get","path":"http://api.localhost:7772/users/findone"},"insertone":{"name":"insertone","event":"users insertone","method":"post","path":"http://api.localhost:7772/users/insertone"},"count":{"name":"count","event":"users count","method":"get","path":"http://api.localhost:7772/users/count"},"find":{"name":"find","event":"users find","method":"get","path":"http://api.localhost:7772/users/find"},"insert":{"name":"insert","event":"users insert","method":"post","path":"http://api.localhost:7772/users/insert"},"search":{"name":"search","event":"users search","method":"post","path":"http://api.localhost:7772/users/search"},"update":{"name":"update","event":"users update","method":"put","path":"http://api.localhost:7772/users/update"},"updateone":{"name":"updateone","event":"users updateone","method":"put","path":"http://api.localhost:7772/users/updateone"},"updatebyid":{"name":"updatebyid","event":"users updatebyid","method":"put","path":"http://api.localhost:7772/users/updatebyid/:id"},"delete":{"name":"delete","event":"users delete","method":"delete","path":"http://api.localhost:7772/users/delete"},"deleteone":{"name":"deleteone","event":"users deleteone","method":"delete","path":"http://api.localhost:7772/users/deleteone"},"deletebyid":{"name":"deletebyid","event":"users deletebyid","method":"delete","path":"http://api.localhost:7772/users/deletebyid/:id"}}},{"name":"authorization","services":{}},{"name":"permissions","services":{"find":{"name":"find","event":"permissions find","method":"get","path":"http://api.localhost:7772/permissions/find"}}},{"name":"authroles","services":{"count":{"name":"count","event":"authroles count","method":"get","path":"http://api.localhost:7772/authroles/count"},"find":{"name":"find","event":"authroles find","method":"get","path":"http://api.localhost:7772/authroles/find"},"findone":{"name":"findone","event":"authroles findone","method":"get","path":"http://api.localhost:7772/authroles/findone"},"findbyid":{"name":"findbyid","event":"authroles findbyid","method":"get","path":"http://api.localhost:7772/authroles/findbyid/:id"},"insert":{"name":"insert","event":"authroles insert","method":"post","path":"http://api.localhost:7772/authroles/insert"},"insertone":{"name":"insertone","event":"authroles insertone","method":"post","path":"http://api.localhost:7772/authroles/insertone"},"search":{"name":"search","event":"authroles search","method":"post","path":"http://api.localhost:7772/authroles/search"},"update":{"name":"update","event":"authroles update","method":"put","path":"http://api.localhost:7772/authroles/update"},"updateone":{"name":"updateone","event":"authroles updateone","method":"put","path":"http://api.localhost:7772/authroles/updateone"},"updatebyid":{"name":"updatebyid","event":"authroles updatebyid","method":"put","path":"http://api.localhost:7772/authroles/updatebyid/:id"},"delete":{"name":"delete","event":"authroles delete","method":"delete","path":"http://api.localhost:7772/authroles/delete"},"deleteone":{"name":"deleteone","event":"authroles deleteone","method":"delete","path":"http://api.localhost:7772/authroles/deleteone"},"deletebyid":{"name":"deletebyid","event":"authroles deletebyid","method":"delete","path":"http://api.localhost:7772/authroles/deletebyid/:id"}}},{"name":"authgroups","services":{"count":{"name":"count","event":"authgroups count","method":"get","path":"http://api.localhost:7772/authgroups/count"},"find":{"name":"find","event":"authgroups find","method":"get","path":"http://api.localhost:7772/authgroups/find"},"findone":{"name":"findone","event":"authgroups findone","method":"get","path":"http://api.localhost:7772/authgroups/findone"},"findbyid":{"name":"findbyid","event":"authgroups findbyid","method":"get","path":"http://api.localhost:7772/authgroups/findbyid/:id"},"insert":{"name":"insert","event":"authgroups insert","method":"post","path":"http://api.localhost:7772/authgroups/insert"},"insertone":{"name":"insertone","event":"authgroups insertone","method":"post","path":"http://api.localhost:7772/authgroups/insertone"},"search":{"name":"search","event":"authgroups search","method":"post","path":"http://api.localhost:7772/authgroups/search"},"update":{"name":"update","event":"authgroups update","method":"put","path":"http://api.localhost:7772/authgroups/update"},"updateone":{"name":"updateone","event":"authgroups updateone","method":"put","path":"http://api.localhost:7772/authgroups/updateone"},"updatebyid":{"name":"updatebyid","event":"authgroups updatebyid","method":"put","path":"http://api.localhost:7772/authgroups/updatebyid/:id"},"delete":{"name":"delete","event":"authgroups delete","method":"delete","path":"http://api.localhost:7772/authgroups/delete"},"deleteone":{"name":"deleteone","event":"authgroups deleteone","method":"delete","path":"http://api.localhost:7772/authgroups/deleteone"},"deletebyid":{"name":"deletebyid","event":"authgroups deletebyid","method":"delete","path":"http://api.localhost:7772/authgroups/deletebyid/:id"}}}]}]};
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