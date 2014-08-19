Source Dependencies
============
[![Build Status](http://img.shields.io/travis/petermelias/node-source-deps.svg)](https://travis-ci.org/petermelias/node-source-deps)
[![Coverage](http://img.shields.io/coveralls/petermelias/node-source-deps.svg)](https://coveralls.io/r/petermelias/node-source-deps)
[![NPM Downloads](http://img.shields.io/npm/dm/source-deps.svg)](https://www.npmjs.org/package/source-deps)
[![NPM Version](http://img.shields.io/npm/v/source-deps.svg)](https://www.npmjs.org/package/source-deps)
[![Github Issues](http://img.shields.io/github/issues/petermelias/node-source-deps.svg)](https://github.com/petermelias/node-source-deps/issues)

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
    },
    ignore: ['normalize.css'],
    order: [
      'angular',
      'angular-mocks'
    ],
    include: [
      'some-package-apparently-not-listed-as-dependency'
    ],
    recursive: true // Pull in dependencies of dependencies (in proper order too :)
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

#### Order

As of `0.2.5` you can control the ordering of your dependant files now! Very helpful, like so.

```javascript
var deps = require('source-deps'),
    depFiles = deps({
      packagers: ['bower'],
      order: [
        'angular',
        'angular-mocks',
        'angular-animate'
      ]
    });
```

This will happily prevent your dependencies from being loaded out of proper resolution order :)

#### Ignore

And now you can ignore certain packages by just adding them to the `ignore` option like so:

```javascript

var deps = require('source-deps'),
    depFiles = deps({
      packagers: ['bower'],
      order: [
        'angular',
        'angular-mocks'
      ],
      ignore: [
        'angular-animate'
      ]
    });
```

#### Include

This is for a number of odd situations where there is a package present that is either:

A) Not listed as a dependency

B) Ignored already

C) Ignored by a future feature that allows for exclusion patterns

... and needs to be included anyway. In other words it overrides any exclusions.

```javascript

depFiles = deps({
  packagers: ['bower'],
  ignore: ['said-package'],
  include: ['said-package'] // Takes priority
});

```

#### Recursive

Oh yeah... this does exactly what you think it does. Bye, bye RequireJS shims on the frontend.

```javascript

depFiles = deps({
  packagers: ['bower'],
  recursive: true
});
```

- Pulls in all dependencies-of-dependencies
- Ignores duplicate occurences of dependencies (i.e. won't pull in JQuery 900 times ;)
- Respects `order`, `ignore`, and `include`.
- By default will load dependencies BEFORE the package that pulled them in, usually resulting in resolution order being met correctly.
- Use `order` to resolve anything that pulls in too early / too late as a result of overlapping secondaries amongst packages.