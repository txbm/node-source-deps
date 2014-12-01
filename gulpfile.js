'use strict';

var gulp = require('gulp'),
    plugins = require('gulp-load-plugins')(),
    yargs = require('yargs'),
    pkg = require('./package.json');


require('gulp-help')(gulp);

function _reloadPkgFile() {
  delete require.cache[require.resolve('./package.json')];
  pkg = require('./package.json');
}

gulp.task('test', 'Runs all test', ['jshint'], function (done) {
  gulp.src(['src/*.js', 'spec/*'])
  .pipe(plugins.istanbul())
  .on('finish', function () {
    gulp.src(['spec/*'])
    .pipe(plugins.mocha({reporter: 'nyan'}))
    .pipe(plugins.istanbul.writeReports())
    .on('finish', done);
  })
  .on('error', function (error) {
    console.log(error);
  });
});

gulp.task('ci', 'Submits coverage info to Coveralls', ['build'], function (done) {
  gulp.src('coverage/lcov.info')
  .pipe(plugins.coveralls())
  .on('finish', done);
});

gulp.task('jshint', 'JSHints the source', function (done) {
  gulp.src('src/*.js')
  .pipe(plugins.jshint())
  .pipe(plugins.jshint.reporter('default'))
  .on('finish', done);
});

gulp.task('size', 'Calculates the built and minified size of the src', ['build'], function (done) {
  gulp.src('dist/*.min.js')
  .pipe(plugins.size())
  .on('finish', done);
});

gulp.task('commit', 'Builds and commits the repo', ['build'], function (done) {
  gulp.src('./')
  .pipe(plugins.git.add())
  .pipe(plugins.git.commit(yargs.argv.m || 'automatic commit by gulp task'))
  .on('finish', done);
});

gulp.task('build', 'Tests and builds the repo', ['test'], function (done) {
  gulp.src('src/*.js')
  .pipe(plugins.sourcemaps.init())
  .pipe(plugins.concat(pkg.name + '.js'))
  .pipe(plugins.sourcemaps.write('./', {addComment: false}))
  .pipe(gulp.dest('dist'))
  .on('finish', function () {
    gulp.src('src/*.js')
    .pipe(plugins.sourcemaps.init())
    .pipe(plugins.concat(pkg.name + '.min.js'))
    .pipe(plugins.uglify())
    .pipe(plugins.sourcemaps.write('./', {addComment: false}))
    .pipe(gulp.dest('dist'))
    .on('finish', done);
  });
});

// MAJOR, MINOR, PATCH, PRERELEASE
gulp.task('bump', 'Builds and bumps the version according to the -b switch [MAJOR, MINOR, PATCH, PRERELEASE]', ['build'], function (done) {
  var rtype = yargs.argv.b || 'patch';

  gulp.src('./package.json')
  .pipe(plugins.bump({type: rtype}))
  .pipe(gulp.dest('./'))
  .on('finish', done);
});

gulp.task('release', 'Releases according to -b switch', ['bump'], function (done) {
  var rtype = yargs.argv.b || 'patch';

  _reloadPkgFile();

  gulp.src('./')
  .pipe(plugins.git.add())
  .pipe(plugins.git.commit(rtype + ' release: ' + pkg.version))
  .on('finish', function () {
    plugins.git.tag(pkg.version, rtype + ' release ' + pkg.version, {}, function () {
      done();
    });
  });
});

gulp.task('push', 'Commits and pushes the repo', ['commit'], function (done) {
  plugins.git.push('origin', 'master')
  .on('finish', done)
  .end();
});

gulp.task('push-release', 'Releases and pushes', ['release'], function (done) {
  plugins.git.push('origin', 'master', {args: '--tags'})
  .on('finish', done)
  .end();
});

gulp.task('publish', 'Releases, pushes and publishes to NPM', ['push-release'], function (done) {
  require('child_process').spawn('npm', ['publish'], {stdio: 'inherit'})
  .on('close', done);
});