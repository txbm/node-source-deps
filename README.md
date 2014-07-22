Source Dependencies
============
[![Build Status](http://img.shields.io/travis/petermelias/node-source-deps.svg)](https://coveralls.io/r/petermelias/node-source-deps)
[![Coverage](http://img.shields.io/coveralls/petermelias/node-source-deps.svg)](https://travis-ci.org/petermelias/node-source-deps)
[![NPM Downloads](http://img.shields.io/npm/dm/node-source-deps.svg)]()
[![NPM Version](http://img.shields.io/npm/v/node-source-deps.svg)]()
[![Github Issues](http://img.shields.io/github/issues/petermelias/node-source-deps.svg)]()

A tool for automatically discovering and "sourcing" your dependency packages from Bower and NPM and any other packagers.


### Install

```bash
npm install --save-dev source-deps
```


### Example Usage with Gulp

```javascript
var deps = require('source-deps'),
    concat = require('gulp-concat');

gulp.task('bundle', function () {
  var depFiles = deps({
    packagers: ['bower', 'npm'],
    includeDevPackages: false,
    logOutput: false,
    overrides: {
      angular: 'lib/angular.min.js'
    }
  });
  gulp.src(depFiles)
  .pipe(concat(['src/**/*.js']))
  .pipe(gulp.dest('all.js'));
});
```

This example pulls in all production dependencies from ```package.json``` and ```bower.json```.

#### Overrides

Overrides tells it where to find dist files for a library where the automatic guessing is not working.

It is very important that you make sure each dependency package has correct paths to the dist files.

#### Turning on logging
```javascript
deps({
  packagers: ['bower', 'npm'],
  logOutput: true
})
```

This will show you how many files get pulled in as well as which packages are likely not being pulled properly.