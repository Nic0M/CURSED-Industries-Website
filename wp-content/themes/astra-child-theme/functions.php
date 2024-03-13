<?php
function s3_bucket_redirects() {
    if ( is_page('redirect') ) {
        wp_redirect('https://cursed-remoteid-flight-tracks.s3.us-east-2.amazonaws.com/trackserver-demo.gpx');
        die;
    }
}
add_action( 'template_redirect', 's3_bucket_redirects' );

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

function astra_child_theme_enqueue_scripts() {
    wp_enqueue_script('database_tables', get_stylesheet_directory_uri() . '/js/database_tables.js', array(), false, true);
}
add_action('wp_enqueue_scripts', 'astra_child_theme_enqueue_scripts');

function load_completed_flight_table_function() {
	# Debug
	error_reporting(E_ALL);
	ini_set('display_errors', '1');

	echo "<div id='active-flights-table'>Loading active flights...</div>\n";
	echo "<div id='historical-flights-table'>Loading historical flights...</div>\n";
}
add_shortcode('load_completed_flight_table', 'load_completed_flight_table_function');
