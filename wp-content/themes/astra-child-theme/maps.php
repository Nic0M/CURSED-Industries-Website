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
 * @param array $atts id [default='live-map'], height [default='400px']
 * @param string $content
 * @param string $tag
 * @return string HTML div for Leaflet map
 */
function leaflet_map_shortcode($atts=[], $content=null, $tag='') {
	ob_start(); // Start output buffer
	$id = $atts['id'] ?? 'live-map';
	$height = $atts['height'] ?? '800px';
	?>
	<div id="<?php echo $id?>" style="height: <?php echo $height?>;"></div>
	<?php
	$output = ob_get_clean();
	return $output;
}
?>