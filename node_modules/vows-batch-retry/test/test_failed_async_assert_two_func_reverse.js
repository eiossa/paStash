var vows = require('../lib/vows-batch-retry'),
    assert = require('assert');

var counter = 0;

vows.describe('vows failed').addBatchRetry({
  'async assert test': {
    topic: function() {
      var callback = this.callback;
      counter += 1;
      setTimeout(function() {
        callback(null, "toto");
      }, 100);
    },
    check1: function(err, t) {
      assert.equal(1, counter);
    },
    check2: function(err, t) {
      assert.equal(2, counter);
    }
  }
}, 5, 100).export(module);