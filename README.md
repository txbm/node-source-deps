gulp-srcdeps
============

A Gulp plugin for automatically discovering and "srcing" your dependency packages from Bower and NPM.


### Install

```bash
npm install gulp-srcdeps
```


### Example Usage

```javascript
var srcDeps = require('gulp-srcdeps'),
    concat = require('gulp-concat');

gulp.task('bundle', function () {
  return srcDeps(['bower', 'npm'])
    .pipe(concat(['src/**/*.js']))
    .pipe(gulp.dest('all.js'));
});
```

Pulls in dependencies from ```package.json``` and ```bower.json```
