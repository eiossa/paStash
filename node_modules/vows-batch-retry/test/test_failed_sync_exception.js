var vows = require('../lib/vows-batch-retry'),
    assert = require('assert');

vows.describe('vows failed').addBatchRetry({
  'sync exception test': {
    topic: function() {
      assert.equal("toto2", "toto");
      return "toto2";
    },
    cb_check: function(t, tt) {
      assert.equal(t, "toto");
    }
  }
}, 5, 100).export(module);