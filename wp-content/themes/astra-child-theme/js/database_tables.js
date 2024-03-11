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
 * Create search bar
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

	// Add search bar to search bar div
	search_div.appendChild(search_bar);
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
		createSearchBar('active-flights-search-bar-div', 'active-flights-table');

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

// async function getHistoricalFlights() {
// 	try {
// 		const response = await fetch('https://cursedindustries.com/wp-json/drones/v1/historical-flights');
// 		const data = await response.json();
// 		console.log(data);
// 	}
// 	catch (error) {
// 		console.log('Error:', error);
// 	}
// }

console.log("Creating active flights table");
getActiveFlights();
