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
}

$default_limit = 25;
$max_limit = 100;
function get_drone_data(WP_REST_Request $request) {
	$headers = $request->get_headers();
	error_log(print_r(array_keys($headers), true));

	// if (!isset($headers['latest-timestamp'])) {
	// 	return new WP_REST_Response(array('error' => 'Missing \'Latest-Timestamp\' Header'), 400);
	// }
	$latest_timestamp = $headers['latest-timestamp'][0];
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

	global $dronedb;
	$data_table = "remoteid_packets";

	$query = $dronedb->prepare(
		"SELECT * FROM $data_table WHERE timestamp < %s ORDER BY timestamp DESC LIMIT %d;",
		$latest_timestamp,
		$limit,
	);
	$results = $dronedb->get_results($query);

	if ($dronedb->last_error) {
		error_log($dronedb->last_error);
		// TODO: remove debug message
		return new WP_REST_Response(array('error' => 'Internal Server Error', 'msg' => $dronedb->last_error), 500);
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