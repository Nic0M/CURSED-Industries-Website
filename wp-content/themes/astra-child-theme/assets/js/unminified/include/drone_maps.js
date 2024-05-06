// const { info } = require("sass");

goog.module('drone_maps');
goog.require('leaflet_plugins.rotated_marker')

function set_popup_text(marker, info) {
	let uas_id = info['uas_id'] ?? 'Unknown';
	let speed = info['speed'] ?? 'Unknown';
	let heading = info['heading'] ?? 'Unknown';
	let altitude = info['altitude'] ?? 'Unknown';
	let flight_num = info['flight_num'] ?? 0;
	marker.setPopupContent(`UAS ID: <a href="/flight-information?flight=${flight_num}">${uas_id}</a> <br> Speed: ${speed} m/s <br> Heading: ${heading}° <br> Altitude: ${altitude} m`);
}

function update_marker(map, marker, info) {
	// Set latitude and longitude
	let lat_lon = info['lat_lon'];
	marker.setLatLng(lat_lon);

	// Set heading and rotate marker to match
	let heading = info['heading'];
	if (heading == 361) {
		info['heading'] = "Unknown";
	}
	else {
		marker.setRotationAngle(heading);
	}
	
	// Center map on marker
	map.panTo(lat_lon);

	// Set popup text
	set_popup_text(marker, info);
}

function create_trajectory_slider(map, data, drone_icon) {
	let lat_lon_list = data['lat_lon_list'];
	let heading_list = data['heading_list'];
	let altitude_list = data['altitude_list'];
	let speed_list = data['speed_list'];
	let flight_num = data['flight_num'];

	let drone_marker = L.marker(
		lat_lon_list[lat_lon_list.length - 1],
		{
			icon: drone_icon,
		}
	).addTo(map);

	// Create the slider
	let slider = document.createElement('input');
	slider.type = 'range';
	slider.min = 0;
	slider.max = data['lat_lon_list'].length - 1;
	slider.id = 'flight-' + flight_num + '-slider';
	slider.oninput = () => {
		// Convert slider value to base-10 integer
		const index = parseInt(slider.value, 10);
		const data_point = {
			lat_lon: lat_lon_list[index],
			heading: heading_list[index],
			altitude: altitude_list[index],
			speed: speed_list[index],
			flight_num: flight_num,
		}
		update_marker(map, drone_marker, data_point);
	};
	slider.value = slider.max;
	// slider.style.width = '80%';
	slider.style.position = 'fixed';
	slider.style.bottom = '10px';
	slider.style.left = '10%';
	slider.style.zIndex = '1000';

	return slider;
}

function create_trajectory(map, trajectory_color, drone_icon, data) {

	let trajectory = L.polyline(
		data['lat_lon_list'],
		{
			color: trajectory_color,
			opacity: 0.8,
		}
	);
	trajectory.addTo(map);

	// let unique_id = drone_stats['unique_id'] ?? 'Unknown';
	// let speed = drone_stats['speed'] ?? 'Unknown';
	// let heading = drone_stats['heading'] ?? 'Unknown';
	// let flight_num = drone_stats['flight_num'] ?? 0;

	let slider = create_trajectory_slider(
		map,
		data,
		drone_icon,
	)
	let slider_div = document.getElementById('live-map-slider-div');
	slider_div.appendChild(slider);

	// // Set marker location to latest location
	// drone_marker.iconAnchor = lat_lon_list[lat_lon_list.length - 1];
	
	// // ASTM F3411-22a defines heading as degrees clockwise from true north
	// // 361° value is used to represent Invalid, No Value, or Unknown
	// if (heading == 361) {
	// 	heading = "Unknown";
	// }
	// // Leaflet rotation is also measured in degrees clockwise from the north
	// drone_marker.setRotationAngle(heading);
	
	// // Set popup text
	// drone_marker.setPopupContent(`UAS ID: <a href="/flight-information?flight=${flight_num}">${unique_id}</a> <br> Speed: ${speed} m/s <br> Heading: ${heading}°`);
};

exports = {create_trajectory};