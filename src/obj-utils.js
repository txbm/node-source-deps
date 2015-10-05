(function () {
  'use strict';

  var ObjUtils;

  ObjUtils = function ObjUtils () {};

  ObjUtils.prototype.toType = function (value) {
    return ({}).toString.call(value).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
  };

  ObjUtils.prototype.clone = function (obj) {
    var copy;
    if (null === obj || "object" != typeof obj) return obj;
    if (obj instanceof Date) {
        copy = new Date();
        copy.setTime(obj.getTime());
        return copy;
    }
    if (obj instanceof Array) {
        copy = [];
        for (var i = 0, len = obj.length; i < len; i++) {
            copy[i] = this.clone(obj[i]);
        }
        return copy;
    }
    if (obj instanceof Object) {
        copy = {};
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr)) copy[attr] = this.clone(obj[attr]);
        }
        return copy;
    }
    throw new Error("Cannot copy supplied object.");
  };

  ObjUtils.prototype.merge = function () {
    var args = [].slice.apply(arguments),
        objects = args.reverse(),
        oLen = objects.length,
        o,
        t = {};

    while (oLen--) {
      o = objects[oLen];
      t = this._mergeObjs(t, o);
    }

    return t;
  };

  ObjUtils.prototype._mergeObjs = function (o1, o2) {
    var k2, v2, v1, newObj;

    newObj = this.clone(o1);

    for (k2 in o2) {
      v1 = o1[k2];
      v2 = o2[k2];

      if (this.isObject(v1) && this.isObject(v2)) {
        newObj[k2] = this._mergeObjs(v1, v2);
      } else {
        newObj[k2] = v2;
      }
    }

    return newObj;
  };

  ObjUtils.prototype.isObject = function (value) {
    return this.toType(value) === 'object';
  };

  module.exports = new ObjUtils();
}());