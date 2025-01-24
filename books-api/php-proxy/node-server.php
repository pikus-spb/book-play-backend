<?php
  include_once("./constants.php");

  set_time_limit(120);

  $queryString = $_SERVER['QUERY_STRING'];

  $node_pid = intval(file_get_contents(NODE_PID_FILE));
  if($node_pid === 0) {
    $node_pid = exec("PORT=".NODE_PORT." node ".SCRIPT_PATH." ".NODE_PORT." >".NODE_OUT_FILE." 2>&1 & echo $!");
    if ($node_pid > 0) {
      file_put_contents(NODE_PID_FILE, $node_pid, LOCK_EX);
      sleep(10); // wait for node server to spin up
    } else {
      echo "Error while starting web server. Please see ".NODE_OUT_FILE." file for logs.";
      return;
    }
  }
  // Make request to node.js web server using curl
  $curl = curl_init(REQUEST_URL."/".$queryString);
  // Add headers if any
  curl_setopt($curl, CURLOPT_HEADER, 1);
  curl_setopt($curl, CURLOPT_RETURNTRANSFER, 1);
  $headers = array();
  foreach(getallheaders() as $key => $value) {
    $headers[] = $key . ": " . $value;
  }
  curl_setopt($curl, CURLOPT_HTTPHEADER, $headers);
  curl_setopt($curl, CURLOPT_CUSTOMREQUEST, $_SERVER["REQUEST_METHOD"]);
  if($_SERVER["REQUEST_METHOD"] === "POST") {
    curl_setopt($curl, CURLOPT_POST, 1);
    curl_setopt($curl, CURLOPT_POSTFIELDS, http_build_query($_POST));
  }
  $resp = curl_exec($curl);
  if($resp === false) {
    echo "Error requesting ".REQUEST_URL." ".curl_error($curl);
  } else {

    // Output server response
    list($head, $body) = explode("\r\n\r\n", $resp, 2);
    $headarr = explode("\n", $head);
    foreach($headarr as $headval) {
      header($headval);
    }
    echo $body;
  }
  curl_close($curl);

