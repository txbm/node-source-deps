'use strict';

describe('srcDep Gulp Plugin', function () {

  var srcDeps = require('../src/main.js'),
      gulp = require('gulp');


  
  var x = srcDeps(['npm'], true);

  console.log(x);

});