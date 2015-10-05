(function () {
  'use strict';

  var srcDeps = require('./index.js');

  var x = srcDeps({
    packagers: ['npm'],
    packagerData: {bower: {pkgDir: 'something_else'}},
    logOutput: true,
    rootDir: './fixture'
  });

  console.log(x);
})();