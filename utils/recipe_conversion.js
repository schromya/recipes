/**
 * Escape text for safe HTML output.
 * @param {string} value - Raw text value.
 * @returns {string} HTML-safe text.
 */
function escape_html(value) {
	return String(value)
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/\"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

/**
 * Validate a requested row count.
 * @param {number|string} row_count_value - Number of rows occupied by the cell.
 * @returns {number|undefined} Row span count or undefined when invalid.
 */
function get_row_span(row_count_value) {
	const row_count = Number(row_count_value);

	if (!Number.isInteger(row_count) || row_count < 1) {
		return undefined;
	}

	return row_count;
}

/**
 * Build one HTML cell string from compact JSON cell data.
 * @param {object} cell_json - Cell with text/class/span values.
 * @returns {string} HTML td element string.
 */
function build_table_cell(cell_json, row_span_override) {
	const cell_text = escape_html(cell_json.t || "");
	const class_name_value = cell_json.k;
	const col_span_value = cell_json.c;
	const row_span_value = cell_json.r;
	const final_row_span_value = row_span_override || row_span_value;
	const is_merged_cell = row_span_override > 1;

	const class_names = [class_name_value, is_merged_cell ? "merged_cell" : ""].filter(Boolean);
	const class_name = class_names.length ? ` class="${escape_html(class_names.join(" "))}"` : "";
	const col_span = col_span_value ? ` colspan="${Number(col_span_value)}"` : "";
	const row_span = final_row_span_value ? ` rowspan="${Number(final_row_span_value)}"` : "";

	return `<td${class_name}${col_span}${row_span}>${cell_text}</td>`;
}

/**
 * Render a rectangular row/column grid, hiding cells covered by r spans.
 * The r value is the number of rows occupied, including the current row.
 * @param {Array<object|Array>} rows - Recipe rows.
 * @returns {string} HTML row strings.
 */
function build_table_rows(rows) {
	const covered_columns_by_row = rows.map(() => new Set());
	const rendered_rows = rows.map((row_json, row_index) => {
		let column_index = 0;
		const cells_html = [];

		row_json.forEach((cell_json) => {
			const row_count_value = cell_json.r;
			const coverage_row_span = get_row_span(row_count_value);
			const column_span = Number(cell_json.c) || 1;
			const is_covered = covered_columns_by_row[row_index].has(column_index);

			if (is_covered) {
				column_index += column_span;
				return;
			}

			if (coverage_row_span) {
				const last_covered_row = row_index + coverage_row_span - 1;

				for (let covered_row = row_index + 1; covered_row <= last_covered_row && covered_row < rows.length; covered_row += 1) {
					for (let covered_column = column_index; covered_column < column_index + column_span; covered_column += 1) {
						covered_columns_by_row[covered_row].add(covered_column);
					}
				}
			}

			cells_html.push(build_table_cell(cell_json, coverage_row_span));
			column_index += column_span;
		});

		return `<tr>${cells_html.join("")}</tr>`;
	});

	return rendered_rows.join("\n");
}

/**
 * Render recipe JSON as a flow-table HTML block.
 * @param {object} recipe_json - Recipe data using the project recipe schema.
 * @param {object} recipe_type_options - Type names mapped to theme options.
 * @returns {string} HTML table string.
 */
export function recipe_json_to_html_table(recipe_json, recipe_type_options = {}) {
	const { title, source, rows = [], type = "regular" } = recipe_json;
	const type_options = recipe_type_options[type] || recipe_type_options.regular;
	const theme_style = type_options
		? ` style="--recipe-accent:${escape_html(type_options.color)};--recipe-highlight:${escape_html(type_options.highlight)}"`
		: "";
	const rows_html = build_table_rows(rows);
	const source_html = source
		? `<p class="recipe_source">Recipe source: <a href="${escape_html(source)}">${escape_html(source)}</a></p>`
		: "";
	const title_html = title ? `<h2 class="recipe_title">${escape_html(title)}</h2>` : "";

	return `<section class="recipe"${theme_style}>
	${title_html}
	<div class="recipe_table_frame"><table class="recipe_flow_table">
		<tbody>
            ${rows_html}
		</tbody>
	</table></div>
	${source_html}
	</section>`;
}
