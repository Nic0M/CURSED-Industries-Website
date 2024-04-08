<?php
// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// Add shortcodes
add_shortcode('live_map', 'live_map_shortcode');

/**
 * Creates a div with id 'live-map' that will be used to display a Leaflet map with live drone tracks
 * 
 * @param array $atts Pass height here, default is 400px
 * @param string $content
 * @param string $tag
 * @return void
 */
function live_map_shortcode($atts=[], $content=null, $tag='') {
	$height = $atts['height'] ?? '400px';
	?>
	<div id="live-map" style="height: <?php echo $height?>;"></div>
	<?php
}
?>