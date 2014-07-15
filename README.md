gulp-srcdeps
============
[![Build Status](http://img.shields.io/travis/petermelias/gulp-srcdeps.svg)](https://coveralls.io/r/petermelias/gulp-srcdeps)
[![Coverage](http://img.shields.io/coveralls/petermelias/gulp-srcdeps.svg)](https://travis-ci.org/petermelias/gulp-srcdeps)
[![NPM Downloads](http://img.shields.io/npm/dm/gulp-srcdeps.svg)]()
[![NPM Version](http://img.shields.io/npm/v/gulp-srcdeps.svg)]()
[![Github Issues](http://img.shields.io/github/issues/petermelias/gulp-srcdeps.svg)]()


A Gulp plugin for automatically discovering and "srcing" your dependency packages from Bower and NPM and any future packagers.


### Install

```bash
npm install --save-dev gulp-srcdeps
```


### Example Usage

```javascript
var deps = require('gulp-srcdeps'),
    concat = require('gulp-concat');

gulp.task('bundle', function () {
  return deps({
    packagers: ['bower', 'npm'],
    includeDevPackages: false,
    logOutput: false,
    overrides: {
      gulp: './index.js'
    }
  })
  .pipe(concat(['src/**/*.js']))
  .pipe(gulp.dest('all.js'));
});
```

This example pulls in all production dependencies from ```package.json``` and ```bower.json```.

Overrides tell ```srcdeps``` where to find the main file for a library that is missing a "main" entry in its package definition file.
