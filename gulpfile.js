'use strict';

var gulp = require('gulp'),
    plugins = require('gulp-load-plugins')(),
    yargs = require('yargs'),
    pkg = require('./package.json');

function _reloadPkgFile() {
  delete require.cache[require.resolve('./package.json')];
  pkg = require('./package.json');
}

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

gulp.task('commit', ['build'], function (done) {
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
gulp.task('bump', ['build'], function (done) {
  var rtype = yargs.argv.b || 'patch';
  
  gulp.src('./package.json')
  .pipe(plugins.bump({type: rtype}))
  .pipe(gulp.dest('./'))
  .on('finish', done);
});

gulp.task('release', ['bump'], function (done) {
  var rtype = yargs.argv.b || 'patch';
  
  _reloadPkgFile();

  gulp.src('./')
  .pipe(plugins.git.add())
  .pipe(plugins.git.commit(rtype + ' release: ' + pkg.version))
  .on('finish', function () {
    plugins.git.tag(pkg.version, rtype + ' release ' + pkg.version, {}, function () {
      done();
    })
    .on('end', function () {
      console.log('donesky');
      done();
    });
  });
});

gulp.task('push', ['commit'], function (done) {
  plugins.git.push('origin', 'master')
  .end();
});

gulp.task('push-release', ['release'], function (done) {
  plugins.git.push('origin', 'master', {args: '--tags'})
  .end();
});

gulp.task('publish', ['push-release'], function (done) {
  require('child_process').spawn('npm', ['publish'], {stdio: 'inherit'})
    .on('close', done);
});