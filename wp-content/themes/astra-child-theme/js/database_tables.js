function format_duration(seconds) {
	if (seconds < 60) {
		const word = seconds === 1 ? 'second' : 'seconds';
		return seconds + word;
	}
	else if (seconds < 3600) {
		const word = Math.floor(seconds / 60) === 1 ? 'minute' : 'minutes';
		return Math.floor(seconds / 60) + word + format_duration(seconds % 60);
	}
	else if (seconds < 86400) {
		const word = Math.floor(seconds / 3600) === 1 ? 'hour' : 'hours';
		return Math.floor(seconds / 3600) + word + format_duration(seconds % 3600);
	}
	else {
		const word = Math.floor(seconds / 86400) === 1 ? 'day' : 'days';
		return Math.floor(seconds / 86400) + word + format_duration(seconds % 86400);
	}
}

function updateDateStr(last_refreshed) {

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

	// Get last refreshed element and update text
	const last_refreshed_element = document.getElementById('last-refreshed-text');
	if (last_refreshed_element) {
		last_refreshed_element.innerText = time_string;
	}
	else {
		console.log('Could not find last refreshed element, cannot update time string.');
	}
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
	// Add class to search bar
	search_bar.setAttribute('class', 'form-control'); // Bootstrap (CSS framework) class
	// Add event listener to search bar
	search_bar.addEventListener('input', function() {
		searchTable(search_bar_id, table_id);
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
	for (let i = 0; i < rows.length; i++) {
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

		// Get table div
		const table_div = document.getElementById('active-flights-table');
		// Clear table div
		table_div.innerHTML = '';

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
		// Add ID to element
		last_refreshed_element.setAttribute('id', 'last-refreshed-text');
		// Add element to table div
		table_div.appendChild(last_refreshed_element);
		// Add last refreshed date to element
		updateDateStr(data.current_time);

		
		// Create table
		const table = document.createElement('table');

		// Create table header
		const header = table.createTHead();
		table.setAttribute('class', 'table table-striped');

		//	Create table header row
		const headerRow = header.insertRow();

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
			row.insertCell().innerHTML = flight.lat; // Current latitude
			row.insertCell().innerHTML = flight.lon; // Current longitude
			row.insertCell().innerHTML = flight.alt; // Current altitude
			row.insertCell().innerHTML = flight.gnd_speed; // Current ground speed
			row.insertCell().innerHTML = flight.vert_speed; // Current vertical speed
			row.insertCell().innerHTML = flight.heading; // Current heading
			row.insertCell().innerHTML = flight.timestamp; // Last updated
		});

		
		table_div.appendChild(table);
		setInterval(() => updateDateStr(data.current_time), 3141); // Update last refreshed time every pi seconds
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

		// Create search bar div and add it to the table div
		const search_bar_div = document.createElement('div');
		search_bar_div.setAttribute('id', 'historical-flights-search-bar-div');
		table_div.appendChild(search_bar_div);
		
		// Create search bar and add it to the search bar div
		const searchBar = createSearchBar('historical-flights-search-bar-div', 'historical-flights-table');
		search_bar_div.appendChild(searchBar);

		// Create last refreshed text entry
		const last_refreshed_element = document.createElement('p');
		last_refreshed_element.setAttribute('id', 'last-refreshed-text');
		table_div.appendChild(last_refreshed_element);
		// Check for error
		if (data.current_time !== undefined) {
			const current_time = data.current_time;
		}
		else {
			console.log("Current time could not be parsed from the response. Displaying NaN as last refreshed time.");
			const current_time = NaN;
		}
		updateDateStr(data.current_time);
		setInterval(() => updateDateStr(current_time), 3000); // Update elapsed time every 3 seconds

		// Create table
		const table = document.createElement('table');
		table.setAttribute('class', 'table table-striped');
		// Create header
		const table_header = table.createTHead();
		const header_row = table_header.insertRow();
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
			row.insertCell().innerHTML = flight.max_height_agl;
			row.insertCell().innerHTML = flight.max_gnd_speed;
		});
		table_div.appendChild(table);
	}
	catch (error) {
		console.log('Error:', error);
	}
}

console.log("Creating active flights table");
getActiveFlights();
console.log("Creating historical flights table");
getHistoricalFlights();
