'use strict';

var p = require('path'),
    cwd = process.cwd(),
    gulp = require('gulp');

var PKGRS = {
      bower: {
        depFile: 'bower.json',
        srcPath: 'bower_componenets'
      },
      npm: {
        depFile: 'package.json',
        srcPath: 'node_modules'
      }
    };

function parseDepFile(path, testDeps) {
  var depFile = require(path),
      deps = depFile.dependencies,
      pkgs = [],
      depName;

  for (depName in deps) {
    pkgs.push(depName);
  }
  return pkgs;
};

function loadDeps(pkgr, pkgs) {
  var srcPath = p.join(cwd, PKGRS[pkgr].srcPath), 
      depDepFile,
      mainPath,
      files = [];

  pkgs.map(function (pkg) {
    depDepFile = require(p.join(srcPath, pkg, PKGRS[pkgr].depFile)),
    mainPath = depDepFile.main || '';
    if (mainPath) {
      files.push(p.join(srcPath, mainPath));
    } else {
      console.warn('Package ' + pkg + ' does not contain a main path!');
    }
  });

  return files;
};

function srcDeps(pkgrs, testDeps) {
  var testDeps = testDeps || false,
      pkgrs = pkgrs || ['bower', 'npm'],
      files = loadDeps('npm', parseDepFile('./' + PKGRS['npm'].depFile));
  return gulp.src(files);
};

module.exports = srcDeps;