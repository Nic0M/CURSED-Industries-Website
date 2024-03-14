/*
 * Returns the edit distance between two strings
 */
function calc_edit_dist(s1, s2) {
	if (s1 === s2) {
		return 0;
	}
	const n = s1.length;
	const m = s2.length;

	// Use dynamic programming to calculate the edit distance
	// dp[i][j] will store the edit distance between the first i characters of s1 and the first j characters of s2

	// If one of the strings is empty, the edit distance is the length of the other string
	const dp = new Array(n+1).fill(0).map(() => new Array(m+1).fill(0));

	for (let i = 0; i <= n; i++) {
		for (let j = 0; j <= m; j++) {
			// If the first string is empty, the edit distance is the length of the other string
			if (i === 0) {
				dp[i][j] = j;
			}
			// If the other string is empty, the edit distance is the length of the first string
			else if (j === 0) {
				dp[i][j] = i;
			}
			// If the last characters of the two strings are the same, the edit distance is the same as the edit distance between the rest of the strings
			else if (s1[i-1] === s2[j-1]) {
				dp[i][j] = dp[i-1][j-1];
			}
			// Otherwise, the edit distance is 1 plus the minimum of the edit distance between the first string and the rest of the second string,
			// the edit distance between the second string and the rest of the first string,
			// and the edit distance between the rest of the two strings
			else {
				dp[i][j] = 1 + Math.min(dp[i-1][j-1], dp[i-1][j], dp[i][j-1]);
			}
		}
	}
	// Return the edit distance
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
	if (search_value === "") {
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
					edit_dist = calc_edit_dist(search_value, cell_value);
					if (edit_dist < 3) {
						match = true;
					}
					break;
				default:
					if (!case_sensitive) {
						cell_value = cell_value.toLowerCase();
					}
					if (cell_value.includes(search_value)) {
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