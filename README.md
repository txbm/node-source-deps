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
      angular: 'lib/angular.min.js'
    }
  })
  .pipe(concat(['src/**/*.js']))
  .pipe(gulp.dest('all.js'));
});
```

This example pulls in all production dependencies from ```package.json``` and ```bower.json```.

#### Overrides

Overrides tell ```srcdeps``` where to find the main dist file for a library where the ```"main"``` entry in the package file (.json) is not pointed at a compiled dist file (or there is no ```main``` at all).

It is very important that you make sure each dependency package has a valid path to the dist files or else it will not get pulled in.

```srcdeps``` will throw an error if no main file is not found at all, but it cannot tell you if the wrong file gets pulled in. Often node packages point to ```index.js``` as their main file (for use with ```require```) but for many non-frontend-only Node packages, that means this is very often not the minified dist file (which usually resides in ```[dist | lib]/*.min.js)``` which is what ```srcdep``` will try to guess if there is no main and no override. 

In near future ```srcdeps``` will get a better guessing system for installed packages, but currently the best it is going to do is warn you when a package is pulling in a a non-minified file, since that's usually a dead giveaway. Just turn on logging to see which packages probably need overrides.

#### Turning on logging
```javascript
deps({
  packagers: ['bower', 'npm'],
  logOutput: true
})
```
