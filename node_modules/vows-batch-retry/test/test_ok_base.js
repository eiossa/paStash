var vows = require('../lib/vows-batch-retry'),
    assert = require('assert');

vows.describe('vows batch retry').addBatch({
  'standard test': {
    topic: function() {
      return "toto";
    },
    my_check: function(t) {
      assert.equal("toto", t);
    }
  },
  'callback no args test': {
    topic: function() {
      var callback = this.callback;
      setTimeout(function() {
        callback();
      }, 100);
    },
    cb_check: function() {
    }
  },
  'callback one args test': {
    topic: function() {
      var callback = this.callback;
      setTimeout(function() {
        callback(null);
      }, 100);
    },
    cb_check: function(t) {
    }
  },
  'callback two args test': {
    topic: function() {
      var callback = this.callback;
      setTimeout(function() {
        callback(null, "toto");
      }, 100);
    },
    cb_check: function(t) {
      assert.equal("toto", t);
    }
  },
  'callback two args not null test': {
    topic: function() {
      var callback = this.callback;
      setTimeout(function() {
        callback("toto", "titi");
      }, 100);
    },
    cb_check: function(t, tt) {
      assert.equal("toto", t);
      assert.equal("titi", tt);
    }
  }
}).export(module);