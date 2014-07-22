(function () {
  'use strict';

  var srcDeps = require('./index.js');

  var x = srcDeps({
    packagers: ['npm'],
    logOutput: true,
    rootDir: './fixture'
  });

  console.log(x);
})();