vows-batch-retry
================

[![Build Status](https://travis-ci.org/bpaquet/vows-batch-retry.png?branch=master)](https://travis-ci.org/bpaquet/vows-batch-retry)

Add a ``addBatchRetry`` command to [vows](http://vowsjs.org/), for tests which involved lot of external components, and which can failed
sometimes.

## How to use it ?

```js
var vows = require('vows-batch-retry'),
    assert = require('assert');

vows.describe('test if').addBatchRetry({
  'random number': {
    topic: function() {
      return Math.random();
    },
    'is upper 0.7': function(x) {
      assert(x > 0.7);
    }
  }
}, 10).export(module);

```

10 is the number of retry. When the test is ok, next try are ignored.

Example of output
```
$ node_modules/.bin/vows  random.js --spec
 
  ♢ test if 
  
Test failed 'random number' with exception, retrying. { name: 'AssertionError',
  actual: false,
  expected: true,
  operator: '==',
  message: 'false == true' }
  random number[try 1/10]
    ✓ is upper 0.7
Test failed 'random number' with exception, retrying. { name: 'AssertionError',
  actual: false,
  expected: true,
  operator: '==',
  message: 'false == true' }
  random number[try 2/10]
    ✓ is upper 0.7
Test failed 'random number' with exception, retrying. { name: 'AssertionError',
  actual: false,
  expected: true,
  operator: '==',
  message: 'false == true' }
  random number[try 3/10]
    ✓ is upper 0.7
  random number[try 4/10]
    ✓ is upper 0.7
  random number[try 5/10]
    ✓ is upper 0.7
  random number[try 6/10]
    ✓ is upper 0.7
  random number[try 7/10]
    ✓ is upper 0.7
  random number[try 8/10]
    ✓ is upper 0.7
  random number[try 9/10]
    ✓ is upper 0.7
  random number[try 10/10]
    ✓ is upper 0.7
 
✓ OK » 10 honored (0.011s) 

```

This test is ok after 3 tries.

## Async tests

After the number of tries, you can specify the test timeout. Default value is 2000 ms.

Example :
```js
var vows = require('vows-batch-retry'),
    assert = require('assert');

vows.describe('test if').addBatchRetry({
  'random number': {
    topic: function() {
      var callback = this.callback;
      setTimeout(function() {
        callback(null, "value");
      }, Math.random() * 500)
    },
    'is lower than 0.5, with a setTimeout call': function(x) {
      assert.equal("value", x);
    }
  }
}, 10, 250).export(module);

```

Example of output :
```
node_modules/.bin/vows  random-async.js --spec
 
  ♢ test if 
  
Test failed 'random number' with topic timeout, retrying.
  random number[try 1/10]
    ✓ is lower than 0.5, with a setTimeout call
Test failed 'random number' with topic timeout, retrying.
  random number[try 2/10]
    ✓ is lower than 0.5, with a setTimeout call
  random number[try 3/10]
    ✓ is lower than 0.5, with a setTimeout call
  random number[try 4/10]
    ✓ is lower than 0.5, with a setTimeout call
  random number[try 5/10]
    ✓ is lower than 0.5, with a setTimeout call
  random number[try 6/10]
    ✓ is lower than 0.5, with a setTimeout call
  random number[try 7/10]
    ✓ is lower than 0.5, with a setTimeout call
  random number[try 8/10]
    ✓ is lower than 0.5, with a setTimeout call
  random number[try 9/10]
    ✓ is lower than 0.5, with a setTimeout call
  random number[try 10/10]
    ✓ is lower than 0.5, with a setTimeout call
 
✓ OK » 10 honored (0.820s) 
```

This test is ok after 2 tries.
