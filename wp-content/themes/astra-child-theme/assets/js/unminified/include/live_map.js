/**
 * Reponsible for the live map functionality
 */

goog.module('live_map');
goog.require('drone_maps');


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
	let src_addr = 'MAC-2C:CF:67:14:21:0A';
	let flight_num = 1;
	try{
		const url = 'https://cursedindustries.com/wp-json/drones/v1/get_flight';
		// Add header
		const headers = new Headers();
		headers.append('Content-Type', 'application/json');
		headers.append('Source-Address', src_addr);
		headers.append('Flight-Number', flight_num);
		// Create request
		const request = new Request(url, {
			method: 'GET',
			headers: headers,
		});
		const response = await fetch(request);
		const data = await response.json();

		// Check for error
		if (data.error) {
			console.error(data.error);
			return;
		}

		let unique_id = data['unique_id'] ?? 'Unknown';
		let speed = data['speed'] ?? 'Unknown';
		let heading = data['heading'] ?? 'Unknown';
		// Get longitude list from data
		let lon = data['lon'] ?? [];
		let lat = data['lat'] ?? [];
		// Merge lat and lon into lat_lon_list
		let lat_lon_list = [];
		for (let i = 0; i < lon.length; i++) {
			try{
				lat_lon_list.push([lat[i], lon[i]]);
			}
			catch (e) {
				console.error(e);
				break
			}
		}
		drone_stats = {
			unique_id: unique_id,
			speed: speed,
			heading: heading,
		};
		create_trajectory(live_map, lat_lon_list, orange_color, orange_icon, drone_stats);
	}
	catch (e) {
		console.error(e);
	}
}