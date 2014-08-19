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
        manifests: ['bower.json', '.bower.json'],
        pkgDir: 'bower_components'
      },
      npm: {
        manifests: ['package.json'],
        pkgDir: 'node_modules'
      }
    };
  }

  function _isArray (obj) {
    return Object.prototype.toString.call(obj) === '[object Array]';
  }

  function _pullDependencies (manifest, opts) {
    var deps = manifest.dependencies || {},
        pkgList = [],
        current;

    if (opts.includeDevPackages) {
      deps = _mergeObjects(deps, manifest.devDependencies || {});
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

  function _resolveMains (pkgList, pkgDir, overrides, done) {
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
    var pkgrEntry = _packagers()[pkgr],
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

    if (opts.include) {
      pkgList = pkgList.concat(opts.include);
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
              _log('Child Package'.warn + ' does not contain a valid manifest. Continuing...');
              return;
            }

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
          overrides: {},
          includeDevPackages: false,
          recursive: false,
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