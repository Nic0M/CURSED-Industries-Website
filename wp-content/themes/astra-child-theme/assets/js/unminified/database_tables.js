function format_speed(speed) {
	return speed + ' m/s';
}

function format_altitude(altitude) {
	if (altitude === null) {
		return 'Unknown';
	}
	return altitude + ' m';
}

function format_heading(heading) {
	if (heading < 90) {
		return heading + '° NE';
	}
	else if (heading < 180) {
		return heading + '° SE';
	}
	else if (heading < 270) {
		return heading + '° SW';
	}
	else if (heading < 360) {
		return heading + '° NW';
	}
	return heading + '°';
}

function format_latitude(latitude) {
    // Convert string to float to ensure arithmetic operations work correctly
    latitude = parseFloat(latitude);
    if (latitude < 0) {
        return (-latitude).toFixed(6) + '° S';  // Convert to positive and maintain precision
    } else {
        return latitude.toFixed(6) + '° N';  // Maintain precision
    }
}

function format_longitude(longitude) {
    // Convert string to float to ensure arithmetic operations work correctly
    longitude = parseFloat(longitude);
    if (longitude < 0) {
        return (-longitude).toFixed(6) + '° W';  // Convert to positive and maintain precision
    } else {
        return longitude.toFixed(6) + '° E';  // Maintain precision
    }
}

function format_timestamp(timestamp) {
	// Check if the timestamp is in a recognized UTC format; if not, append 'Z'
    if (typeof timestamp === 'string' && !timestamp.endsWith('Z')) {
        timestamp += 'Z';
    }
	return new Date(timestamp).toLocaleString('en-US', {timeZone: "America/Denver", timeZoneName: "short"});
}

function format_duration(seconds) {
	if (seconds < 60) {
		const word = seconds === 1 ? ' second' : ' seconds';
		return seconds + word;
	}
	else if (seconds < 3600) {
		const word = Math.floor(seconds / 60) === 1 ? ' minute ' : ' minutes ';
		return Math.floor(seconds / 60) + word + format_duration(seconds % 60);
	}
	else if (seconds < 86400) {
		const word = Math.floor(seconds / 3600) === 1 ? ' hour ' : ' hours ';
		return Math.floor(seconds / 3600) + word + format_duration(seconds % 3600);
	}
	else {
		const word = Math.floor(seconds / 86400) === 1 ? ' day ' : ' days ';
		return Math.floor(seconds / 86400) + word + format_duration(seconds % 86400);
	}
}

function updateDateStr(last_refreshed, class_name) {

	// Get all last refreshed elements by class
	const last_refreshed_elements = document.getElementsByClassName(class_name);
	if (last_refreshed_elements.length === 0) {
		console.log('No last refreshed elements found. Cannot update last refreshed time.');
		return;
	}

	// Convert last refreshed time to milliseconds
	last_refreshed *= 1000;

	// Get current time in milliseconds
	const current_time = Date.now();

	// Get elapsed time in seconds
	const elapsed_time = (current_time - last_refreshed) / 1000;

	// Create time string
	let time_string = 'Last refreshed: ';
	if (elapsed_time < 60) {
		time_string += Math.floor(elapsed_time).toString();
		if (elapsed_time !== 1) {
			time_string += ' seconds ago';
		}
		else {
			time_string += ' second ago';
		}
	}
	else if (elapsed_time < 3600) {
		const minutes = Math.floor(elapsed_time / 60);
		time_string += minutes.toString()
		if(minutes !== 1) {
			time_string += ' minutes ago';
		}
		else {
			time_string += ' minute ago';
		}
	}
	else if (elapsed_time < 86400) {
		const hours = Math.floor(elapsed_time / 3600);
		time_string += hours.toString();
		if(hours !== 1) {
			time_string += ' hours ago';
		}
		else {
			time_string += ' hour ago';
		}
	}
	else {
		const days = Math.floor(elapsed_time / 86400);
		time_string += days.toString();
		if(days !== 1) {
			time_string += ' days ago';
		}
		else {
			time_string += ' day ago';
		}
	}
	// Get last refreshed date as a string
	const last_refreshed_date = new Date(last_refreshed); // only Date object has toLocaleString method
	const last_refreshed_date_str = last_refreshed_date.toLocaleString('en-US', {timeZone: "America/Denver", timeZoneName: "short"}); // make sure last_refreshed is in milliseconds
	time_string += ' at ' + last_refreshed_date_str;

	// Update text for each last refreshed element
	for (let i = 0; i < last_refreshed_elements.length; i++) {
		last_refreshed_elements[i].innerText = time_string;
	};
}

/*
 * Creates search bar and returns it
 */
function createSearchBar(search_bar_div, table_id) {
	// Get search bar div
	const search_div = document.getElementById(search_bar_div);
	// Check if search bar div does not exist
	if (!search_div) {
		console.log('Search bar div does not exist:', search_bar_div);
		console.log('Cannot create search bar.');
		return;
	}

	// Clear search bar div
	search_div.innerHTML = '';

	// Create search bar
	const search_bar = document.createElement('input');
	// Add ID to search bar
	const search_bar_id = table_id + '-search-bar';
	search_bar.setAttribute('id', search_bar_id);
	// Add placeholder text to search bar
	search_bar.setAttribute('placeholder', 'Search by unique ID, flight date, or location...');
	// Increase width of search bar to 50%
	search_bar.setAttribute('style', 'width: 50%;');
	// Add class to search bar
	search_bar.setAttribute('class', 'form-control'); // Bootstrap (CSS framework) class
	// Add event listener to search bar
	search_bar.addEventListener('input', function() {
		search_table(search_bar_id, table_id, [0], false); // Only search first column and make search case-insensitive
		// searchTable(search_bar_id, table_id);
	});

	return search_bar;
}

/*
 * Searches a table and updates the visibility of rows based on the search value (case-insensitive)
 */
function searchTable(search_bar_id, table_id) {
	// Get the input from the search bar and convert to lowercase
	const search_value = document.getElementById(search_bar_id).value.toLowerCase();

	// Get table
	const table = document.getElementById(table_id);
	// Get table rows
	const rows = table.getElementsByTagName('tr');

	// Loop through table rows and check if an element in the row contains the search value
	for (let i = 1; i < rows.length; i++) { // Start at 1 to skip header row
		// Get cells in current row
		const cells = rows[i].getElementsByTagName('td');
		let found = false;
		// Loop through cells in current row
		for (let j = 0; j < cells.length; j++) {
			// Get cell value
			const cell_value = cells[j].innerText.toLowerCase();
			// Check if cell value contains search value
			if (cell_value.includes(search_value)) {
				found = true;
				break;
			}
		}
		// Show or hide row based on search value
		if (found) {
			rows[i].style.display = '';
		}
		else {
			rows[i].style.display = 'none';
		}
	}
}

async function getActiveFlights() {
	try {
		// Fetch active flights
		const response = await fetch('https://cursedindustries.com/wp-json/drones/v1/active-flights');
		const data = await response.json();

		// Log response
		console.log(data);

		// Get table div and clear it
		const table_div = document.getElementById('active-flights-table');
		table_div.innerHTML = '';
		// Allow div to scroll
		table_div.setAttribute('style', 'overflow-x: scroll;');
		// table_div.setAttribute('style', 'overflow-y: scroll;'); // TODO: sticky header

		// Check if HTTP response is not OK
		if (response.status !== 200) {
			table_div.innerHTML = 'Error: Could not fetch list of active flights. Please try again later.'
			return;
		}
		
		// Create search bar div
		const search_bar_div = document.createElement('div');
		// Add ID to search bar div
		search_bar_div.setAttribute('id', 'active-flights-search-bar-div');
		// Add search bar div to table div
		table_div.appendChild(search_bar_div);
		// Create search bar
		const searchBar = createSearchBar('active-flights-search-bar-div', 'active-flights-table');
		// Add search bar to search bar div
		search_bar_div.appendChild(searchBar);

		// Create last refreshed paragraph
		const last_refreshed_element = document.createElement('p');
		// Add class to element
		const class_name = 'active-flights-last-refreshed-text'
		last_refreshed_element.setAttribute('class', class_name);
		// Add element to table div
		table_div.appendChild(last_refreshed_element);
		// Add last refreshed date to element
		updateDateStr(data.current_time, class_name);

		
		// Create table
		const table = document.createElement('table');

		// Create table header
		const header = table.createTHead();
		table.setAttribute('class', 'table table-striped');

		//	Create table header row
		const headerRow = header.insertRow();
		headerRow.setAttribute('style', 'background-color: #00aa00; color: black;'); // Green header

		// Create table header cells
		headerRow.insertCell().innerHTML = 'Unique ID';
		headerRow.insertCell().innerHTML = 'Latitude';
		headerRow.insertCell().innerHTML = 'Longitude';
		headerRow.insertCell().innerHTML = 'Altitude';
		headerRow.insertCell().innerHTML = 'Ground Speed';
		headerRow.insertCell().innerHTML = 'Vertical Speed';
		headerRow.insertCell().innerHTML = 'Heading';
		headerRow.insertCell().innerHTML = 'Last Updated';

		// Create table body
		data.flights.forEach(flight => {
			const row = table.insertRow();
			row.insertCell().innerHTML = flight.unique_id; // Unique ID
			row.insertCell().innerHTML = format_latitude(flight.lat); // Current latitude
			row.insertCell().innerHTML = format_longitude(flight.lon); // Current longitude
			row.insertCell().innerHTML = format_altitude(flight.alt); // Current altitude
			row.insertCell().innerHTML = format_speed(flight.gnd_speed); // Current ground speed
			row.insertCell().innerHTML = format_speed(flight.vert_speed); // Current vertical speed
			row.insertCell().innerHTML = format_heading(flight.heading); // Current heading
			row.insertCell().innerHTML = format_timestamp(flight.timestamp); // Last updated
		});
		table_div.appendChild(table);

		if (active_flights_refresh_time_text_interval_id !== 0) {
			clearInterval(active_flights_refresh_time_text_interval_id);
		}
		active_flights_refresh_time_text_interval_id = setInterval(() => updateDateStr(data.current_time, class_name), refresh_text_interval_time); // Update last refreshed time text
	}
	catch (error) {
		console.log('Error:', error);
	}
}

async function getHistoricalFlights() {
	try {
		// Fetch historical flights
		url = 'https://cursedindustries.com/wp-json/drones/v1/historical-flights';
		const response = await fetch(
			url,
			{
				method: 'GET',
				headers: {
					'Content-Type': 'application/json'
				}
			},
			// No data to send
			);
		const data = await response.json();

		// Check if HTTP response is not OK
		if (response.status !== 200) {
			console.log('Error:', data);
			return;
		}

		// Get table div and clear it
		const table_div = document.getElementById('historical-flights-table');
		table_div.innerHTML = '';
		// Allow div to scroll
		table_div.setAttribute('style', 'overflow-x: scroll;');
		

		// Create search bar div and add it to the table div
		const search_bar_div = document.createElement('div');
		search_bar_div.setAttribute('id', 'historical-flights-search-bar-div');
		table_div.appendChild(search_bar_div);
		
		// Create search bar and add it to the search bar div
		const searchBar = createSearchBar('historical-flights-search-bar-div', 'historical-flights-table');
		search_bar_div.appendChild(searchBar);

		// Create last refreshed text entry
		const last_refreshed_element = document.createElement('p');
		const refresh_text_class_name = 'historical-flights-last-refreshed-text';
		last_refreshed_element.setAttribute('class', refresh_text_class_name);
		table_div.appendChild(last_refreshed_element, refresh_text_class_name);
		let current_time = NaN;
		// Check for error
		if (data.current_time !== undefined) {
			current_time = data.current_time;
		}
		else {
			console.log("Current time could not be parsed from the response. Displaying NaN as last refreshed time.");
			current_time = NaN;
		}
		updateDateStr(current_time, refresh_text_class_name);
		if (historical_flights_refresh_time_text_interval_id !== 0) {
			clearInterval(historical_flights_refresh_time_text_interval_id);
		}
		historical_flights_refresh_time_text_interval_id = setInterval(() => updateDateStr(current_time, refresh_text_class_name), refresh_text_interval_time); // Update elapsed time

		// Create table
		const table = document.createElement('table');
		table.setAttribute('class', 'table table-striped');

		// Create header
		const table_header = table.createTHead();
		const header_row = table_header.insertRow();
		// Create header cells
		header_row.insertCell().innerHTML = 'Unique ID';
		header_row.insertCell().innerHTML = 'Duration';
		header_row.insertCell().innerHTML = 'Start Time';
		header_row.insertCell().innerHTML = 'End Time';
		header_row.insertCell().innerHTML = 'Max Height AGL';
		header_row.insertCell().innerHTML = 'Max Speed';
		


		// Create body
		const table_body = table.createTBody();
		data.flights.forEach(flight => {
			const row = table_body.insertRow();
			row.insertCell().innerHTML = flight.unique_id;
			row.insertCell().innerHTML = format_duration(flight.duration);
			row.insertCell().innerHTML = flight.start_time;
			row.insertCell().innerHTML = flight.end_time;
			row.insertCell().innerHTML = format_altitude(flight.max_height_agl);
			row.insertCell().innerHTML = format_speed(flight.max_gnd_speed);
		});
		table_div.appendChild(table);
	}
	catch (error) {
		console.log('Error:', error);
	}
}

let current_offset = 0;
const limit = 25; // Limit imposed server-side
async function getRemoteIDPackets(append_data=false) {
	try {
		// Fetch Remote ID packets
		const url = `https://cursedindustries.com/wp-json/drones/v1/remoteid-packets?offset=${current_offset}&limit=${limit}`;
		const response = await fetch(url);
		const data = await response.json();

		// Check if HTTP response is not OK
		if (response.status !== 200) {
			console.log('Error: Could not fetch list of Remote ID packets. Please try again later.')
			console.log('Response:', data)
			return;
		}

		// Get table div and clear it
		const table_div = document.getElementById('remoteid-packets-table');
		table_div.innerHTML = '';
		// Allow div to scroll
		table_div.setAttribute('style', '');

		
		// Create search bar div
		const search_bar_div = document.createElement('div');
		// Add ID to search bar div
		search_bar_div.setAttribute('id', 'remoteid-packets-search-bar-div');
		// Add search bar div to table div
		table_div.appendChild(search_bar_div);
		// Create search bar
		const searchBar = createSearchBar('remoteid-packets-search-bar-div', 'remoteid-packets-table');
		// Add search bar to search bar div
		search_bar_div.appendChild(searchBar);

		// Create last refreshed paragraph
		const last_refreshed_element = document.createElement('p');
		// Add class to element
		const refresh_text_class_name = 'remoteid-packets-last-refreshed-text'
		last_refreshed_element.setAttribute('class', refresh_text_class_name);
		// Add element to table div
		table_div.appendChild(last_refreshed_element);
		// Add last refreshed date to element
		let current_time = NaN;
		// Check for error
		if (data.current_time !== undefined) {
			current_time = data.current_time;
		}
		else {
			console.log("Current time could not be parsed from the response. Displaying NaN as last refreshed time.");
			current_time = NaN;
		}
		updateDateStr(current_time, refresh_text_class_name);
		if (remoteid_packets_refresh_time_text_interval_id !== 0) {
			clearInterval(remoteid_packets_refresh_time_text_interval_id);
		}
		remoteid_packets_refresh_time_text_interval_id = setInterval(() => updateDateStr(current_time, refresh_text_class_name), refresh_text_interval_time); // Update elapsed time

		
		// Create new div for table
		const inner_table_div = document.createElement('div');
		inner_table_div.setAttribute('style', 'overflow-x: scroll; overflow-y: scroll; height: 75vh; position: relative;');
		table_div.appendChild(inner_table_div);
		// Create table
		const table = document.createElement('table');

		// Create table header
		const header = table.createTHead();

		// Color header row
		const headerRow = header.insertRow();
		headerRow.setAttribute('style', 'background-color: #00aa00; color: black; position: sticky; top: 0;'); // Background color necessary to avoid transparent header
		// Create table header cells
		headerRow.insertCell().innerHTML = 'Unique ID';
		headerRow.insertCell().innerHTML = 'Timestamp';
		headerRow.insertCell().innerHTML = 'Heading';
		headerRow.insertCell().innerHTML = 'Ground Speed';
		headerRow.insertCell().innerHTML = 'Vertical Speed';
		headerRow.insertCell().innerHTML = 'Latitude';
		headerRow.insertCell().innerHTML = 'Longitude';
		headerRow.insertCell().innerHTML = 'Altitude';

		// Create table body
		data.packets.forEach(packet => {
			const row = table.insertRow();
			row.insertCell().innerHTML = packet.unique_id; // Unique ID
			row.insertCell().innerHTML = format_timestamp(packet.timestamp); // Timestamp
			row.insertCell().innerHTML = format_heading(packet.heading); // Heading
			row.insertCell().innerHTML = format_speed(packet.gnd_speed); // Ground speed
			row.insertCell().innerHTML = format_speed(packet.vert_speed); // Vertical speed
			row.insertCell().innerHTML = format_latitude(packet.lat); // Latitude
			row.insertCell().innerHTML = format_longitude(packet.lon); // Longitude
			row.insertCell().innerHTML = format_altitude(packet.geoAlt); // Geodetic Altitude
		});
		inner_table_div.appendChild(table);
	}
	catch (error) {
		console.log('Error:', error);
	}
}


let active_flights_refresh_time_text_interval_id = 0;
let historical_flights_refresh_time_text_interval_id = 0;
let remoteid_packets_refresh_time_text_interval_id = 0;
let refresh_text_interval_time = 450; // 0.45 seconds (450 milliseconds)
console.log("Creating active flights table");
getActiveFlights();
console.log("Creating historical flights table");
getHistoricalFlights();
console.log("Create Remote ID packets table");
getRemoteIDPackets();

// TODO: refactor code so search bar doesn't get overwritten on refresh
// TODO: add exact search button
// Set auto-refresh interval on active flights table to be 30 seconds
setInterval(getActiveFlights, 30e3);
// Set auto-refresh interval on historical flights table to be 5 minutes (300 seconds)
setInterval(getHistoricalFlights, 300e3);
// Set auto-refresh interval on remote ID packets table to be 5 minutes (300 seconds)
setInterval(getRemoteIDPackets, 300e3);
