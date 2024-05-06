/**
 * This is the main JS code for the flight information page.
 */

goog.module('flight_information');
goog.require('leaflet_plugins.rotated_marker');
let database_tables_module = goog.require('database_tables');
const helpers_module = goog.require('helpers');

let DroneIconClass = L.Icon.extend(
	{
		options: {
			iconSize: [100, 100],
			iconAnchor: [50, 50], // so middle of drone is center
			popupAnchor: [0, -25], // so popup is slightly above drone
			rotationOrigin: 'center center',
		}
	},
);

async function populate_flight_information() {
	let table_div = document.getElementById('flight-information-table');
	if (table_div === null) {
		console.log("div with id: flight-information-table does not exist on this page.")
		return;
	}
	let src_addr = new URLSearchParams(window.location.search).get('src_addr');
	let start_time = new URLSearchParams(window.location.search).get('start_time');
	if (src_addr === null || start_time === null) {
		console.error('No flight information provided');
		// window.location.assign('/'); // Redirect to home page
		// return; // TODO: check if only flight number is provided
	}
	let flight_num = new URLSearchParams(window.location.search).get('flight_num');
	if (flight_num === null) {
		console.error('No flight number provided');
		flight_num = 0;
	}
	const url = `/wp-json/drones/v1/data`;
	const headers = new Headers();
	headers.set('Flight-Number', flight_num);
	headers.set('Source-Address', src_addr);
	headers.set('Start-Time', start_time);
	headers.set('Limit', '1000');
	const latest_timestamp = helpers_module.getFormattedTimestampNow();
	headers.set('Latest-Timestamp', latest_timestamp);
	// Create request
	const request = new Request(
		url,
		{
			method: 'GET',
			headers: headers,
		},
	);
	let response = null;
	try {
		response = await fetch(request);
	}
	catch (e) {
		// Check if error message contains 404
		if (e.toString().includes('404')) {
			table_div.innerHTML = 'No data found for flight';
		}
		console.error('Error retrieving data for flight', e);
	}
	let json_data = await response.json();
	if (json_data.data.length == 0) {
		table_div.innerHTML = 'No data found for flight';
		console.error('No data found for flight', flight_num);
		return;
	}
	let lat_lon_list = [];
	for (let i = 0; i < json_data.data.length; i++) {
		lat_lon_list.push([json_data.data[i]['lat'], json_data.data[i]['lon']]);
	}
	// Create path
	let map = L.map('flight-map').setView(lat_lon_list[0], 13);
	L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
	console.log("lat_lon_list:", lat_lon_list);
	let trajectory = L.polyline(lat_lon_list, {color: 'blue', opacity: 0.8}).addTo(map);
	console.log('lat_lon_list[0]:', lat_lon_list[0]);
	
	// Create icon
	let drone_icon = new DroneIconClass({iconUrl: 'https://cursedindustries.com/images/drone_marker_icon_red.png'});
	let drone_marker = L.marker(lat_lon_list[lat_lon_list.length-1], {icon: drone_icon}).addTo(map)
	drone_marker.bindPopup(`UAS ID: ${json_data.data[json_data.data.length-1]['unique_id']} <br> Latitude: ${json_data.data[json_data.data.length-1]['lat']} <br> Longitude: ${json_data.data[json_data.data.length-1]['lon']}`)
	drone_marker.setRotationAngle(json_data.data[json_data.data.length-1]['heading']);
	map.panTo(lat_lon_list[lat_lon_list.length-1]);
	
	// Create table
	table_div = document.getElementById('flight-information-table');
	table_div.setAttribute("style", "overflow-x: scroll; height: 500px; position: relative; overflow-y: scroll;");
	table_div.innerHTML = '';
	const table = document.createElement('table');

	const header = table.createTHead();

	const header_row = header.insertRow();
	header_row.setAttribute('style', 'background-color: #00aa00; color: black; position: sticky; top: 0;'); // Background color necessary to avoid transparent header
	header_row.insertCell().innerHTML = 'UAS ID';
	header_row.insertCell().innerHTML = 'Timestamp';
	header_row.insertCell().innerHTML = 'Heading';
	header_row.insertCell().innerHTML = 'Ground Speed';
	header_row.insertCell().innerHTML = 'Vertical Speed';
	header_row.insertCell().innerHTML = 'Latitude';
	header_row.insertCell().innerHTML = 'Longitude';
	header_row.insertCell().innerHTML = 'Altitude';

	// Create table body
	json_data.data.forEach(packet => {
		const row = table.insertRow();
		row.insertCell().innerHTML = packet.unique_id; // Unique ID
		row.insertCell().innerHTML = database_tables_module.format_timestamp(packet.timestamp); // Timestamp
		row.insertCell().innerHTML = database_tables_module.format_heading(packet.heading); // Heading
		row.insertCell().innerHTML = database_tables_module.format_speed(packet.gnd_speed); // Ground speed
		row.insertCell().innerHTML = database_tables_module.format_speed(packet.vert_speed); // Vertical speed
		row.insertCell().innerHTML = database_tables_module.format_latitude(packet.lat); // Latitude
		row.insertCell().innerHTML = database_tables_module.format_longitude(packet.lon); // Longitude
		row.insertCell().innerHTML = database_tables_module.format_altitude(packet.geoAlt); // Geodetic Altitude
	});
	table_div.appendChild(table);

	// Remove sliders if they exist
	let sliders = document.getElementsByClassName('time-slider');
	for (let i = 0; i < sliders.length; i++) {
		sliders[i].style.display = 'none';
	}
	// Remove selectors
	let selectors = document.getElementsByClassName('flight-selector');
	for (let i = 0; i < selectors.length; i++) {
		selectors[i].style.display = 'none';
	}
	// Remove buttons
	let buttons = document.getElementsByClassName('time-reset-button');
	for (let i = 0; i < buttons.length; i++) {
		buttons[i].style.display = 'none';
	}
}

populate_flight_information();