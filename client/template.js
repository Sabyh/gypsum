((global, factory) => {
  if (module && module.exports) {
    const io = require('socket.io-client');
    const axios = require('axios');
    module.exports = factory(io, axios);
  } else if (global.document) {
    global.gypsumClient = factory(global.axios, global.io);
  }
})(this, (axios, io) => {

  const gypsumClient = {};
  const configurations = {}//{};
  const apps = {};
  const models = {};
  let socket;

  if (io) {
    socket = io(configurations.origin);
  }

  gypsumClient.app = function (name) {
    return apps[name] || apps.default;
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
    constructor(name, services) {
      this.name = name;
      this.services = services;
      this.listeners = {};
      this.lastEvent = '';
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

      if (socket && this.services[serviceName].event) {
        socket.on(this.services[serviceName].event, res => {
          respond.call(this, serviceName, res);
        });
      }

      this.lastEvent = serviceName;
      return this;
    }

    once(serviceName, callback) {
      return this.on(serviceName, callback, true);
    }

    then(callback, once) {
      if (this.lastEvent)
        return this.on(this.lastEvent, callback, once);

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
        if (socket)
          socket.off(serviceName);

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

    dispatch(serviceName, data) {
      if (!serviceName) {
        console.warn('service name was not defined');
        return this;
      }

      serviceName = serviceName.toLowerCase();

      if (!this.services.hasOwnProperty(serviceName)) {
        console.warn(serviceName, 'service for model:', this.name, 'does not exists');
        return this;
      }

      if (socket && this.services[serviceName].event) {
        socket.emit(this.services[serviceName].event, data);
      } else if (axios && this.services[serviceName].path) {
        let service = this.services[serviceName];
        axios[service.method]({
          url: generateServiceUrl(service.path, data.params, data.query),
          body: data.body,
          headers: data.headers
        })
          .then(res => {
            respond.call(this, serviceName, res);
          })
          .catch(err => {
            respond.call(this, serviceName, res);
          });
      } else {
        if (this.services[serviceName].event && !socket) {
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
  for (let i = 0; i < configurations.models.length; i++) {
    let model = configurations.models[i];
    apps[model.app] = apps[model.app] || {};
    apps[model.app][model.name] = new Model(model.name, model.services);
  }

  return gypsumClient;
});