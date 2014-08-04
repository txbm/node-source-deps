'use strict';

describe('gulp-srcdeps', function () {

  var srcDeps = require('../index.js'),
      should = require('should');

  it('should return a file list', function () {
    var files = srcDeps({
      packagers: ['npm'],
      rootDir: './fixture'
    });

    should(Object.prototype.toString.call(files)).equal('[object Array]');
    should(files).length(3);
  });

  it('should pull in npm packages', function () {
    var files = srcDeps({
      packagers: ['npm'],
      rootDir: './fixture'
    });

    should(files).length(3);
  });

  it('should pull in dev packages', function () {
    var files = srcDeps({
      packagers: ['npm'],
      rootDir: './fixture',
      includeDevPackages: true
    });

    should(files).length(4);
  });

  it('should accept override values for main paths', function () {
    var files = srcDeps({
      packagers: ['npm'],
      rootDir: './fixture',
      overrides: {
        underscore: './underscore.js'
      }
    });

    should(files).length(4);
  });


  it('should complain about invalid packagers', function () {
    var badCall = function () {
          srcDeps({
            packagers: ['imaginarium'],
            rootDir: './fixture'
          });
        };
    
    should(badCall).throw();
  });

  it('should complain about missing json files for a given packager', function () {
    var badCall = function () {
          srcDeps({
            packagers: ['bower']
          });
        };

    should(badCall).throw();
  });
  
  it('should deal with multiple dist files per package', function () {
    var files = srcDeps({
      packagers: ['npm'],
      rootDir: './fixture',
      overrides: {
        underscore: ['./some-random.js', './underscore-min.js']
      }
    });

    should(files).length(5);
  });

  it('should allow the specification of a particular load order', function () {
    var files = srcDeps({
      packagers: ['npm'],
      rootDir: './fixture',
      order: [
        'underscore',
        'moment',
        'angular-mocks',
        'angular'
      ]
    });

    should(files[3]).endWith('angular.min.js');
  });

  it('should ignore packages that you want to ignore', function () {
    var files = srcDeps({
          packagers: ['npm'],
          rootDir: './fixture',
          ignore: [
            'underscore'
          ]
        });

    should(files).length(3);
  });
});