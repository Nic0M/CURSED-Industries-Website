<?php

add_action('rest_api_init', 'register_drones_api_routes');

function register_drones_api_routes() {
	register_rest_route(
		'drones/v1',
		'/data/',
		array(
			'methods' => 'GET',
			'callback' => 'get_drone_data',
			'permission_callback' => '__return_true',
		),
	);
	register_rest_route(
		'drones/v1',
		'/last_6_hours_of_flights/',
		array(
			'methods' => 'GET',
			'callback' => 'get_last_6_hours_of_flights',
			'permission_callback' => '__return_true',
		),
	);
}

$default_limit = 25;
$max_limit = 100;
function get_drone_data(WP_REST_Request $request) {
	$headers = $request->get_headers();
	// error_log(print_r(array_keys($headers), true));
	
	// For some reason Wordpress converts all dashes in headers to underscores
	// Wordpress also converts all header names to lowercase

	if (!isset($headers['latest_timestamp'])) {
		return new WP_REST_Response(array('error' => 'Missing \'Latest-Timestamp\' Header'), 400);
	}
	$latest_timestamp = $headers['latest_timestamp'][0];
	if (!preg_match('/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}/', $latest_timestamp)) {
		return new WP_REST_Response(array('error' => 'Invalid \'Latest-Timestamp\' header. Format must be \'YYYY-MM-DD HH:MM:SS.FFF\''), 400);
	}

	global $default_limit;
	global $max_limit;
	if (!isset($headers['limit'])) {
		$limit = $default_limit;
	}
	else {
		$limit = $headers['limit'][0];
		if (!is_numeric($limit)) {
			return new WP_REST_Response(array('error' => "The Limit header must be a number"), 400);
		}
		// Convert to integer and clamp between 0 and $max_limit
		$limit = intval($limit);
		$limit = $limit < 0 ? 0 : $limit;
		$limit = $limit > $max_limit ? $max_limit : $limit;
	}

	$start_time = $headers['start_time'][0] ?? null;
	if ($start_time === null) {
		start_time === '1970-01-01 00:00:00.000';
	}

	// Check for source address header
	$src_addr = $headers['source_address'][0] ?? null;
	// Validate source address format
	if ($src_addr !== null && !preg_match('/^(?:MAC|BDA)-(?:[A-Fa-f0-9]{2}:){5}[A-Fa-f0-9]{2}$/i', $src_addr)) {
		return new WP_REST_Response(array('error' => 'Invalid Source-Address header address. Must be of the form MAC-XX:XX:XX:XX:XX:XX or BDA-XX:XX:XX:XX:XX:XX where X is a hex character.'), 400);
	}

	global $dronedb;
	$data_table = "remoteid_packets";

	if ($src_addr === null) {
		$query = $dronedb->prepare(
			"SELECT * FROM $data_table WHERE timestamp >= %s AND timestamp < %s ORDER BY timestamp DESC LIMIT %d;",
			$start_time,
			$latest_timestamp,
			$limit
		);
	}
	else {
		$query = $dronedb->prepare(
			"SELECT * FROM $data_table WHERE timestamp >= %s AND timestamp < %s AND src_addr = %s ORDER BY timestamp DESC LIMIT %d;",
			$start_time,
			$latest_timestamp,
			$src_addr,
			$limit
		);
	}
	// Show query
	error_log("Executing query: " . $query);
	$results = $dronedb->get_results($query);
	

	if ($dronedb->last_error) {
		error_log($dronedb->last_error);
		return new WP_REST_Response(array('error' => 'Internal Server Error', 'msg' => 'Ensure timestamp is valid'), 500);
	}

	if (count($results) == 0) {
		return new WP_REST_Response(array('error' => 'No data found'), 404);
	}

	$current_time = current_time('U');
	$response = array(
		'data' => $results,
		'time' => $current_time,
	);
	$response = new WP_REST_Response($response, 200);
	$cache_control_header = 'public, max-age=604800';
	$response->header('Cache-Control', $cache_control_header);
	return $response;
}

function get_last_6_hours_of_flights(WP_REST_Request $request) {
	global $dronedb;
	$data_table = "remoteid_packets";
	$query = "SELECT * FROM $data_table WHERE timestamp > DATE_SUB(NOW(), INTERVAL 6 HOUR) ORDER BY timestamp DESC;";
	error_log("Executing query: " . $query);
	$results = $dronedb->get_results($query);

	if ($dronedb->last_error) {
		error_log($dronedb->last_error);
		return new WP_REST_Response(array('error' => 'Internal Server Error', 'msg' => 'Ensure timestamp is valid'), 500);
	}

	if (count($results) == 0) {
		return new WP_REST_Response(array('msg' => 'No data found'), 200);
	}

	// Add random flight number to each result
	foreach ($results as $result) {
		$result->flight_number = rand(1000, 9999);
	}
	$current_time = current_time('U');
	$response = array(
		'data' => $results,
		'time' => $current_time,
	);
	$response = new WP_REST_Response($response, 200);
	$cache_control_header = 'public, max-age=120';
	$response->header('Cache-Control', $cache_control_header);
	return $response;
}