<?php
add_action(
	'rest_api_init',
	function() {
		register_rest_route(
			'healthcheck/v1',
			'healthcheck',
			array(
				'methods' => 'POST',
				'callback' => 'handle_healthcheck',
				'permission_callback' => 'validate_jwt',
			)
		);
	}
);
function validate_jwt($request) {
	$jwt = $request->get_header('Authorization');
	if (!$jwt) {
		error_log('Token required');
		return new WP_REST_Response(array('error' => 'Token required'), 401);
	}
	// Remove Bearer from the JWT
	if (strpos($jwt, 'Bearer ') === 0) {
		$jwt = substr($jwt, 7);
	}
	else {
		return new WP_REST_Response(array('error' => 'Invalid token'), 401);
	}
	// Split by period
	$jwt_parts = explode('.', $jwt);
	if (count($jwt_parts) !== 3) {
		return new WP_REST_Response(array('error' => 'Invalid token'), 401);
	}
	// Get the keys from file
	$keys = file_get_contents('/home/bitnami/.receiver_keys/healthcheck');
	// For each key in the file try to validate the token
	$keys = explode("\n", $keys);
	$valid = false;
	foreach ($keys as $key) {
		// Base 64 decode the key to bytes
		$key = base64_decode($key);
		
		// Hash the first and second parts
		$signature = hash_hmac('sha256', $jwt_parts[0] . '.' . $jwt_parts[1], $key, true);
		// Base64 encode the signature
		$signature = base64_encode($signature);
		// Replace non-url-safe characters with url-safe characters and remove padding
		$signature = str_replace(['+', '/', '='], ['-', '_', ''], $signature);
		// Compare the signature to the third part
		if ($signature !== $jwt_parts[2]) {
			// Add random delay
			usleep(rand(100000, 500000)); // 0.1 to 0.5 seconds
		}
		else {
			$valid = true;
			break;
		}
	}
	// If no key was valid, return an error
	if (!$valid) {
		return new WP_REST_Response(array('error' => 'Invalid token'), 401);
	}
	// Decode the header
	try {
		$header = json_decode(base64_decode($jwt_parts[0]), true);
	}
	catch (Exception $e) {
		return new WP_REST_Response(array('error' => 'Invalid token'), 401);
	}
	if (!isset($header['alg']) || $header['alg'] !== 'HS256') {
		return new WP_REST_Response(array('error' => 'Invalid token'), 401);
	}
	if (!isset($header['typ']) || $header['typ'] !== 'JWT') {
		return new WP_REST_Response(array('error' => 'Invalid token'), 401);
	}
	// Decode the payload
	try {
		$payload = json_decode(base64_decode($jwt_parts[1]), true);
	}
	catch (Exception $e) {
		return new WP_REST_Response(array('error' => 'Invalid token'), 401);
	}
	// Verify expiration time is in UNIX timestamp format
	if (!isset($payload['exp']) || !is_numeric($payload['exp'])) {
		return new WP_REST_Response(array('error' => 'Invalid token'), 401);
	}
	// Verify expiration time is in the future
	if ($payload['exp'] <= time()) {
		return new WP_REST_Response(array('error' => 'Token expired'), 401);
	}
	return true;
}

function handle_healthcheck($request) {
	// Extract ID from request
	$id = $request->get_param('ID');
	// Check if ID is set
	if (!$id) {
		return new WP_REST_Response(array('error' => 'ID is required'), 400);
	}
	// Extract status from request
	$status = $request->get_param('Status');
	// Check if status is set
	if (!$status) {
		return new WP_REST_Response(array('error' => 'Status is required'), 400);
	}
	// Check if status is valid ("Healthy" or "Sick")
	if ($status !== 'Healthy' && $status !== 'Sick') {
		return new WP_REST_Response(array('error' => 'Invalid status'), 400);
	}
	// Get received packet count
	$received_packets = $request->get_param('Received Packets');
	// Check if received packets is set
	if (!$received_packets) {
		return new WP_REST_Response(array('error' => 'Received Packets is required'), 400);
	}
	// Store values in database
	global $dronedb;
	$table_name = 'healthchecks';
	// Prepare request
	$data = array(
		'id' => $id,
		'status' => $status,
		'received_packets' => $received_packets,
	);
	// Insert data into database
	$query = $dronedb->prepare("INSERT INTO $table_name (id, status, received_packets) VALUES (%s, %s, %d);", $data['id'], $data['status'], $data['received_packets']);
	$result = $dronedb->query($query);
	// Check for error
	if ($dronedb->last_error) {
		error_log($dronedb->last_error);
		return new WP_REST_Response(array('error' => 'Server error'), 500);
	}
	// Return success response
	return new WP_REST_Response(array('success' => 'Healthcheck recorded'), 200);
}