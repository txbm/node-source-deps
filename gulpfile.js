'use strict';

var gulp = require('gulp'),
    plugins = require('gulp-load-plugins')(),
    yargs = require('yargs');

gulp.task('test', function (done) {
  gulp.src(['src/*', 'spec/*'])
  .pipe(plugins.istanbul())
  .on('finish', function () {
    gulp.src(['spec/*'])
    .pipe(plugins.mocha({reporter: 'nyan'}))
    .pipe(plugins.istanbul.writeReports())
    .on('end', done);
  });
});

gulp.task('ci', ['build', 'test'], function () {
  return gulp.src('coverage/lcov.info')
  .pipe(plugins.coveralls());
});

gulp.task('jshint', function () {
  return gulp.src('src/*')
    .pipe(plugins.jshint())
    .pipe(plugins.jshint.reporter('default'));
});

gulp.task('size', ['build'], function () {
  return gulp.src('dist/gulp-srcdeps.min.js')
    .pipe(plugins.size());
});

gulp.task('commit', ['ci'], function () {
  return gulp.src('./')
    .pipe(plugins.git.add())
    .pipe(plugins.git.commit(yargs.argv.m));
});

gulp.task('build', function () {
  return gulp.src('src/*.js')
    .pipe(plugins.concat('gulp-srcdeps.js'))
    .pipe(gulp.dest('dist'))
    .pipe(plugins.uglify())
    .pipe(plugins.rename('gulp-srcdeps.min.js'))
    .pipe(gulp.dest('dist'));
});

gulp.task('bump', function () {
  return gulp.src('./package.json')
    .pipe(plugins.bump({type: yargs.argv.b}))
    .pipe(gulp.dest('./'));
});

gulp.task('tag', function () {
  var semver = require('./package.json').version;
  plugins.git.tag(semver, 'Release ' + semver, {}, function () {});
  plugins.git.push('origin', 'master', {args: '--tags'}).end();
});

gulp.task('push', function () {
  return plugins.git.push('origin', 'master').end();
});

gulp.task('publish', function (done) {
  require('child_process').spawn('npm', ['publish'], {stdio: 'inherit'})
    .on('close', done);
});

gulp.task('ship', ['test', 'jslint', 'build', 'bump', 'commit', 'tag', 'push', 'publish']);
gulp.task('save', ['test', 'jslint', 'build', 'commit', 'push']);