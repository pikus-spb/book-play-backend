<?php
  include_once("./constants.php");

  $node_pid = intval(file_get_contents(NODE_PID_FILE));
  if($node_pid === 0) {
    echo "Node.js is not yet running.\n";
    return;
  }
  echo "Stopping Node.js with PID=$node_pid:\n";
  $ret = -1;
  passthru("kill $node_pid", $ret);
  echo $ret === 0 ? "Done.\n" : "Failed. Error: $ret\n";
  file_put_contents(NODE_PID_FILE, '', LOCK_EX);

