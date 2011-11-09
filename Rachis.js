(function () {
  var Rachis = {};

  var instances = {
    /*
    uuid: {
      instance: model,
      subscribers: {
        field: [
          handler: fn,
          context: null
        ]
      },
      referrers: [uuids]
    }
    */
  };

  //////////////////////////////////////////////////////////////[ Model ]////
  function Model (data) {
    data = data || {};
    var uuid = data.uuid || Math.random().toString(36).substr(2);
      
    instances[uuid] = {
      instance: this,
      fields: {},
      observers: {},
      referrers: {}
    }

    for (var k in data) {
      this[k] = data[k];
    }

    this.uuid = uuid;
  }

  Model.prototype = Object.create({}, {
    constructor: {value: Model},

    notifyObservers: {value: function (eventType, payload) {
      var observers = instances[this.uuid].observers[eventType];
      if (observers && observers.length) {
        observers.forEach(function (observer) {
          observer.handler.call(observer.context, payload);
        });
      }
    }},

    addObserver: {value: function (eventType, handler, context) {
      instances[this.uuid].observers[eventType] =
      instances[this.uuid].observers[eventType] || [];

      instances[this.uuid].observers[eventType].push({
        handler: handler,
        context: context
      });
    }},

    removeObserver: {value: function (eventType, handler, context) {
      instances[this.uuid].observers[eventType] =
      instances[this.uuid].observers[eventType].filter(function (item) {
        return ((item.handler != handler) && item.context != context);
      });
    }},

    addReferrer: {value: function (ref) {
    }},

    removeReferrer: {value: function (ref) {
    }},

    toJSON: {value: function () {
      var obj = {};

      for (var k in this) {
        if (this[k] instanceof Model) {
          obj[k] = {
            '\u2261': this[k].uuid
          };
        } else {
          obj[k] = this[k];
        }
      }

      return obj;
    }},
  });

  Model.defineField = function (cls, key, dfn) {
    dfn = dfn || {};
    Object.defineProperty(cls.prototype, key, {
      enumerable: true,

      get: dfn.get || function () {
        return instances[this.uuid].fields[key] || dfn.value;
      },

      set: function (n) {
        var inst = instances[this.uuid],
          oldValue = this[key],
          newValue;

        if (oldValue != n) {
          // check type
          if (dfn.type && typeof n != 'undefined') {
            (dfn.type == Number && typeof n == 'number') ||
            (dfn.type == Boolean && typeof n == 'boolean') ||
            (n instanceof dfn.type) ||
            (function () {
              throw new TypeError(
                "Can't set value of " + field +
                " to a " + Object.getPrototypeOf(n).constructor.name +
                ". It must be of the type " + dfn.type.name + "."
              );
            })();
          }

          // run vetter
          dfn.vet && dfn.vet(n);
          // run setter
          newValue = dfn.set ? dfn.set(n) : n;
          // actually set the value
          inst.fields[key] = newValue;

          // add/remove referrers
          if (oldValue instanceof Model) {
            delete instances[oldValue.uuid].referrers[this.uuid];
            oldValue.notifyObservers('disregard');
            if (Object.keys(instances[oldValue.uuid]).length == 0) {
              delete instances[oldValue.uuid];
              oldValue.notifyObservers('dispose');
            }
          }

          if (newValue instanceof Model) {
            instances[newValue.uuid].referrers[this.uuid] = this;
            newValue.notifyObservers('regard');
          }

          // publish change
          this.notifyObservers('change:' + key, {
            oldValue: oldValue,
            newValue: newValue
          });

          this.notifyObservers('change', {
            field: key,
            oldValue: oldValue,
            newValue: newValue
          });
        }
      }
    });
  };

  Model.defineFields = function (cls, fields) {
    for (var k in fields) {
      Model.defineField(cls, k, fields[k]);
    }
  };

  Rachis.Model = Model;

  /////////////////////////////////////////////////////////[ Collection ]////
  function Collection () {
    Model.call(this);
    this.models = {};
  }

  Collection.prototype = Object.create(Model.prototype, {
    constructor: {value: Collection},

    add: {value: function (models) {
      models = models instanceof Array ? models : [models];
      var added = [];

      models.forEach(function (model) {
        if (!this.models[model.uuid]) {
          added.push(model);
          model.addObserver('change', this.handleFieldChange, this);
          this.models[model.uuid] = model;
        }
      }, this);

      this.notifyObservers('add', added);
    }},

    remove: {value: function (models) {
      models = models instanceof Array ? models : [models];
      var removed = [];
      models.forEach(function (model) {
        var uuid = typeof model == 'string' ? model : model.uuid;
        if (this.models[uuid]) {
          this.models[uuid].removeObserver('change', this.handleFieldChange, this);
          removed.push(this.models[uuid]);
          delete this.models[uuid];
        }
      }, this);
      this.notifyObservers('remove', removed);
    }},

    handleFieldChange: {value: function (change) {
      this.notifyObservers('fieldChange:' + change.field, {
        oldValue: change.oldValue,
        newValue: change.newValue
      });
      this.notifyObservers('fieldChange', {
        field: change.field,
        oldValue: change.oldValue,
        newValue: change.newValue
      });
    }},

    find: {value: function (matcher) {
    }}
  });

  Rachis.Collection = Collection;

  //////////////////////////////////////////////////////////[ Selection ]////
  /*
  var sel = new Selection(collection, {
    orderBy: 'someField',
    where: {
      and: [
        { 'name': { 'is': 'Fred' },
        { 'date': { 'between': [start, end]} }
      ]
    },
    throttle: 250
  });
  */

  function Selection (collection, criteria) {
    Model.call(this);
  }

  Selection.prototype = Object.create(Model.prototype, {
    constructor: {value: Selection},
    
    handleCollectionAdd: {value: function (added) {
    }},

    handleCollectionRemove: {value: function (removed) {
    }}
  });

  ///////////////////////////////////////////[ Environment Integration ]////
  if (typeof define === 'function' && define.amd) {
    define(function () { return Rachis; });
  } else if (typeof module != 'undefined') {
    module.exports = Rachis;
  } else if (typeof window != 'undefined') {
    window.Rachis = Rachis;
  }
})();
