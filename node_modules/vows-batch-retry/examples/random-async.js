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
