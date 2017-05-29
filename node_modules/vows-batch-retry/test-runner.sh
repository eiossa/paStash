#!/bin/bash

cd test

if [ "$TEST" = "" ]; then
  TEST=`ls test*.js`
fi

for test in $TEST; do
  if [ ! -f $test ]; then
    echo "Missing test file $test"
    exit 42
  fi
  if [[ "$test" =~ "test_ok" ]]; then
    echo "Launching test : $test"
    NODE_PATH=../lib vows $test --spec || exit 1
    echo "Test $test ok"
  else
    echo "Launching failing test : $test"
    NODE_PATH=../lib vows $test --spec && exit 1
    echo "Test $test failed ok"
  fi
done
