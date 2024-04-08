goog.module('drone_maps');
goog.require('leaflet_plugins.rotated_marker')

function create_trajectory(map, lat_lon_list, trajectory_color, marker_icon, drone_stats) {

	trajectory = L.polyline(
		lat_lon_list,
		{
			color: trajectory_color,
			opacity: 0.8,
		}
	);
	trajectory.addTo(map);

	let unique_id = drone_stats['unique_id'] ?? 'Unknown';
	let speed = drone_stats['speed'] ?? 'Unknown';
	let heading = drone_stats['heading'] ?? 'Unknown';

	// Set marker location to latest location
	marker_icon.iconAnchor = lat_lon_list[lat_lon_list.length - 1];
	
	// ASTM F3411-22a defines heading as degrees clockwise from true north
	// 361° value is used to represent Invalid, No Value, or Unknown
	if (heading == 361) {
		heading = "Unknown";
	}
	// Leaflet rotation is also measured in degrees clockwise from the north
	marker_icon.setRotationAngle(heading);
	
	// Set popup text
	marker_icon.setPopupContent(`Unique ID: ${unique_id} <br> Speed: ${speed} m/s <br> Heading: ${heading}°`);
};

exports = {create_trajectory};