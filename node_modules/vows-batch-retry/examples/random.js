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
