<?php
// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// Add shortcodes
add_shortcode('leaflet_map', 'leaflet_map_shortcode');

/**
 * Creates a div that will be used to display a Leaflet map with drone tracks
 * 
 * @param array $atts id [default='leaflet-map'], height [default='400px']
 * @param string $content
 * @param string $tag
 * @return string HTML placeholder div output for Leaflet map
 */
function leaflet_map_shortcode($atts=[], $content=null, $tag='') {
	ob_start(); // Start output buffer
	$id = $atts['id'] ?? 'leaflet-map';
	$height = $atts['height'] ?? '800px';
	?>
<div class="map-container" style="height: <?php echo $height?>;">
	<div id="<?php echo $id?>" style="height: <?php echo $height?>;">
	</div>
	<div class="flight-controls">
		<select class="flight-selector">
			<!-- Options will be added dynamically by JavaScript -->
		</select>
	</div>
	<div class="time-controls">
		<input type="range" class="time-slider">
		<button class="time-reset-button" title="Jump to present";>▶</button>
		<div class="time-popup">4 hours 34 min ago</div>
	</div>
</div>
	<?php
	$output = ob_get_clean();
	return $output;
}
?>