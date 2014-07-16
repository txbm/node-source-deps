'use strict';

var gulp = require('gulp'),
    plugins = require('gulp-load-plugins')(),
    yargs = require('yargs'),
    pkg = require('./package.json');

gulp.task('test', function () {
  gulp.src(['src/*', 'spec/*'])
  .pipe(plugins.istanbul())
  .on('finish', function () {
    gulp.src(['spec/*'])
    .pipe(plugins.mocha({reporter: 'nyan'}))
    .pipe(plugins.istanbul.writeReports())
    .on('end', function () {});
  });
});

gulp.task('ci', ['build', 'test'], function () {
  gulp.src('coverage/lcov.info')
  .pipe(plugins.coveralls());
});

gulp.task('jshint', function () {
  gulp.src('src/*')
  .pipe(plugins.jshint())
  .pipe(plugins.jshint.reporter('default'));
});

gulp.task('size', ['build'], function () {
  gulp.src('dist/*.min.js')
  .pipe(plugins.size());
});

gulp.task('commit', function () {
  gulp.src('./')
  .pipe(plugins.git.add())
  .pipe(plugins.git.commit(yargs.argv.m || 'automatic commit by gulp task'));
});

gulp.task('build', function () {
  gulp.src('src/*.js')
  .pipe(plugins.sourcemaps.init())
  .pipe(plugins.concat(pkg.name + '.js'))
  .pipe(plugins.sourcemaps.write('./', {addComment: false}))
  .pipe(gulp.dest('dist'));

  gulp.src('src/*.js')
  .pipe(plugins.sourcemaps.init())
  .pipe(plugins.concat(pkg.name + '.min.js'))
  .pipe(plugins.uglify())
  .pipe(plugins.sourcemaps.write('./', {addComment: false}))
  .pipe(gulp.dest('dist'));
});

gulp.task('bump', function () {
  gulp.src('./package.json')
  .pipe(plugins.bump({type: yargs.argv.b || 'patch'}))
  .pipe(gulp.dest('./'));
});

gulp.task('tag', function () {
  var semver = require('./package.json').version;
  plugins.git.tag(semver, 'Release ' + semver, {}, function () {});
  plugins.git.push('origin', 'master', {args: '--tags'}).end();
});

gulp.task('push', function () {
  plugins.git.push('origin', 'master').end();
});

gulp.task('publish', function (done) {
  require('child_process').spawn('npm', ['publish'], {stdio: 'inherit'})
    .on('close', done);
});

gulp.task('full', ['test', 'jshint', 'build']);
gulp.task('ship', ['test', 'jshint', 'build', 'bump', 'commit', 'tag', 'push', 'publish']);
gulp.task('save', ['test', 'jshint', 'build', 'commit', 'push']);