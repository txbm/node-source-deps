(function () {
  'use strict';

  var gulp = require('gulp'),
      util = require('gulp-util'),
      path = require('path'),
      fs = require('fs'),
      _log = function () {
        util.log.apply(this, arguments);
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

  function _error(message) {
    return new util.PluginError('gulp-srcdeps', message);
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

  function _resolveMains(pkgList, pkgDir, pkgrFileName, pkgrDefaultMain, overrides) {
    var pkgMains = {};

    pkgList.map(function (pkg) {
      var pkgFile = require(path.join(pkgDir, pkg, pkgrFileName));
      
      pkgMains[pkg] = overrides[pkg] || pkgFile.main || 'dist/' + pkg + '.min.js';
      pkgMains[pkg] = path.join(pkgDir, pkg, pkgMains[pkg]);

      if (!fs.existsSync(pkgMains[pkg])) {
        _log(util.colors.yellow('Package:'), util.colors.green(pkg), util.colors.yellow('has no valid main path. Recommend override.'));
      }

      if (pkgMains[pkg].indexOf('.min.js') == -1) {
        _log(util.colors.yellow('Package: '), util.colors.green(pkg), util.colors.yellow('is pulling in a non-minified dist file. Recommend checking to ensure correct file inclusion, may need override...'));
      }
    });

    return pkgMains;
  }

  function _scanPkgr(pkgr, opts) {
    var pkgrEntry = _packagers()[pkgr],
        pkgList = [],
        mains = {},
        jsonPath,
        pkgDirPath;
    
    if (!pkgrEntry) {
      throw _error('Packager "' + pkgr + '" not supported.');
    }

    jsonPath = path.join(process.cwd(), pkgrEntry.jsonFile);

    if (!fs.existsSync(jsonPath)) {
      throw _error('Packager "' + pkgr + '" missing JSON file "' + pkgrEntry.jsonFile + '". (' + jsonPath + ')');
    }

    pkgDirPath = path.join(process.cwd(), pkgrEntry.pkgDir);

    if (!fs.existsSync(pkgDirPath)) {
      throw _error('Packager "' + pkgr + '" missing package directory "' + pkgrEntry.pkgDir + '". (' + pkgDirPath + ')');
    }

    pkgList = _pullDependencies(require(jsonPath), opts.includeDevPackages);
    mains = _resolveMains(pkgList, pkgDirPath, pkgrEntry.jsonFile, pkgrEntry.defaultMain, opts.overrides);

    return mains;
  }

  module.exports = function (opts) {
    var settings = {
          packagers: ['npm', 'bower'],
          overrides: {},
          includeDevPackages: false,
          logOutput: false
        },
        allDeps = {},
        pathList = [],
        currentPkg,
        currentPath;

    opts = _mergeObjects(settings, opts);

    if (!opts.logOutput) {
      _log = function () {};
    }

    opts.packagers.map(function (pkgr) {
      allDeps = _mergeObjects(allDeps, _scanPkgr(pkgr, opts));
    });

    for (currentPkg in allDeps) {
      currentPath = allDeps[currentPkg];
      if (currentPath) {
        pathList.push(currentPath);  
      }
    }

    _log('srcdep pulling in ' + pathList.length + ' dependencies...');

    return gulp.src(pathList);
  };
})();