goog.module('drone_maps');

// Global live map variable
var live_map = L.map(
	'live-map', // Needs to match the div id in maps.php
	{
		center: [40.5, -105],
		zoom: 13,
	},
);
L.tileLayer(
	'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
	{
		maxZoom: 19,
		attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
	},
).addTo(live_map);