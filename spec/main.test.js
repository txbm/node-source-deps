'use strict';

describe('srcdep plugin', function () {

  var srcDeps = require('../src/main.js'),
      gulp = require('gulp'),
      util = require('gulp-util');

  it('should return a stream', function () {
    expect(util.isStream(srcDeps({
      packagers: ['npm']
    }))).toBe(true);
  });

  it('should pull in npm packages', function (done) {
    var deps = [];

    srcDeps({
      packagers: ['npm']
    }).on('data', function (file) {
      deps.push(file);
    }).on('end', function () {
      expect(deps.length).toBe(1);
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
      expect(deps.length).toBe(5);
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
      expect(deps.length).toBe(5);
      done();
    });
  });

  it('should complain about invalid packagers', function () {
    var badCall = function () {
          return srcDeps({
            packagers: ['imaginarium']
          });
        };
    
    expect(badCall).toThrow();
  });

  it('should complain about missing json files for a given packager', function () {
    var badCall = function () {
          return srcDeps({
            packagers: ['bower']
          });
        };

    expect(badCall).toThrow();
  });
});