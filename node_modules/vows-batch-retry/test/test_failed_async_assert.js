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
    cb_check: function(err, t) {
      assert.ifError(err);
      assert.equal(t, "toto");
    }
  }
}, 5, 100).export(module);