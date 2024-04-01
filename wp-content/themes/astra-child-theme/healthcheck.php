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
		return new WP_ERROR('jwt_required', 'Token required', array('status' => 401));
	}
	// Remove Bearer from the JWT
	if (strpos($jwt, 'Bearer ') === 0) {
		$jwt = substr($jwt, 7);
	}
	else {
		error_log('Authorization Header missing "Bearer " prefix');
		return new WP_ERROR('jwt_invalid', 'Invalid token', array('status' => 401));
	}
	// Split by period
	$jwt_parts = explode('.', $jwt);
	if (count($jwt_parts) !== 3) {
		error_log('Malformed JWT');
		return new WP_ERROR('jwt_invalid', 'Invalid token', array('status' => 401));
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
		error_log('Invalid signature');
		return new WP_ERROR('jwt_invalid', 'Invalid token', array('status' => 401));
	}
	// Decode the header
	try {
		$header = json_decode(base64_decode($jwt_parts[0]), true);
	}
	catch (Exception $e) {
		return new WP_ERROR('jwt_invalid', 'Invalid token', array('status' => 401));
	}
	if (!isset($header['alg']) || $header['alg'] !== 'HS256') {
		return new WP_ERROR('jwt_invalid', 'Invalid token', array('status' => 401));
	}
	if (!isset($header['typ']) || $header['typ'] !== 'JWT') {
		return new WP_ERROR('jwt_invalid', 'Invalid token', array('status' => 401));
	}
	// Decode the payload
	try {
		$payload = json_decode(base64_decode($jwt_parts[1]), true);
	}
	catch (Exception $e) {
		return new WP_ERROR('jwt_invalid', 'Invalid token', array('status' => 401));
	}
	// Verify expiration time is in UNIX timestamp format
	if (!isset($payload['exp']) || !is_numeric($payload['exp'])) {
		return new WP_ERROR('jwt_invalid', 'Invalid token', array('status' => 401));
	}
	// Verify expiration time is in the future
	if ($payload['exp'] <= time()) {
		return new WP_ERROR('jwt_expired', 'Token expired', array('status' => 401));
	}
	error_log('Token validated');
	return true;
}

function handle_healthcheck($request) {
	error_log('Handling healthcheck');
	// Extract ID from request
	$id = $request->get_param('ID');
	// Check if ID is set
	if (!$id) {
		return new WP_REST_Response(array('error' => 'ID is required'), 400);
	}
	// Sanitize ID to prevent SQL injection
	$id = sanitize_text_field($id);
	// Extract status from request
	$status = $request->get_param('Status');
	// Check if status is set
	if (!$status) {
		return new WP_REST_Response(array('error' => 'Status is required'), 400);
	}
	// Sanitize status to prevent SQL injection
	$status = sanitize_text_field($status);
	// Check if status is valid ("Healthy" or "Sick")
	if ($status !== 'Healthy' && $status !== 'Sick') {
		return new WP_REST_Response(array('error' => 'Invalid status'), 400);
	}
	// Get received packet count
	$received_packets = $request->get_param('Received-Packets');
	// Check if received packets is set but could be zero
	if ($received_packets === null) {
		return new WP_REST_Response(array('error' => 'Received-Packets is required'), 400);
	}
	// Check if received packets is a number
	if (!is_numeric($received_packets)) {
		return new WP_REST_Response(array('error' => 'Received-Packets must be a number'), 400);
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
	// Assuming $id, $status, and $received_packets are defined earlier and contain the values to be inserted/updated.
	$query = $dronedb->prepare(
    	"INSERT INTO $table_name (id, status, received_packets) VALUES (%s, %s, %d) ON DUPLICATE KEY UPDATE status = VALUES(status), received_packets = VALUES(received_packets), last_updated = NOW();",
    	$id,
    	$status,
    	$received_packets
	);
	$result = $dronedb->query($query);
	// Check for error
	if ($dronedb->last_error) {
		error_log($dronedb->last_error);
		return new WP_REST_Response(array('error' => 'Server error'), 500);
	}
	// Return success response
	return new WP_REST_Response(array('success' => 'Healthcheck recorded'), 200);
}