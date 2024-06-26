<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

// Add actions to hook on creation of header
add_action('wp_head', 'add_leaflet');

/**
 * Add Leaflet to every header on the site
 * 
 * @wp-hook wp_head
 * @return string HTML code for header to load Leaflet
 */
function add_leaflet() {
	// Add Leaflet CSS
	?>
	<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
		integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
		crossorigin=""/>
	<?php
	// Add Leaflet JS
	?>
	<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
		integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
		crossorigin=""></script>
	<?php
};