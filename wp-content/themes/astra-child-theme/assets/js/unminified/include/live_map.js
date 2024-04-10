/**
 * Reponsible for the live map functionality
 */

goog.module('live_map');
const drone_maps_module = goog.require('drone_maps');


let live_map = L.map(
	'live-map', // Needs to match the div id in maps.php shortcode
	{
		center: [40.03, -105.1], // Set initial location to Boulder, CO
		zoom: 14,
	},
);
let live_map_tile_layer = L.tileLayer(
	'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
	{
		minZoom: 1,
		maxZoom: 19,
		zoomSnap: 0.25,
		attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
	},
)
live_map_tile_layer.addTo(live_map);

red_color = '#ff3131';
orange_color = '#ff914d';
yellow_color = '#ffbd59';
green_color = '#00bf63';
cyan_color = '#0cc0df';
lilac_color = '#5271ff';
pink_color = '#ff66c4';
// Red: #ff3131
// Orange: #ff914d
// Yellow: #ffbd59
// Green #00bf63
// Cyan: #0cc0df
// Lilac: #5271ff
// Pink: #ff66c4

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

red_marker = L.marker([40.03, -105.1], {icon: red_icon}).addTo(live_map).bindPopup("I'm a red drone moving at 50 m/s!");
orange_marker = L.marker([40.04, -105.1], {icon: orange_icon}).addTo(live_map).bindPopup("I'm an orange drone!");
yellow_marker = L.marker([40.05, -105.1], {icon: yellow_icon}).addTo(live_map).bindPopup("I'm a yellow drone!");
green_marker = L.marker([40.06, -105.1], {icon: green_icon}).addTo(live_map).bindPopup("I'm a green drone!");
cyan_marker = L.marker([40.07, -105.1], {icon: cyan_icon}).addTo(live_map).bindPopup("I'm a blue drone!");
lilac_marker = L.marker([40.08, -105.1], {icon: lilac_icon}).addTo(live_map).bindPopup("I'm a purple drone!");
purple_marker = L.marker([40.09, -105.1], {icon: pink_icon}).addTo(live_map).bindPopup("I'm a pink drone!");

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
	let flight_num = 1;
	try{
		const url = 'https://cursedindustries.com/wp-json/drones/v1/data';
		// Add header
		const headers = new Headers();
		// headers.append('Content-Type', 'application/json');
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
		let request = null;
		let response = null;
		let json_data = null;
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

					// Loop through data and add to lat_lon_list
					for (let i = 0; i < json_data.data.length; i++) {
						lat_lon_list.push([json_data.data[i]['lat'], json_data.data[i]['lon']]);
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
			
		drone_stats = {
			'unique_id': unique_id,
			'speed': current_speed,
			'heading': current_heading,
		};
		console.log('Lat Lon List:', lat_lon_list);
		console.log('Drone stats:', drone_stats);
		drone_maps_module.create_trajectory(live_map, lat_lon_list, orange_color, orange_icon, drone_stats);
	}
	catch (e) {
		console.error(e);
	}
}
rest_api_trajectory();