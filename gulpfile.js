'use strict';


var gulp = require('gulp'),
    plugins = require('gulp-load-plugins')();

gulp.task('test', function () {
  gulp.src(['src/**/*.js', 'spec/**/*.js'])
    .pipe(plugins.jasmine());
});