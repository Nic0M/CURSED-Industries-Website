goog.module('drone_maps');
goog.require('leaflet_plugins.rotated_marker')

// Global live map variable
var live_map = L.map(
	'live-map', // Needs to match the div id in maps.php
	{
		center: [40.03, -105.1],
		zoom: 14,
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
			popupAnchor: [0, -50], // so popup is above drone
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

red_marker = L.marker([40.03, -105.1], {icon: red_icon}).addTo(live_map).bindPopup("I'm a red drone!");
orange_marker = L.marker([40.04, -105.1], {icon: orange_icon}).addTo(live_map).bindPopup("I'm an orange drone!");
yellow_marker = L.marker([40.05, -105.1], {icon: yellow_icon}).addTo(live_map).bindPopup("I'm a yellow drone!");
green_marker = L.marker([40.06, -105.1], {icon: green_icon}).addTo(live_map).bindPopup("I'm a green drone!");
cyan_marker = L.marker([40.07, -105.1], {icon: cyan_icon}).addTo(live_map).bindPopup("I'm a cyan drone!");
lilac_marker = L.marker([40.08, -105.1], {icon: lilac_icon}).addTo(live_map).bindPopup("I'm a lilac drone!");
purple_marker = L.marker([40.09, -105.1], {icon: pink_icon}).addTo(live_map).bindPopup("I'm a pink drone!");

red_marker.setRotationAngle(45);
orange_marker.setRotationAngle(90);
yellow_marker.setRotationAngle(135);
green_marker.setRotationAngle(180);
cyan_marker.setRotationAngle(225);
lilac_marker.setRotationAngle(270);
purple_marker.setRotationAngle(315);
