var vows = require('vows');

var catch_error = false;
var error_catched = [];

process.on('uncaughtException', function(err) {
  if (catch_error) {
    error_catched.push(err);
  }
});

function extend_vows_suite(suite) {
  suite.addBatchRetry = function(batch, nb_try, timeout) {
    if (!nb_try) {
      console.log("You have to specify nb_try param with addBatchRetry");
      process.exit(2);
    }
    if (! timeout) {
      timeout = 2000;
    }
    var result = {};
    var last = suite;
    Object.keys(batch).forEach(function(k) {
      var current = batch[k];
      var is_ok = false;
      var try_counter = 0;
      var checks = 0;
      var checks_counter = 0;
      var is_current_fail = false;
      var is_sync = false;
      Object.keys(current).forEach(function(test_name) {
        if (test_name != 'topic') {
          checks += 1;
        }
      });
      for(var i = 0; i < nb_try; i ++) {
        var new_name = k + '[try ' + (i + 1) + '/' + nb_try + ']';
        var new_batch = {};
        new_batch[new_name] = {
          topic: function() {
            var callback = this.callback;
            var callback_already_called = false;
            if (is_ok) {
              return callback();
            }
            try_counter += 1;
            checks_counter = 0;
            is_current_fail = false;
            catch_error = true;
            error_catched = [];
            var timer = setTimeout(function() {
              console.log('Test failed \'' + k + '\' with topic timeout, retrying.');
              if (error_catched.length > 0) {
                console.log('Catched errors', error_catched);
              }
              callback_already_called = true;
              is_current_fail = true;
              catch_error = false;
              callback();
            }, timeout);
            try {
              var result = current.topic.apply({callback: function() {
                catch_error = false;
                if (timer) {
                  clearTimeout(timer);
                  timer = undefined;
                }
                if (callback_already_called) {
                  return;
                }
                callback_already_called = true;
                var args = arguments;
                process.nextTick(function() {
                  callback.apply(null, args);
                });
              }});
              if (result) {
                if (timer) {
                  clearTimeout(timer);
                  timer = undefined;
                }
                is_sync = true;
                return result;
              }
            }
            catch(e) {
              console.log('Test failed \'' + k + '\' with topic exception, retrying.', e);
              if (timer) {
                clearTimeout(timer);
                timer = undefined;
              }
              is_current_fail = true;
              callback();
            }
          }
        };
        Object.keys(current).forEach(function(j) {
          if (j != 'topic') {
            new_batch[new_name][j] = function(a1, a2, a3, a4) {
              if (is_ok) {
                return;
              }
              // catch error during topic execution
              if (is_current_fail) {
                if (checks_counter == 0 && try_counter == nb_try) {
                  throw new Error('Too many try, failing');
                }
                return;
              }
              checks_counter += 1;
              // see vows code. suite.js, line 84
              if (a1 && current[j].length < 2 && suite.options.error) {
                if (checks_counter == checks && try_counter == nb_try) {
                  throw new Error('Too many try, failing');
                }
                return;
              }
              try {
                if (is_sync) {
                  current[j](arguments[1]);
                }
                else {
                  current[j].apply(null, arguments);
                }
                if (checks_counter == checks) {
                  is_ok = true;
                }
                return;
              }
              catch(e) {
                console.log('Test failed \'' + k + '\' with exception, retrying.', e);
                is_current_fail = true;
                if (checks_counter == checks && try_counter == nb_try) {
                  throw new Error('Too many try, failing');
                }
              }
            }
            var args = "";
            for(var x = 0; x < current[j].length; x ++) {
              if (args.length > 0) {
                args += ",";
              }
              args += "a" + x;
            }
          }
        });
        last = last.addBatch(new_batch);
      };
    });
    return last;
  }
  return suite;
}

exports.describe = function(s) {
  return extend_vows_suite(vows.describe(s));
}
