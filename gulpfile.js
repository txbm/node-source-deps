'use strict';

var gulp = require('gulp'),
    plugins = require('gulp-load-plugins')(),
    yargs = require('yargs'),
    pkg = require('./package.json');

gulp.task('test', ['jshint'], function (done) {
  gulp.src(['src/*', 'spec/*'])
  .pipe(plugins.istanbul())
  .on('finish', function () {
    gulp.src(['spec/*'])
    .pipe(plugins.mocha({reporter: 'nyan'}))
    .pipe(plugins.istanbul.writeReports())
    .on('finish', done);
  });
});

gulp.task('ci', ['build'], function (done) {
  gulp.src('coverage/lcov.info')
  .pipe(plugins.coveralls())
  .on('finish', done);
});

gulp.task('jshint', function (done) {
  gulp.src('src/*')
  .pipe(plugins.jshint())
  .pipe(plugins.jshint.reporter('default'))
  .on('finish', done);
});

gulp.task('size', ['build'], function (done) {
  gulp.src('dist/*.min.js')
  .pipe(plugins.size())
  .on('finish', done);
});

gulp.task('commit', function (done) {
  gulp.src('./')
  .pipe(plugins.git.add())
  .pipe(plugins.git.commit(yargs.argv.m || 'automatic commit by gulp task'))
  .on('finish', done);
});

gulp.task('build', ['test'], function (done) {
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
gulp.task('release', function (done) {
  var rtype = yargs.argv.b || 'patch';
  
  gulp.src('./package.json')
  .pipe(plugins.bump({type: rtype}))
  .pipe(gulp.dest('./'))
  .on('finish', function () {
    var semver = require('./package.json').version;
    gulp.src('./')
    .pipe(plugins.git.add())
    .pipe(plugins.git.commit(rtype + ' release: ' + semver))
    .on('finish', function () {
      plugins.git.tag(semver, 'release ' + semver, {}, function () {});
      plugins.git.push('origin', 'master')
      .on('end', function () {
        plugins.git.push('origin', 'master', {args: '--tags'})
        .on('end', done)
        .end();
      })
      .end();
    });
  });
});

gulp.task('push', ['commit'], function (done) {
  plugins.git.push('origin', 'master')
  .on('end', function () {
    plugins.git.push('origin', 'master', {args: '--tags'})
    .on('end', done);
  });
});

gulp.task('publish', function (done) {
  require('child_process').spawn('npm', ['publish'], {stdio: 'inherit'})
    .on('close', done);
});

gulp.task('ship', ['build', 'bump', 'commit', 'tag', 'push', 'publish']);
gulp.task('save', ['test', 'jshint', 'build', 'commit', 'push']);