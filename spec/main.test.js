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

  it('should accept override data for packager definitions', function () {
    var files = srcDeps({
      packagers: ['bower'],
      rootDir: './fixture',
      packagerData: {bower: {pkgDir: 'bower_alternate'}}
    });

    should(files).length(1);
    should(files[0]).endWith('bootstrap.js');
  });

  it('should accept override values for main paths', function () {
    var files = srcDeps({
          packagers: ['npm'],
          rootDir: './fixture',
          overrides: {
            underscore: './underscore-min.js'
          }
        });

    should(files).length(3);
    should(files[2]).endWith('underscore-min.js');
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
            underscore: [
              'underscore.js',
              'underscore-min.js'
            ]
          }
        });

    should(files).length(4);
  });

  it('should allow the specification of a particular load order', function () {
    var files = srcDeps({
          packagers: ['npm'],
          rootDir: './fixture',
          order: [
            'underscore',
            'angular',
            'angular-mocks'
          ]
        });

    should(files[2]).endWith('angular-mocks.js');
  });

  it('should exclude packages that you want to exclude', function () {
    var files = srcDeps({
          packagers: ['npm'],
          rootDir: './fixture',
          exclude: [
            'underscore'
          ]
        });

    should(files).length(2);
  });

  it('should order packages with multiple files', function () {
    var files = srcDeps({
          packagers: ['npm'],
          rootDir: './fixture',
          overrides: {
            underscore: [
              'underscore.js',
              'underscore-min.js'
            ]
          },
          order: [
            'underscore'
          ]
        }),
        files2 = srcDeps({
          packagers: ['npm'],
          rootDir: './fixture',
          overrides: {
            underscore: [
              'underscore-min.js',
              'underscore.js'
            ]
          },
          order: [
            'angular',
            'underscore'
          ]
        });

    should(files[0]).endWith('underscore.js');
    should(files[1]).endWith('underscore-min.js');

    should(files2[1]).endWith('underscore-min.js');
    should(files2[2]).endWith('underscore.js');
  });

  it('should pull in child dependencies recursively if asked', function () {
    var files = srcDeps({
          packagers: ['bower'],
          rootDir: './fixture',
          recursive: true,
          include: [
            'fake-package'
          ]
        });

    should(files).length(5);
    should(files[0]).endWith('jquery.js');
    should(files[1]).endWith('bootstrap.js');
    should(files[2]).endWith('fake-child-child-package.min.js');
    should(files[3]).endWith('fake-child-package.min.js');
    should(files[4]).endWith('fake-package.min.js');
  });

  it('should detect alternate manifest file patterns', function () {
    var files = srcDeps({
          packagers: ['bower'],
          rootDir: './fixture',
          recursive: true,
          exclude: [
            'bootstrap'
          ],
          include: [
            'fake-package'
          ]
        });

    should(files).length(4);
    should(files[0]).endWith('fake-child-child-package.min.js');
    should(files[1]).endWith('jquery.js');
    should(files[2]).endWith('fake-child-package.min.js');
    should(files[3]).endWith('fake-package.min.js');
  });

  it('should pull in secondary dependencies and order them', function () {
    var files = srcDeps({
          packagers: ['bower'],
          rootDir: './fixture',
          recursive: true,
          order: [
            'bootstrap',
            'jquery'
          ]
        });

    should(files).length(2);
    should(files[0]).endWith('bootstrap.js');
    should(files[1]).endWith('jquery.js');
  });

  it('should pull in secondary dependencies and exclude them', function () {
    var files = srcDeps({
          packagers: ['bower'],
          rootDir: './fixture',
          recursive: true,
          exclude: [
            'jquery'
          ]
        });

    should(files).length(1);
    should(files[0]).endWith('bootstrap.js');
  });

  it('should include packages specified manually even if they are not in the main deps file', function () {
    var files = srcDeps({
          packagers: ['bower'],
          rootDir: './fixture',
          include: ['fake-package']
        });

    should(files).length(2);
    should(files[0]).endWith('bootstrap.js');
    should(files[1]).endWith('fake-package.min.js');
  });

  it('should exclude multiple occurences of the same dependant package', function () {
    var files = srcDeps({
          packagers: ['bower'],
          rootDir: './fixture',
          recursive: true,
          include: ['fake-package']
        });

    should(files).length(5);
    should(files[0]).endWith('jquery.js');
    should(files[1]).endWith('bootstrap.js');
    should(files[2]).endWith('fake-child-child-package.min.js');
    should(files[3]).endWith('fake-child-package.min.js');
    should(files[4]).endWith('fake-package.min.js');
  });


  it('should only include packages specified in "only"', function () {
    var files = srcDeps({
      packagers: ['npm', 'bower'],
      rootDir: './fixture',
      recursive: true,
      only: ['bootstrap']
    });

    should(files).length(2);
    should(files[1]).endWith('bootstrap.js');
  });

});