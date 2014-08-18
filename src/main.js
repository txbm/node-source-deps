(function () {
  'use strict';

  var wrench = require('wrench'),
      path = require('path'),
      fs = require('fs'),
      colors = require('colors'),
      _log = function () {
        arguments[0] = '[' + colors.grey('SOURCE DEPS') + '] ' + arguments[0];
        console.log.apply(this, arguments);
      };

  colors.setTheme({
    info: 'cyan',
    warn: 'yellow',
    error: 'red',
    success: 'green'
  });

  function _mergeObjects (o1, o2) {
    var k, v;
    for (k in o2) {
      v = o2[k];
      o1[k] = v;
    }
    return o1;
  }

  function _packagers () {
    return {
      bower: {
        jsonFile: 'bower.json',
        pkgDir: 'bower_components'
      },
      npm: {
        jsonFile: 'package.json',
        pkgDir: 'node_modules'
      }
    };
  }

  function _isArray (obj) {
    return Object.prototype.toString.call(obj) === '[object Array]';
  }

  function _pullDependencies (jsonFile, opts) {
    var deps = jsonFile.dependencies || {},
        pkgList = [],
        current;

    if (opts.includeDevPackages) {
      deps = _mergeObjects(deps, jsonFile.devDependencies || {});
    }
    
    for (current in deps) {
      if (opts.ignore.indexOf(current) == -1) {
        pkgList.push(current);
      } else {
        _log('Ignoring '.success + colors.info(current));
      }
    }
    
    return pkgList;
  }

  function _guessDistFiles (pkgDir, pkg) {
    var testPatterns = [
          new RegExp(pkg + '.min.js$'),
          new RegExp(pkg + '.js$')
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

  function _resolveMains (pkgList, pkgDir, pkgrFileName, pkgrDefaultMain, overrides, done) {
    var _check = function (p, pkg) {
          if (!fs.existsSync(p)) {
            _log('Package '.warn + colors.info(pkg) + ' file at '.warn + colors.info(p) + ' does not exist.'.warn);
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

          if (_isArray(filepaths)) {
            filepaths = filepaths.map(_processPath).filter(function (path) { return !!path; });
          } else if (filepaths) {
            filepaths = _processPath(filepaths);
          }

          if (!filepaths || (_isArray(filepaths) && filepaths.length === 0)) {
            _log('Package '.warn + colors.info(pkg) + ' has no valid paths. Recommend override.'.warn);
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

  function _scanPkgr (pkgr, opts) {
    var pkgrEntry = _packagers()[pkgr],
        pkgList = [],
        resolved = {},
        jsonPath,
        pkgDirPath;
    
    if (!pkgrEntry) {
      throw new Error('Packager '.error + colors.info(pkgr) + ' not supported.'.error);
    }

    jsonPath = path.join(opts.rootDir, pkgrEntry.jsonFile);

    if (!fs.existsSync(jsonPath)) {
      throw new Error('Packager '.error + colors.info(pkgr) + ' missing JSON file '.error + colors.info(pkgrEntry.jsonFile) + ' @ '.error + colors.info(jsonPath));
    }

    pkgDirPath = path.join(opts.rootDir, pkgrEntry.pkgDir);

    if (!fs.existsSync(pkgDirPath)) {
      throw new Error('Packager '.error + colors.info(pkgr) + ' missing package directory '.error + colors.info(pkgrEntry.pkgDir) + ' @ '.error + colors.info(pkgDirPath));
    }

    pkgList = _pullDependencies(require(jsonPath), opts);

    if (opts.include) {
      pkgList = pkgList.concat(opts.include);
    }

    if (opts.secondaryDeps) {
      (function (pkgList, entry, opts) {
        var pLen = pkgList.length,
            pCur,
            jPath,
            secDeps;

        while (pLen--) {
          pCur = pkgList[pLen];
          jPath = path.join(opts.rootDir, entry.pkgDir, pCur, entry.jsonFile);
          secDeps = _pullDependencies(require(jPath), opts);
          Array.prototype.splice.apply(pkgList, [pLen, 0].concat(secDeps));
        }
      })(pkgList, pkgrEntry, opts);
    }

    resolved = _resolveMains(
      pkgList,
      pkgDirPath,
      pkgrEntry.jsonFile,
      pkgrEntry.defaultMain,
      opts.overrides
    );

    return resolved;
  }

  module.exports = function (opts) {
    var settings = {
          packagers: ['npm', 'bower'],
          overrides: {},
          includeDevPackages: false,
          secondaryDeps: false,
          logOutput: false,
          rootDir: process.cwd(),
          order: [],
          ignore: [],
          include: []
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

          if (_isArray(path)) {
            pathList = pathList.concat(path);
            return;
          }
          pathList.push(path);
        },
        currentPkg;

    opts = _mergeObjects(settings, opts);
    opts.rootDir = path.resolve(opts.rootDir);

    if (!opts.logOutput) {
      _log = function () {};
    }

    opts.packagers.forEach(function (element, idx, array) {
      mains = _mergeObjects(mains, _scanPkgr(element, opts));
    });
    
    opts.order.forEach(function (pkg, idx, array) {
      addPkg(pkg, idx);
      delete mains[pkg];
    });

    for (currentPkg in mains) {
      addPkg(currentPkg);
    }
    
    _log('Loaded '.success + colors.info(pathList.length) + ' dependent files.'.success);

    return pathList;
  };
})();