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
	)

	// Return HTTP response 200 (OK)
	return new WP_REST_Response($results, 200);
}

function astra_child_theme_enqueue_scripts() {
    wp_enqueue_script('database_tables', get_stylesheet_directory_uri() . '/js/database_tables.js', array(), false, true);
}
add_action('wp_enqueue_scripts', 'astra_child_theme_enqueue_scripts');

function load_completed_flight_table_function() {

	# Debug
	error_reporting(E_ALL);
	ini_set('display_errors', '1');

	# Import global database variable
	global $dronedb;	

	// Select all rows from completed flights table
	$table_name = 'completed_flights';	
	$results = $dronedb->get_results("SELECT * FROM $table_name");

	// Check for error
	if ($dronedb->last_error) {
  		echo 'Oops! ' . $dronedb->last_error . '<br>';
	}

	echo "<div id='active-flights-table'>Loading active flights...</div>\n";

	$refresh_time = current_time('U');
	echo "\n<p>Current time: $refresh_time</p>";
	echo "\n<p>Last refreshed <span id='dateElement'>0</span> seconds ago.</p>";
	echo "
<script>
function updateDate() {
	let last_refreshed = $refresh_time;
	document.getElementById('dateElement').innerText = (Math.round(Date.now()/1000-last_refreshed)).toString();
}
setInterval(updateDate, 1000);
</script>\n";
	// Check if data was returned
	if (!empty($results)) {
		echo "\n<table width='80%' style='border-collapse: collapse;'>\n";
		echo "\t<tbody>\n";
		echo "\t\t<tr>\n";
		echo "\t\t\t<th>Unique ID</th>\n";
		echo "\t\t\t<th>Duration (min)</th>\n";
		echo "\t\t\t<th>Max Altitude (m)</th>\n";
		echo "\n\t\t</tr>\n";

		// Vertical line separating column headers from body
		echo "\t\t<tr>\n" . "\t\t\t<td colspan='3'><hr size='1'></td>\n" . "\t\t</tr>\n";

		foreach($results as $row) {
			echo "\t\t<tr>\n";
			echo "\t\t\t<td>" . $row->UniqueID . "</td>\n";
			echo "\t\t\t<td>" . round($row->Duration / 60, 1) . "</td>\n";
			echo "\t\t\t<td>" . $row->MaxAltitude . "</td>\n";
			echo "\t\t</tr>\n";
		}

		echo "\t</tbody>\n";
		echo "</table>";	
	}
	else {
		return '<p>No flights recorded &#x1F6E9</p>';
	}
}
add_shortcode('load_completed_flight_table', 'load_completed_flight_table_function');
