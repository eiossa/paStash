var vows = require('../lib/vows-batch-retry'),
    assert = require('assert');

vows.describe('vows failed').addBatchRetry({
  'async exception one args test': {
    topic: function() {
      var callback = this.callback;
      setTimeout(function() {
        callback("titi");
      }, 100);
    },
    cb_check: function(err) {
      assert.ifError(err);
    }
  }
}, 5, 100).export(module);