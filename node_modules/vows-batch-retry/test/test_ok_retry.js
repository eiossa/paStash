var vows = require('../lib/vows-batch-retry'),
    assert = require('assert');

var sync_counter = 0;
var sync_two_func_counter = 0;
var sync_two_func_reverse_counter = 0;
var sync_exception_counter = 0;
var async_final_assert_counter = 0;
var async_final_assert_ep2_counter = 0;
var async_timeout_counter = 0;
var async_exception_no_counter = 0;
var async_exception_one_counter = 0;
var async_exception_two_counter = 0;
var aysnc_assert_counter = 0;
var aysnc_sync_assert_counter = 0;

vows.describe('vows batch retry').addBatchRetry({
  'sync test': {
    topic: function() {
      return "toto";
    },
    sync_check: function(t) {
      assert.equal(t, "toto");
      sync_counter += 1;
      assert.equal(sync_counter, 3);
    }
  },
}, 5).addBatchRetry({
  'sync test two func': {
    topic: function() {
      return "toto";
    },
    check1: function(t) {
      assert.equal(t, "toto");
    },
    check2: function(t) {
      sync_two_func_counter += 1;
      assert.equal(sync_two_func_counter, 4);
    }
  },
}, 5).addBatchRetry({
  'sync test two func reverse': {
    topic: function() {
      return "toto";
    },
    check1: function(t) {
      sync_two_func_reverse_counter += 1;
      assert.equal(sync_two_func_reverse_counter, 2);
    },
    check2: function(t) {
      assert.equal(t, "toto");
    }
  },
}, 5).addBatchRetry({
  'sync exception test': {
    topic: function() {
      sync_exception_counter += 1;
      assert.equal(sync_exception_counter, 2);
      return "toto";
    },
    sync_exception_check: function(t) {
      assert.equal(t, "toto");
    }
  },
}, 5).addBatchRetry({
  'async final assert test': {
    topic: function() {
      var callback = this.callback;
      setTimeout(function() {
        callback(null, "toto", 43);
      }, 100);
    },
    cb_check: function(err, t, tt) {
      assert.ifError(err);
      assert.equal(t, "toto");
      assert.equal(tt, 43);
      async_final_assert_counter += 1;
      assert.equal(async_final_assert_counter, 3);
    }
  }
}, 5).addBatchRetry({
  'async final assert ep2 test': {
    topic: function() {
      var callback = this.callback;
      setTimeout(function() {
        callback(null, "toto");
      }, 100);
    },
    cb_check: function(err, t) {
      assert.ifError(err);
      assert.equal(t, "toto");
      async_final_assert_ep2_counter += 1;
      assert.equal(async_final_assert_ep2_counter, 7);
    }
  }
}, 10).addBatchRetry({
  'async timeout test': {
    topic: function() {
      var callback = this.callback;
      async_timeout_counter += 1;
      var wait = 450 - (50 * async_timeout_counter);
      setTimeout(function() {
        callback(null, "toto");
      }, wait);
    },
    timeout_check: function(err, t) {
      assert.ifError(err);
      assert.equal(t, "toto");
    }
  }
}, 10, 200).addBatchRetry({
  'async exception no args test': {
    topic: function() {
      var callback = this.callback;
      setTimeout(function() {
        var result = "myerror";
        async_exception_no_counter += 1;
        if (async_exception_no_counter == 7) {
          result = undefined;
        }
        callback(result);
      }, 100);
    },
    exception_check: function() {
      assert.equal(async_exception_no_counter, 7);
    }
  }
}, 10, 500).addBatchRetry({
  'async exception one args test': {
    topic: function() {
      var callback = this.callback;
      setTimeout(function() {
        var result = "myerror";
        async_exception_one_counter += 1;
        if (async_exception_one_counter == 5) {
          result = undefined;
        }
        callback(result);
      }, 100);
    },
    exception_check: function(err) {
      assert.equal(async_exception_one_counter, 5);
    }
  }
}, 10, 500).addBatchRetry({
  'async exception two args test': {
    topic: function() {
      var callback = this.callback;
      setTimeout(function() {
        var result = "myerror";
        async_exception_two_counter += 1;
        if (async_exception_two_counter == 4) {
          result = undefined;
        }
        callback(result, "toto");
      }, 100);
    },
    exception_check: function(err, t) {
      assert.ifError(err);
      assert.equal(t, "toto");
      assert.equal(async_exception_two_counter, 4);
    }
  }
}, 10, 500).addBatchRetry({
  'async assert topic test': {
    topic: function() {
      var callback = this.callback;
      setTimeout(function() {
        aysnc_assert_counter += 1;
        assert.equal(aysnc_assert_counter, 8);
        callback(null, "toto");
      }, 100);
    },
    assert_check: function(err, t) {
      assert.ifError(err);
      assert.equal(t, "toto");
    }
  }
}, 10, 500).addBatchRetry({
  'async sync assert topic test': {
    topic: function() {
      var callback = this.callback;
      aysnc_sync_assert_counter += 1;
      assert.equal(aysnc_sync_assert_counter, 5);
      setTimeout(function() {
        callback(null, "toto");
      }, 100);
    },
    assert_sync_check: function(err, t) {
      assert.ifError(err);
      assert.equal(t, "toto");
    }
  }
}, 10, 50000).addBatch({
  'check counters': {
    check_sync_counter: function() {
      assert.equal(sync_counter, 3);
    },
    check_sync_two_func_counter: function() {
      assert.equal(sync_two_func_counter, 4);
    },
    check_sync_two_func_reverse_counter: function() {
      assert.equal(sync_two_func_reverse_counter, 2);
    },
    check_sync_exception_counter: function() {
      assert.equal(sync_exception_counter, 2);
    },
    check_async_final_assert_counter: function() {
      assert.equal(async_final_assert_counter, 3);
    },
    check_async_final_assert_ep2_counter: function() {
      assert.equal(async_final_assert_ep2_counter, 7);
    },
    check_async_timeout_counter: function() {
      assert.equal(async_timeout_counter, 6);
    },
    check_async_exception_no_counter: function() {
      assert.equal(async_exception_no_counter, 7);
    },
    check_async_exception_one_counter: function() {
      assert.equal(async_exception_one_counter, 5);
    },
    check_async_exception_two_counter: function() {
      assert.equal(async_exception_two_counter, 4);
    },
    check_async_assert_counter: function() {
      assert.equal(aysnc_assert_counter, 8);
    },
    check_async_sync_assert_counter: function() {
      assert.equal(aysnc_sync_assert_counter, 5);
    },
  }
}).export(module);