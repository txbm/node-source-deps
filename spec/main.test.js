'use strict';

describe('srcdep plugin', function () {

  var srcDeps = require('../src/main.js'),
      gulp = require('gulp'),
      util = require('gulp-util'),
      should = require('should');

  it('should return a stream', function () {
    should(util.isStream(srcDeps({
      packagers: ['npm']
    }))).be.true;
  });

  it('should pull in npm packages', function (done) {
    var deps = [];

    srcDeps({
      packagers: ['npm']
    }).on('data', function (file) {
      deps.push(file);
    }).on('end', function () {
      should(deps.length).be.above(0);
      done();
    });
  });

  it('should pull in dev packages', function (done) {
    var deps = [];
    
    srcDeps({
      packagers: ['npm'],
      includeDevPackages: true
    }).on('data', function (file) {
      deps.push(file);
    }).on('end', function () {
      should(deps.length).be.above(0);
      done();
    });
  });

  it('should accept override values for main paths', function (done) {
    var deps = [];

    srcDeps({
      packagers: ['npm'],
      includeDevPackages: true,
      overrides: {
        gulp: './index.js'
      }
    }).on('data', function (file) {
      deps.push(file);
    }).on('end', function () {
      should(deps.length).be.above(0);
      done();
    });
  });

  it('should complain about invalid packagers', function () {
    var badCall = function () {
          return srcDeps({
            packagers: ['imaginarium']
          });
        };
    
    should(badCall).throw();
  });

  it('should complain about missing json files for a given packager', function () {
    var badCall = function () {
          return srcDeps({
            packagers: ['bower']
          });
        };

    should(badCall).throw();
  });
});