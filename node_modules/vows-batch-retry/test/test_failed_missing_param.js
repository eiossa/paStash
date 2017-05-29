var vows = require('../lib/vows-batch-retry'),
    assert = require('assert');

vows.describe('vows batch retry').addBatchRetry({
  'missing param': {
    topic: function() {
      var callback = this.callback;
      setTimeout(function() {
        callback();
      }, 100);
    },
    cb_check: function(err, t) {
      assert.ifError(err);
    }
  }
}).export(module);