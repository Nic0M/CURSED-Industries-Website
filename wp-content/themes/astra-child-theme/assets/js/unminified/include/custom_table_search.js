goog.module('custom_table_search');

/*
 * Returns the longest common subsequence between two strings
 */
function calc_lcs(s1, s2) {
	// Create a 2D array to store the length of the longest common subsequence between every substring of s1 and s2
	const n = s1.length;
	const m = s2.length;
	let dp = new Array(n+1);
	for (let i = 0; i < n+1; i++) {
		dp[i] = new Array(m+1);
	}

	// Loop through every substring of s1 and s2
	for (let i = 0; i < n+1; i++) {
		for (let j = 0; j < m+1; j++) {
			// If one of the strings is empty, the length of the longest common subsequence is 0
			if (i === 0 || j === 0) {
				dp[i][j] = 0;
			} else if (s1[i-1] === s2[j-1]) {
				// If the characters match, the length of the longest common subsequence is 1 + the length of the longest common subsequence between the previous characters
				dp[i][j] = 1 + dp[i-1][j-1];
			} else {
				// If the characters don't match, the length of the longest common subsequence is the maximum of the length of the longest common subsequence between the previous character of s1 and s2, and the length of the longest common subsequence between the current character of s1 and the previous character of s2
				dp[i][j] = Math.max(dp[i-1][j], dp[i][j-1]);
			}
		}
	}

	// The length of the longest common subsequence between s1 and s2 is stored in dp[n][m]
	return dp[n][m];
}

function search_table(search_bar_id, table_id, columns, case_sensitive=false) {
	const search_bar = document.getElementById(search_bar_id)
	if (!search_bar) {
		console.error(`No search bar with id ${search_bar_id}`);
		return;
	}
	const table = document.getElementById(table_id);
	if (!table) {
		console.error(`No table with id ${table_id}`);
		return;
	}
	let search_value = search_bar.value;
	// If search bar is empty, show all rows
	if (search_value === "") {
		const rows = table.getElementsByTagName("tr");
		for (let i = 1; i < rows.length; i++) {
			rows[i].style.display = "";
		}
		return;
	}
	if (!case_sensitive) {
		search_value = search_value.toLowerCase();
	}
	const rows = table.getElementsByTagName("tr");
	if (rows.length < 1) {
		console.error("Table has no header row");
		return;
	}
	const header_row = rows[0];
	for (let i = 1; i < rows.length; i++) { // skip the header row (i=0)
		const cells = rows[i].getElementsByTagName("td");
		let match = false;
		for (let j = 0; j < columns.length; j++) {
			if (j >= header_row.cells.length) {
				console.error(`Column index ${columns[j]} out of range`);
				continue;
			}
			let cell_value = cells[columns[j]].innerText;
			switch (header_row.cells[columns[j]].innerText) {
				case "Unique ID":
					if (!case_sensitive) {
						cell_value = cell_value.toLowerCase();
					}
					let lcs = calc_lcs(search_value, cell_value);
					if (Math.abs(lcs - search_value.length) < 3) {
						match = true;
						console.log(`Match found: ${search_value} and ${cell_value}`);
					}
					else {
						console.log(`No match: ${search_value} and ${cell_value}`);
					}
					break;
				default:
					if (!case_sensitive) {
						cell_value = cell_value.toLowerCase();
					}
					if (cell_value.includes(search_value)) {
						console.log(`Default match found: ${search_value} and ${cell_value}`);
						match = true;
					}
			}
			// If match found, no need to check other columns
			if (match) {
				rows[i].style.display = "";
				break;
			}
		}
		// Hide row if no match
		if (!match) {
			rows[i].style.display = "none";
		}
	}
}
exports = {search_table};