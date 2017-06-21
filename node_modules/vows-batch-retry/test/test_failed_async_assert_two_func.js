var vows = require('../lib/vows-batch-retry'),
    assert = require('assert');

vows.describe('vows failed').addBatchRetry({
  'async assert test': {
    topic: function() {
      var callback = this.callback;
      setTimeout(function() {
        assert.equal(2, 5);
        callback(null, "toto");
      }, 100);
    },
    check1: function(err, t) {
      assert.ifError(err);
    },
    check2: function(err, t) {
      assert.equal(t, "toto");
    }
  }
}, 5, 100).export(module);