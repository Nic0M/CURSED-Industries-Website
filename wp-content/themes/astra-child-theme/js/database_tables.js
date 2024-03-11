async function getActiveFlights() {
	try {
		// Fetch active flights
		const response = await fetch('https://cursedindustries.com/wp-json/drones/v1/active-flights');
		const data = await response.json();
		console.log(data);

		// Create table
		const table = document.getElementById('active-flights-table');
		table.innerHTML = ''; // Clear table

		// Create table header
		const header = table.createTHead();

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
		data.forEach(flight => {
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