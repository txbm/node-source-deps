(function () {
  'use strict';

  var wrench = require('wrench'),
      path = require('path'),
      fs = require('fs'),
      colors = require('colors'),
      u = require('./utils.js'),
      data = require('./data.json'),
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
      deps = u.mergeObjects(deps, manifest.devDependencies || {});
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
    var pkgrEntry = data.packagers[pkgr],
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
        currentPkg;

    opts = u.mergeObjects(settings, opts);
    opts.rootDir = path.resolve(opts.rootDir);

    if (!opts.logOutput) {
      log = function () {};
    } else {
      log = u.log;
    }

    opts.packagers.forEach(function (element, idx, array) {
      mains = u.mergeObjects(mains, _scanPkgr(element, opts));
    });

    opts.order.forEach(function (pkg, idx, array) {
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