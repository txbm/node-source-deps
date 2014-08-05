(function () {
  'use strict';

  var wrench = require('wrench'),
      path = require('path'),
      fs = require('fs'),
      _log = function () {
        console.log.apply(this, arguments);
      };

  function _mergeObjects(o1, o2) {
    var k, v;
    for (k in o2) {
      v = o2[k];
      o1[k] = v;
    }
    return o1;
  }

  function _packagers() {
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

  function _isArray(obj) {
    return Object.prototype.toString.call(obj) === '[object Array]';
  }

  function _pullDependencies(jsonFile, includeDev) {
    var deps = jsonFile.dependencies || {},
        pkgList = [],
        current;

    if (includeDev) {
      deps = _mergeObjects(deps, jsonFile.devDependencies || {});
    }
    
    for (current in deps) {
      pkgList.push(current);
    }
    
    return pkgList;
  }

  function _guessDistFiles(pkgDir, pkg) {
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

  function _resolveMains(pkgList, pkgDir, pkgrFileName, pkgrDefaultMain, overrides, done) {
    var _check = function (p, pkg) {
          if (!fs.existsSync(p)) {
            _log('Package ( ' + pkg + ' ) file at ' + p + ' does not exist.');
            return false;
          }
          return true;
        },
        _expand = function (p, pkg) {
          p = path.resolve(pkgDir, pkg, p);
          _check(p, pkg);
          return p;
        },
        _process = function (pkg) {
          var filepaths = overrides[pkg] || _guessDistFiles(pkgDir, pkg),
              _temp = [];

          if (!filepaths) {
            _log('Package "' + pkg + '" has no valid paths. Recommend override.');
          } else if (_isArray(filepaths)) {
            filepaths.forEach(function (element, idx, arr) {
              arr[idx] = _expand(element, pkg);
            });
          } else {
            filepaths = _expand(filepaths, pkg);
          }

          return filepaths;
        },
        paths = {};

    pkgList.forEach(function (element, idx, arr) {
      paths[element] = _process(element);
    });

    return paths;
  }

  function _scanPkgr(pkgr, opts) {
    var pkgrEntry = _packagers()[pkgr],
        pkgList = [],
        jsonPath,
        pkgDirPath;
    
    if (!pkgrEntry) {
      throw new Error('Packager "' + pkgr + '" not supported.');
    }

    jsonPath = path.join(opts.rootDir, pkgrEntry.jsonFile);

    if (!fs.existsSync(jsonPath)) {
      throw new Error('Packager "' + pkgr + '" missing JSON file "' + pkgrEntry.jsonFile + '". (' + jsonPath + ')');
    }

    pkgDirPath = path.join(opts.rootDir, pkgrEntry.pkgDir);

    if (!fs.existsSync(pkgDirPath)) {
      throw new Error('Packager "' + pkgr + '" missing package directory "' + pkgrEntry.pkgDir + '". (' + pkgDirPath + ')');
    }

    pkgList = _pullDependencies(require(jsonPath), opts.includeDevPackages);
    
    return _resolveMains(
      pkgList,
      pkgDirPath,
      pkgrEntry.jsonFile,
      pkgrEntry.defaultMain,
      opts.overrides
    );
  }

  module.exports = function (opts) {
    var settings = {
          packagers: ['npm', 'bower'],
          overrides: {},
          includeDevPackages: false,
          logOutput: false,
          rootDir: process.cwd(),
          order: [],
          ignore: []
        },
        pathList = [],
        mains = {},
        currentPkg,
        currentPath,
        currentIdx;

    opts = _mergeObjects(settings, opts);
    opts.rootDir = path.resolve(opts.rootDir);

    if (!opts.logOutput) {
      _log = function () {};
    }

    opts.packagers.forEach(function (element, idx, array) {
      mains = _mergeObjects(mains, _scanPkgr(element, opts));
    });
    
    for (currentPkg in mains) {
      if (opts.ignore.indexOf(currentPkg) > -1) {
        _log('Ignoring: ' + currentPkg);
        continue;
      }

      currentPath = mains[currentPkg];
      
      if (!currentPath) {
        _log('Path for ' + currentPkg + ' is empty, skipping.');
        continue;
      }

      currentIdx = opts.order.indexOf(currentPkg);

      if (currentIdx > -1) {
        if (typeof(pathList[currentIdx]) == 'undefined') {
          pathList[currentIdx] = currentPath;
        } else {
          Array.prototype.splice.apply(pathList, [currentIdx, 0].concat(currentPath));  
        }
      } else {
        if (_isArray(currentPath)) {
          pathList = pathList.concat(currentPath);
        } else {
          pathList.push(currentPath);
        }
      }
    }
    
    _log('Found ' + pathList.length + ' dependent files.');

    return pathList;
  };
})();