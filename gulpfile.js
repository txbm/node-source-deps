'use strict';


var gulp = require('gulp'),
    plugins = require('gulp-load-plugins')();

gulp.task('test', function () {
  gulp.src(['src/**/*.js', 'spec/**/*.js'])
    .pipe(plugins.jasmine());
});

gulp.task('commit', function () {
  return gulp.src('./')
    .pipe(plugins.git.add())
    .pipe(plugins.git.commit(gulp.env.m));
});

gulp.task('patch', function () {

})