var vows = require('../lib/vows-batch-retry'),
    assert = require('assert');

vows.describe('vows failed').addBatchRetry({
  'async assert sync test': {
    topic: function() {
      var callback = this.callback;
      assert.equal(2, 5);
      setTimeout(function() {
        callback(null, "toto");
      }, 100);
    },
    cb_check: function(err, t) {
      assert.ifError(err);
      assert.equal(t, "toto");
    }
  }
}, 5, 50000).export(module);