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
  const configurations = {"hostName":"localhost","origin":":7771","models":[],"apps":[{"name":"api","apiType":3,"models":[{"name":"users","services":{"sendactivationemail":{"name":"sendactivationemail","event":"users SendActivationEmail","method":"get","path":"http://api.localhost:7771/users/sendactivationemail"},"activateuser":{"name":"activateuser","event":"users ActivateUser","method":"get","path":"http://api.localhost:7771/users/activateuser"},"signin":{"name":"signin","event":"users Signin","method":"post","path":"http://api.localhost:7771/users/signin"},"signup":{"name":"signup","event":"users Signup","method":"post","path":"http://api.localhost:7771/users/signup"},"count":{"name":"count","event":"users Count","method":"get","path":"http://api.localhost:7771/users/count"},"find":{"name":"find","event":"users Find","method":"get","path":"http://api.localhost:7771/users"},"findone":{"name":"findone","event":"users FindOne","method":"get","path":"http://api.localhost:7771/users/findone"},"findbyid":{"name":"findbyid","event":"users FindById","method":"get","path":"http://api.localhost:7771/users/findbyid"},"insert":{"name":"insert","event":"users Insert","method":"post","path":"http://api.localhost:7771/users"},"search":{"name":"search","event":"users Search","method":"post","path":"http://api.localhost:7771/users/search"},"update":{"name":"update","event":"users Update","method":"put","path":"http://api.localhost:7771/users"},"updateone":{"name":"updateone","event":"users UpdateOne","method":"put","path":"http://api.localhost:7771/users/updateone"},"updatebyid":{"name":"updatebyid","event":"users UpdateById","method":"put","path":"http://api.localhost:7771/users/updatebyid"},"delete":{"name":"delete","event":"users Delete","method":"delete","path":"http://api.localhost:7771/users"},"deleteone":{"name":"deleteone","event":"users DeleteOne","method":"delete","path":"http://api.localhost:7771/users/deleteone"},"deletebyid":{"name":"deletebyid","event":"users DeleteById","method":"delete","path":"http://api.localhost:7771/users/deletebyid"}}},{"name":"authorization","services":{}},{"name":"permissions","services":{"find":{"name":"find","event":"permissions Find","method":"get","path":"http://api.localhost:7771/permissions"}}},{"name":"authroles","services":{"count":{"name":"count","event":"authroles Count","method":"get","path":"http://api.localhost:7771/authroles/count"},"find":{"name":"find","event":"authroles Find","method":"get","path":"http://api.localhost:7771/authroles"},"findone":{"name":"findone","event":"authroles FindOne","method":"get","path":"http://api.localhost:7771/authroles/findone"},"findbyid":{"name":"findbyid","event":"authroles FindById","method":"get","path":"http://api.localhost:7771/authroles/findbyid"},"insert":{"name":"insert","event":"authroles Insert","method":"post","path":"http://api.localhost:7771/authroles"},"search":{"name":"search","event":"authroles Search","method":"post","path":"http://api.localhost:7771/authroles/search"},"update":{"name":"update","event":"authroles Update","method":"put","path":"http://api.localhost:7771/authroles"},"updateone":{"name":"updateone","event":"authroles UpdateOne","method":"put","path":"http://api.localhost:7771/authroles/updateone"},"updatebyid":{"name":"updatebyid","event":"authroles UpdateById","method":"put","path":"http://api.localhost:7771/authroles/updatebyid"},"delete":{"name":"delete","event":"authroles Delete","method":"delete","path":"http://api.localhost:7771/authroles"},"deleteone":{"name":"deleteone","event":"authroles DeleteOne","method":"delete","path":"http://api.localhost:7771/authroles/deleteone"},"deletebyid":{"name":"deletebyid","event":"authroles DeleteById","method":"delete","path":"http://api.localhost:7771/authroles/deletebyid"}}},{"name":"authgroups","services":{"count":{"name":"count","event":"authgroups Count","method":"get","path":"http://api.localhost:7771/authgroups/count"},"find":{"name":"find","event":"authgroups Find","method":"get","path":"http://api.localhost:7771/authgroups"},"findone":{"name":"findone","event":"authgroups FindOne","method":"get","path":"http://api.localhost:7771/authgroups/findone"},"findbyid":{"name":"findbyid","event":"authgroups FindById","method":"get","path":"http://api.localhost:7771/authgroups/findbyid"},"insert":{"name":"insert","event":"authgroups Insert","method":"post","path":"http://api.localhost:7771/authgroups"},"search":{"name":"search","event":"authgroups Search","method":"post","path":"http://api.localhost:7771/authgroups/search"},"update":{"name":"update","event":"authgroups Update","method":"put","path":"http://api.localhost:7771/authgroups"},"updateone":{"name":"updateone","event":"authgroups UpdateOne","method":"put","path":"http://api.localhost:7771/authgroups/updateone"},"updatebyid":{"name":"updatebyid","event":"authgroups UpdateById","method":"put","path":"http://api.localhost:7771/authgroups/updatebyid"},"delete":{"name":"delete","event":"authgroups Delete","method":"delete","path":"http://api.localhost:7771/authgroups"},"deleteone":{"name":"deleteone","event":"authgroups DeleteOne","method":"delete","path":"http://api.localhost:7771/authgroups/deleteone"},"deletebyid":{"name":"deletebyid","event":"authgroups DeleteById","method":"delete","path":"http://api.localhost:7771/authgroups/deletebyid"}}}]}]};
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