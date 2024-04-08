<?php
// Remove when done debugging
error_reporting(E_ALL);
ini_set('display_errors', '1');

require_once('custom_header.php');
require_once('custom_footer.php');
require_once('maps.php');
require_once('healthcheck.php');

add_action('wp_enqueue_scripts', 'astra_child_theme_enqueue_scripts');

add_shortcode('load_data_table', 'load_data_table_function');
add_shortcode('load_completed_flight_table', 'load_completed_flight_table_function');
add_shortcode('load_active_flight_table', 'load_active_flight_table_function');
add_shortcode('load_healthcheck_table', 'load_healthcheck_table_function');

// add_action( 'template_redirect', 's3_bucket_redirects' );
// function s3_bucket_redirects() {
//     if ( is_page('redirect') ) {
//         wp_redirect('https://cursed-remoteid-flight-tracks.s3.us-east-2.amazonaws.com/trackserver-demo.gpx');
//         die;
//     }
// }

// Connect to drone flight database
$database_access = parse_ini_file('/home/bitnami/passwords.ini');
$dronedb = new wpdb(
		$database_access['username'],
		$database_access['password'],
		$database_access['dbname'],
		$database_access['dbhost']
		);
// TODO: fix the database connection failing silently if credentials are wrong

/*
 * Hello, World! REST API endpoint
 */
add_action('rest_api_init', 
	function() { 
		register_rest_route('hello-world/v1', '/hello/', 
			array(
			'methods' => 'GET',
			'callback' => 'hello_world_endpoint',
			'permission_callback' => '__return_true',
			)
		);
	}
);
function hello_world_endpoint($data) {
	return new WP_REST_Response(array('message' => 'Hello, World!'), 200);
}

/*
 * Add REST API endpoint to retrieve active flights from database
 */
add_action('rest_api_init', 
	function() { 
		register_rest_route('drones/v1', '/active-flights/', 
			array(
			'methods' => 'GET',
			'callback' => 'active_flights_endpoint',
			'permission_callback' => '__return_true',
			)
		);
	}
);
function active_flights_endpoint($data) {
	global $dronedb;

	// Select all rows from active flights table in the database
	$table_name = 'active_flights';
	$results = $dronedb->get_results("SELECT * FROM $table_name");

	// Check for error
	if ($dronedb->last_error) {
		error_log($dronedb->last_error);
		return new WP_REST_Response(array('error' => 'Internal Server Error'), 500);
  	}

	// Add the current time to the JSON response
	$current_time = current_time('U');
	$response = array(
		'flights' => $results,
		'current_time' => $current_time,
	);

	// Return HTTP response 200 (OK)
	return new WP_REST_Response($response, 200);
}

/*
 * Add REST API endpoint to retrieve completed flights from database
 */
add_action('rest_api_init', 
	function() { 
		register_rest_route('drones/v1', '/historical-flights/', 
			array(
			'methods' => 'GET',
			'callback' => 'historical_flights_endpoint',
			'permission_callback' => '__return_true',
			)
		);
	}
);
function historical_flights_endpoint($data) {
	global $dronedb;

	// Select all rows from completed flights table in the database
	$table_name = 'completed_flights';
	$results = $dronedb->get_results("SELECT * FROM $table_name");

	// Check for error
	if ($dronedb->last_error) {
		error_log($dronedb->last_error);
		return new WP_REST_Response(array('error' => 'Internal Server Error'), 500);
  	}

	// Add the current time to the JSON response
	$current_time = current_time('U');
	$response = array(
		'flights' => $results,
		'current_time' => $current_time,
	);

	// Return HTTP response 200 (OK)
	return new WP_REST_Response($response, 200);
}

/*
 * Add REST API endpoint to access remoteid packets from the databaase
 */
add_action('rest_api_init', 
	function() { 
		register_rest_route('drones/v1', '/remoteid-packets/', 
			array(
			'methods' => 'GET',
			'callback' => 'remoteid_packets_endpoint',
			'permission_callback' => '__return_true',
			'args' => array(
				'offset' => array(
					'default' => 0,
					'validate_callback' => function($param, $request, $key) {
						return is_numeric($param) && $param >= 0;
					},
					'sanitize_callback' => 'absint',
				),
				'limit' => array(
					'default' => 25,
					'validate_callback' => function($param, $request, $key) {
						return is_numeric($param) && $param <= 25;
					},
					'sanitize_callback' => 'absint',
				),
			)
			)
		);
	}
);
function remoteid_packets_endpoint($data) {
	global $dronedb;

	$offset = $data['offset'];
	$limit = $data['limit'];

	// Clamp the number of rows to 25 max
	$limit = min($limit, 25);

	// Select rows from remoteid packets table in the database
	$table_name = 'remoteid_packets';
	$query = $dronedb->prepare("SELECT * FROM $table_name ORDER BY timestamp DESC LIMIT %d OFFSET %d;", $limit, $offset);
	$results = $dronedb->get_results($query);

	// Check for error
	if ($dronedb->last_error) {
		error_log($dronedb->last_error);
		return new WP_REST_Response(array('error' => 'Internal Server Error'), 500);
  	}

	// Add the current time to the JSON response
	$current_time = current_time('U');
	$response = array(
		'packets' => $results,
		'current_time' => $current_time,
	);

	// Return HTTP response 200 (OK)
	return new WP_REST_Response($response, 200);
}

add_action(
	'rest_api_init', 
	function() { 
		register_rest_route('drones/v1', '/get_flight/', 
			array(
			'methods' => 'GET',
			'callback' => 'get_flight_endpoint',
			'permission_callback' => '__return_true',
			)
		);
	}
);
function get_flight_endpoint($data) {
	global $dronedb;

	// Get the flight ID from the request
	$src_addr = $data['src_addr'];
	$flight_num = $data['flight_num'];

	// Select the flight from the database
	$table_name = 'remoteid_packets';
	// $query = $dronedb->prepare("SELECT unique_id, lat, lon, gnd_speed, heading FROM $table_name WHERE src_addr = %s AND flight_num = %d;", $src_addr, $flight_num);
	$query = $dronedb->prepare("SELECT unique_id, lat, lon, gnd_speed, heading FROM $table_name WHERE src_addr = '%s'", $src_addr);
	$results = $dronedb->get_results($query);

	// Check for error
	if ($dronedb->last_error) {
		error_log($dronedb->last_error);
		return new WP_REST_Response(array('error' => 'Internal Server Error'), 500);
  	}

	// Return the flight data
	$response = array(
		// Latitude list
		'lat' => array_map(function($row) { return $row->lat; }, $results),
		// Longitude list
		'lon' => array_map(function($row) { return $row->lon; }, $results),
		// Get latest speed
		$gnd_speed = 
		'speed' => end($results)->gnd_speed,
		// Get latest heading
		'heading' => end($results)->heading,
		// Get unique id
		'unique_id' => end($results)->unique_id,
		// Get the current time
		'current_time' => current_time('U'),
	);

	// Return HTTP response 200 (OK)
	return new WP_REST_Response($response, 200);
}

add_action(
	'rest_api_init', 
	function() { 
		register_rest_route('drones/v1', '/get_flight_packets/', 
			array(
			'methods' => 'GET',
			'callback' => 'get_flight_packets',
			'permission_callback' => '__return_true',
			)
		);
	}
);
function get_flight_packets($data) {
	global $dronedb;

	// Get the flight ID from the request
	$src_addr = $data['src_addr'];
	$start_time = $data['start_time'];
	$src_addr = "MAC-60:60:1F:5A:48:07";
	$start_time = "2024-03-26 07:00:24";

	// Select the flight from the database
	$completed_flights_table_name = 'completed_flights';
	$remoteid_packets_table_name = 'remoteid_packets';
	$query = $dronedb->prepare(
		'Select rp.unique_id,rp.timestamp,rp.heading,rp.gnd_speed,rp.vert_speed,rp.lat,rp.lon,rp.height From %s cf, %s rp where rp.src_addr=cf.src_addr and rp.src_addr="%s" and rp.timestamp >= "%s" and rp.timestamp <= (Select end_time From completed_flights Where src_addr="%s" and start_time="%s");',
		$src_addr,
		$start_time,
		$src_addr,
		$start_time,
	);
	$results = $dronedb->get_results($query);

	// Check for error
	if ($dronedb->last_error) {
		error_log($dronedb->last_error);
		return new WP_REST_Response(array('error' => $dronedb->last_error));
		return new WP_REST_Response(array('error' => 'Internal Server Error'), 500);
  	}

	// Return the flight data
	$response = array(
		'packets' => $results,
		'query' => $query,
		'current_time' => current_time('U'),
	);

	// Return HTTP response 200 (OK)
	return new WP_REST_Response($response, 200);
}

function astra_child_theme_enqueue_scripts() {
	// wp_enqueue_script('custom-mincss', get_stylesheet_directory_uri() . '/assets/css/minified/style.min.css', array(), false, true);
	// TODO: remove unminified CSS and JS files
	wp_enqueue_style('custom-min-css', get_stylesheet_directory_uri() . '/assets/css/unminified/custom_footer.css', array(), null, 'all');
	wp_enqueue_script('custom-min-js', get_stylesheet_directory_uri() . '/assets/js/minified/main.min.js', array(), null, true);
	// wp_enqueue_script('edit_dist_seach', get_stylesheet_directory_uri() . '/assets/js/unminified/custom-search.js', array(), null, true);
    // wp_enqueue_script('database_tables', get_stylesheet_directory_uri() . '/assets/js/unminified/database_tables.js', array(), null, true);
}

function load_data_table_function() {
	ob_start();
	echo "\n<h2>Remote ID Packets</h2>\n";
	echo "<div id='remoteid-packets-table'>Loading Remote ID packets...</div>\n";
	return ob_get_clean();
}

function load_completed_flight_table_function() {
	ob_start();
	echo "<h2>Completed Flights</h2>\n";
	echo "<div id='historical-flights-table'>Loading historical flights...</div>\n";
	return ob_get_clean();
}

function load_active_flight_table_function() {
	ob_start();
	echo "<h2>Active Flights</h2>\n";
	echo "<div id='active-flights-table'>Loading active flights...</div>\n";
	return ob_get_clean();
}

function load_healthcheck_table_function() {
	ob_start();
	echo "<h2>Receiver Status</h2>\n";
	echo "<div id='healthchecks-table'>Getting receiver statuses...</div>\n";
	return ob_get_clean();
}
