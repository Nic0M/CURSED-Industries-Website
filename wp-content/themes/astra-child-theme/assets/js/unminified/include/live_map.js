/**
 * Reponsible for the live map functionality
 */

goog.module('live_map');
const drone_maps_module = goog.require('drone_maps');
goog.require('leaflet_plugins.rotated_marker');

var red_color = '#ff3131';
var orange_color = '#ff914d';
var yellow_color = '#ffbd59';
var green_color = '#00bf63';
var cyan_color = '#0cc0df';
var lilac_color = '#5271ff';
var pink_color = '#ff66c4';
// Red: #ff3131
// Orange: #ff914d
// Yellow: #ffbd59
// Green #00bf63
// Cyan: #0cc0df
// Lilac: #5271ff
// Pink: #ff66c4

var trajectory_colors = [red_color, orange_color, yellow_color, green_color, cyan_color, lilac_color, pink_color];

async function refresh_live_data() {
	// Fetch all flights in the last six hours
	const url = 'https://cursedindustries.com/wp-json/drones/v1/last_6_hours_of_flights';
	let response = null;
	try {
		response = await fetch(url);
	}
	catch (error) {
		console.error('Error fetching data:', error);
	}
	let json_data = await response.json();
	if (json_data.error) {
		console.error(json_data.error);
	}
	const flights = json_data.data;
	return flights;
}

function plot_trajectory(map, lat_lon_list) {
	let trajectory_polyline = L.polyline(
			lat_lon_list,
			{
				// Random trajectory color
				color: trajectory_colors[Math.floor(Math.random() * trajectory_colors.length)],
				opacity: 0.8,
			}
		).addTo(map)
	return trajectory_polyline;
}

function refresh_trajectories(map, flights, flight_selector_value, effective_current_time) {
	let trajectories = [];
	for (let i = 0; i < flights.length; i++) {
		let flight = flights[i];
		let flight_num = flight['flight_num'];
		if (flight_selector_value !== 0) {
			if (flight_num !== flight_selector_value) {
				continue;
			}
		}
		// Find all data up do effective current time
		let lat_lon_list = [];
		for (let j = 0; j < flight['lat_lon_list'].length; j++) {
			if (flight['unix_epoch_timestamp_list'][j] <= effective_current_time) {
				lat_lon_list.push(flight['lat_lon_list'][j]);
			}
		}
		// Plot trajectory
		let trajectory = plot_trajectory(map, lat_lon_list);
		trajectories.push(trajectory);		
	}
	return trajectories;
}

function create_live_map() {
	// Create the map using OpenStreetMap tiles via the Leaflet library
	let live_map_div = document.getElementById('live-map');
	if (live_map_div === null) {
		return;
	}
	let live_map = L.map(
		'live-map',
		{
			center: [40.03, -105.1], // Coordinates for Boulder, CO
			zoom: 14,
		},
	);
	let live_map_tile_layer = L.tileLayer(
		'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
		{
			minZoom: 1,
			maxZoom: 19,
			zoomSnap: 0.25,
			// Necessary copyright attribution
			attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
		},
	)
	live_map_tile_layer.addTo(live_map);

	let flights = refresh_live_data();


	let map_container_div = live_map_div.parentElement;
	let time_controls_div = map_container_div.getElementsByClassName('time-controls');
	let flight_controls_div = map_container_div.getElementsByClassName('flight-controls');
	let flight_selector = flight_controls_div[0].getElementsByClassName('flight-selector')[0];

	// Add default option to flight selector
	let default_option = document.createElement('option');
	default_option.value = 0;
	default_option.text = 'All recent flights';
	// Add all flight numbers to the flight selector
	for (let i = 0; i < flights.length; i++) {
		let flight = flights[i];
		let flight_num = flight['flight_num'];
		let start_time = flight['start_time'];
		let uas_id = flight['uas_id'];
		let option = document.createElement('option');
		option.value = flight_num;
		option.text = `UAS ID: ${uas_id}, Started: ${start_time}`;
		flight_selector.add(option);
	}
	




	// Create time control slider
	let time_slider = time_controls_div[0].getElementsByClassName('time-slider')[0];

	// Get flight selector 
	let trajectories = refresh_trajectories(live_map, flights, flight_selector.value, time_slider.value);

	const now = new Date();

	// Round to minutes for slider bar
	const max_time = Math.floor(now / 1000 / 60); // Time in minutes
	const time_lookback = 6 * 60; // 6 hours in minutes
	const min_time = max_time - time_lookback // Time in minutes

	time_slider.type = 'range';
	time_slider.min = min_time;
	time_slider.max = max_time;
	time_slider.value = time_slider.max; // Present time
	// Update the slider every minute to the current time if watching the present
	setInterval(
		() => {
			if (parseInt(time_slider.value, 10) === parseInt(time_slider.max, 10)) {
				const new_now = new Date();
				const new_max = Math.floor(new_now / 1000 / 60);
				time_slider.max = new_max;
				time_slider.min - new_max - time_lookback;
				time_slider.value = time_slider.max;
			}
		},
		60000, // 1 minute
	);

	const time_popup = time_controls_div[0].getElementsByClassName('time-popup')[0];

	// Display popup when slider is moved
	time_slider.addEventListener(
		'input',
		function () {
			const value = parseInt(time_slider.value, 10);
			const current_time = new Date(value * 60 * 1000); // Convert minutes to milliseconds
			let diff = now - current_time;
			if (diff < 0) {
				diff = 0;
			}
			const hours = Math.floor(diff / 1000 / 60 / 60);
			const minutes = Math.floor(diff / 1000 / 60) % 60;
			
			let hours_str = null;
			if (hours === 1) {
				hours_str = 'hour';
			}
			else {
				hours_str = 'hours';
			}
			let minutes_str = null;
			if (minutes === 1) {
				minutes_str = 'minute';
			}
			else {
				minutes_str = 'minutes';
			}
			time_popup.textContent = `${hours} ${hours_str} ${minutes} ${minutes_str} ago`;
			time_popup.style.display = 'block';
		}
	);

	// Remove popup when slider is released
	time_slider.addEventListener(
		'change', // Change event is triggered when the slider is released
		function () {
			time_popup.style.display = 'none';
			trajectories = refresh_trajectories(live_map, flights, flight_selector.value, time_slider.value);
		}
	);

	// Add button to reset time slider to present
	const reset_button = time_controls_div[0].getElementsByClassName('time-reset-button')[0];
	reset_button.addEventListener(
		'click',
		function () {
			const new_now = new Date();
			const new_max = Math.floor(new_now / 1000 / 60);
			time_slider.max = new_max;
			time_slider.min = new_max - time_lookback;
			time_slider.value = time_slider.max;
			flights = refresh_live_data();
			trajectories = refresh_trajectories(live_map, flights, flight_selector.value, time_slider.value);
		}
	);

	// Fade back when button is released
	reset_button.addEventListener(
		'mouseup',
		function () {
			this.blur();
		}
	);


	return live_map;


	
	// // Fetch all active flights
	// const url = 'https://cursedindustries.com/wp-json/drones/v1/get_active_flights';
	
	// let flight_controls_div = map_container_div.getElementsByClassName('flight-controls');
	// let flight_selector = flight_controls_div[0].getElementsByClassName('flight-selector');



	// flight_nums
}

var live_map = create_live_map();

var DroneIconClass = L.Icon.extend(
	{
		options: {
			iconSize: [100, 100],
			iconAnchor: [50, 50], // so middle of drone is center
			popupAnchor: [0, -25], // so popup is slightly above drone
			rotationOrigin: 'center center',
		}
	},
);

var red_icon = new DroneIconClass({iconUrl: 'https://cursedindustries.com/images/drone_marker_icon_red.png'});
var orange_icon = new DroneIconClass({iconUrl: 'https://cursedindustries.com/images/drone_marker_icon_orange.png'});
var yellow_icon = new DroneIconClass({iconUrl: 'https://cursedindustries.com/images/drone_marker_icon_yellow.png'});
var green_icon = new DroneIconClass({iconUrl: 'https://cursedindustries.com/images/drone_marker_icon_green.png'});
var cyan_icon = new DroneIconClass({iconUrl: 'https://cursedindustries.com/images/drone_marker_icon_cyan.png'});
var lilac_icon = new DroneIconClass({iconUrl: 'https://cursedindustries.com/images/drone_marker_icon_lilac.png'});
var pink_icon = new DroneIconClass({iconUrl: 'https://cursedindustries.com/images/drone_marker_icon_pink.png'});

var red_marker = L.marker([40.03, -105.1], {icon: red_icon}).addTo(live_map).bindPopup("I'm a red drone moving at 50 m/s!");
var orange_marker = L.marker([40.04, -105.1], {icon: orange_icon}).addTo(live_map).bindPopup("I'm an orange drone!");
var yellow_marker = L.marker([40.05, -105.1], {icon: yellow_icon}).addTo(live_map).bindPopup("I'm a yellow drone!");
var green_marker = L.marker([40.06, -105.1], {icon: green_icon}).addTo(live_map).bindPopup("I'm a green drone!");
var cyan_marker = L.marker([40.07, -105.1], {icon: cyan_icon}).addTo(live_map).bindPopup("I'm a blue drone!");
var lilac_marker = L.marker([40.08, -105.1], {icon: lilac_icon}).addTo(live_map).bindPopup("I'm a purple drone!");
var purple_marker = L.marker([40.09, -105.1], {icon: pink_icon}).addTo(live_map).bindPopup("I'm a pink drone!");

var icons = [red_icon, orange_icon, yellow_icon, green_icon, cyan_icon, lilac_icon, pink_icon];

red_marker.setRotationAngle(45);
orange_marker.setRotationAngle(90);
yellow_marker.setRotationAngle(135);
green_marker.setRotationAngle(180);
cyan_marker.setRotationAngle(225);
lilac_marker.setRotationAngle(270);
purple_marker.setRotationAngle(315);

// Create made up path for red drone
var red_drone_path_lat_lon = [
	[43.022, -103.2],
	[42.023, -104.3],
	[41.0278, -102.4],
	[41.031, -104.5],
	[40.035, -104.87],
	[40.03, -105.1],
];

var red_polyline = L.polyline(
	red_drone_path_lat_lon,
	{
		color: '#ff3131',
		opacity: 0.8,
	},
).addTo(live_map);

async function rest_api_trajectory(){
	let src_addr = 'MAC-60:60:1F:5A:48:07';
	src_addr = 'MAC-60:60:1F:DF:3F:C1';
	let flight_num = 1;
	try{
		const url = 'https://cursedindustries.com/wp-json/drones/v1/data';
		// Add header
		const headers = new Headers();
		headers.append('Source-Address', src_addr);
		headers.append('Limit', 100);
		let latest_timestamp = Date.now();
		// Convert timestamp to YYYY-MM-DD HH:MM:SS.FFF
		let latest_timestamp_str = new Date(latest_timestamp).toISOString();
		// Replace the 'T' with a space and remove the 'Z' at the end to fit the SQL datetime format
		// Also, truncate to remove extra precision beyond milliseconds
		latest_timestamp_str = latest_timestamp_str.replace('T', ' ').replace('Z', '').substring(0, 23);
		headers.append('Latest-Timestamp', latest_timestamp_str);
		
		// headers.append('Flight-Number', flight_num);
		
		// Loop until 404 error is returned or 10 requests are made
		let request_count = 0;
		let status_code = 200;
		let lat_lon_list = [];
		let heading_list = [];
		let altitude_list = [];
		let speed_list = [];

		let request = null;
		let response = null;
		let json_data = null;
		let last_data = null;
		let current_heading = null;
		let current_speed = null;
		let unique_id = null;
		let flight_num = null;
		while (request_count < 10 && status_code == 200) {
			// Create request
			request = new Request(
				url,
				{
					method: 'GET',
					headers: headers,
				},
			);
			try {
				response = await fetch(request);
			}
			catch (e) {
				console.error('Fetch error: ', e);
			}
			try {
				json_data = await response.json();
			}
			catch (e) {
				console.error('JSON error: ', e);
				break;
			}
			

			// Check return code
			status_code = response.status;
			switch (status_code) {
				case 200:
					// Update Latest-Timestamp header to end of last request
					last_data = json_data.data[json_data.data.length - 1];
					latest_timestamp_str = last_data['timestamp'];
					headers.set('Latest-Timestamp', latest_timestamp_str);
					current_heading = last_data['heading'] ?? 'Unknown';
					current_speed = last_data['gnd_speed'] ?? 'Unknown';
					unique_id = last_data['unique_id'] ?? 'Unknown';
					flight_num = last_data['flight_num'] ?? 0;

					// Loop through data and add to lat_lon_list
					for (let i = 0; i < json_data.data.length; i++) {
						lat_lon_list.push([json_data.data[i]['lat'], json_data.data[i]['lon']]);
						heading_list.push(json_data.data[i]['heading']);
						altitude_list.push(json_data.data[i]['geo_alt']);
						speed_list.push(json_data.data[i]['gnd_speed']);
					}
					break;
				case 400:
					// Log the request
					console.log('Bad Request:', request);
					break;
				case 404:
					// End of data
					console.log('End of data');
					break;
				case 500:
					// Database may be down
					console.log('Internal server error');
					break;
			}

			// Check for error if not 404
			if (status_code !== 404 && json_data.error) {
				console.error(json_data.error);
			}
		}
			
		let drone_stats = {
			'unique_id': unique_id,
			'speed': current_speed,
			'heading': current_heading,
			'flight_num': flight_num,
			'lat_lon_list': lat_lon_list,
			'heading_list': heading_list,
			'altitude_list': altitude_list,
			'speed_list': speed_list,
		};
		console.log('Drone stats:', drone_stats);
		let drone_icon = icons[Math.floor(Math.random() * icons.length)];
		drone_maps_module.create_trajectory(live_map, orange_color, drone_icon, drone_stats);
	}
	catch (e) {
		console.error(e);
	}
}
rest_api_trajectory();

exports.icons = icons;