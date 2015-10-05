(function () {
  'use strict';

  var wrench = require('wrench'),
      path = require('path'),
      fs = require('fs'),
      colors = require('colors'),
      u = require('./utils.js'),
      obj = require('./obj-utils.js'),
      defaultPackagerData = require('./packager-data.json'),
      log;

  colors.setTheme({
    info: 'cyan',
    warn: 'yellow',
    error: 'red',
    success: 'green'
  });

  function _pullDependencies (manifest, opts) {
    var deps = manifest.dependencies || {},
        pkgList = [],
        current;

    if (opts.includeDevPackages) {
      deps = obj.merge(deps, manifest.devDependencies || {});
    }

    for (current in deps) {
      if (opts.exclude.indexOf(current) == -1) {
        pkgList.push(current);
      } else {
        log('Excluding '.success + colors.info(current));
      }
    }

    return pkgList;
  }

  function _guessDistFiles (pkgDir, pkg) {
    var testPatterns = [
          new RegExp(pkg + '.js$'),
          new RegExp(pkg + '.min.js$')
        ],
        matches = [],
        files = wrench.readdirSyncRecursive(path.join(pkgDir, pkg));

    files.forEach(function (filename, idx1, arr1) {
      testPatterns.forEach(function (pattern, idx2, arr2) {
        if (filename.match(pattern)) {
          matches[idx2] = filename;
        }
      });
    });

    return matches.filter(function (m) { return typeof(m) !== 'undefined'; }).shift();
  }

  function _resolveMains (pkgList, pkgDir, overrides, done) {
    var _check = function (p, pkg) {
          if (!fs.existsSync(p)) {
            log('Package '.warn + colors.info(pkg) + ' file at '.warn + colors.info(p) + ' does not exist.'.warn);
            return false;
          }
          return true;
        },
        _expand = function (p, pkg) {
          p = path.resolve(pkgDir, pkg, p);
          return p;
        },
        _process = function (pkg) {
          var filepaths = overrides[pkg] || _guessDistFiles(pkgDir, pkg),
              _processPath = function (path) {
                path = _expand(path, pkg);
                if (_check(path, pkg)) {
                  return path;
                }
                return false;
              };

          if (u.isArray(filepaths)) {
            filepaths = filepaths.map(_processPath).filter(function (path) { return !!path; });
          } else if (filepaths) {
            filepaths = _processPath(filepaths);
          }

          if (!filepaths || (u.isArray(filepaths) && filepaths.length === 0)) {
            log('Package '.warn + colors.info(pkg) + ' has no valid paths. Recommend override.'.warn);
            filepaths = undefined;
          }

          return filepaths;
        },
        paths = {};

    pkgList.forEach(function (element, idx, arr) {
      if (paths.hasOwnProperty(element)) {
        return;
      }
      paths[element] = _process(element);
    });

    return paths;
  }

  function _findManifest (prefix, manifests) {
    var selected, p;
    manifests.forEach(function (manifest, idx, arr) {
      p = path.join(prefix, manifest);
      if (!selected && fs.existsSync(p)) {
        selected = p;
      }
    });
    return selected;
  }

  function _scanPkgr (pkgr, opts) {
    var pkgrEntry = opts.packagerData[pkgr],
        pkgList = [],
        resolved = {},
        manifestPath,
        pkgDirPath;

    if (!pkgrEntry) {
      throw new Error('Packager '.error + colors.info(pkgr) + ' not supported.'.error);
    }

    manifestPath = _findManifest(opts.rootDir, pkgrEntry.manifests);

    if (!manifestPath) {
      throw new Error('Packager '.error + colors.info(pkgr) + ' has no valid manifest files '.error + colors.info(pkgrEntry.manifests) + ' @ '.error);
    }

    pkgDirPath = path.join(opts.rootDir, pkgrEntry.pkgDir);

    if (!fs.existsSync(pkgDirPath)) {
      throw new Error('Packager '.error + colors.info(pkgr) + ' missing package directory '.error + colors.info(pkgrEntry.pkgDir) + ' @ '.error + colors.info(pkgDirPath));
    }

    pkgList = _pullDependencies(require(manifestPath), opts);

    if (opts.only.length > 0) {
      log('Limiting to: '.success + colors.info(opts.only));
      pkgList = u.arrayIntersect(pkgList, opts.only);
    } else {
      if (opts.include) {
        pkgList = pkgList.concat(opts.include);
      }
    }

    if (opts.recursive) {
      pkgList = (function (pkgList, entry, opts) {

        var newList = [];

        function recursePkg (startPkg) {

          var tree = [];

          function walk (pkg) {
            var jPath = _findManifest(path.join(opts.rootDir, entry.pkgDir, pkg), entry.manifests),
                found;

            if (!jPath) {
              log('Child Package'.warn + ' of ' + colors.info(pkg) + ' does not contain a valid manifest. Continuing...');
              return;
            }

            opts.includeDevPackages = false;
            found = _pullDependencies(require(jPath), opts);

            if (found) {
              Array.prototype.splice.apply(tree, [0, 0].concat(found));
              found.forEach(function (pkg, idx, arr) {
                return walk(pkg);
              });
            }
          }

          walk(startPkg);
          return tree;
        }

        newList = pkgList.slice();

        pkgList.forEach(function (pkg, idx, arr) {
          Array.prototype.splice.apply(newList, [newList.indexOf(pkg), 0].concat(recursePkg(pkg)));
        });

        return newList;

      })(pkgList, pkgrEntry, opts);
    }

    resolved = _resolveMains(
      pkgList,
      pkgDirPath,
      opts.overrides
    );

    return resolved;
  }

  module.exports = function (opts) {
    var settings = {
          packagers: ['npm', 'bower'],
          packagerData: {},
          overrides: {},
          includeDevPackages: false,
          recursive: false,
          logOutput: false,
          rootDir: process.cwd(),
          order: [],
          exclude: [],
          include: [],
          only: []
        },
        pathList = [],
        mains = {},
        addPkg = function (pkg, idx) {
          var path;

          path = mains[pkg];
          if (!path) {
            return;
          }

          if (idx) {
            Array.prototype.splice.apply(pathList, [idx, 0].concat(path));
            return;
          }

          if (u.isArray(path)) {
            pathList = pathList.concat(path);
            return;
          }
          pathList.push(path);
        },
        currentPkg,
        pData;

    settings = obj.merge(settings, opts);
    settings.rootDir = path.resolve(settings.rootDir);
    settings.packagerData = obj.merge(defaultPackagerData, settings.packagerData);

    if (!settings.logOutput) {
      log = function () {};
    } else {
      log = u.log;
    }

    settings.packagers.forEach(function (packager, idx, array) {
      mains = obj.merge(mains, _scanPkgr(packager, settings));
    });

    settings.order.forEach(function (pkg, idx, array) {
      addPkg(pkg, idx);
      delete mains[pkg];
    });

    for (currentPkg in mains) {
      addPkg(currentPkg);
    }

    log('Loaded '.success + colors.info(pathList.length) + ' dependent files.'.success);

    return pathList;
  };
})();
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
(function () {
  'use strict';

  var colors = require('colors');

  module.exports = {
    log: function () {
      arguments[0] = '[' + colors.grey('SOURCE DEPS') + '] ' + arguments[0];
      console.log.apply(this, arguments);
    },
    isArray: function (obj) {
      return Object.prototype.toString.call(obj) === '[object Array]';
    },
    arrayIntersect: function (a1, a2) {
      var result;

      result = a1.filter(function (element) {
        return a2.indexOf(element) != -1;
      });

      return result;
    }
  };

}());