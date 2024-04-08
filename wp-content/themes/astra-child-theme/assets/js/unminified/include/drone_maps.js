goog.module('drone_maps');

// Global live map variable
var live_map = L.map(
	'live-map', // Needs to match the div id in maps.php
	{
		center: [40.02, -105.2],
		zoom: 13,
	},
);
L.tileLayer(
	'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
	{
		minZoom: 1,
		maxZoom: 19,
		attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
	},
).addTo(live_map);