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
 * Convert a recipe title into a stable URL fragment.
 * @param {string} title - Recipe title.
 * @returns {string} URL-safe fragment identifier.
 */
function title_to_id(title) {
	return String(title)
		.normalize("NFKD")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "");
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
 * @param {number|undefined} row_span_override - Validated row span.
 * @returns {string} HTML td element string.
 */
function build_table_cell(cell_json, row_span_override) {
	const { t = "", k, c, r } = cell_json;
	const class_name = k ? ` class="${escape_html(k)}"` : "";
	const col_span = c ? ` colspan="${Number(c)}"` : "";
	const row_span = row_span_override || r;
	const row_span_attribute = row_span ? ` rowspan="${Number(row_span)}"` : "";

	return `<td${class_name}${col_span}${row_span_attribute}>${escape_html(t)}</td>`;
}

/**
 * Render column-oriented recipe data, hiding positions covered by spans.
 * The r value is the number of rows occupied, including the current row.
 * @param {Array<Array<object|null>>} columns - Recipe columns.
 * @returns {string} HTML row strings.
 */
function build_table_rows(columns) {
	const row_count = Math.max(0, ...columns.map((column) => column.length));
	const covered_columns_by_row = Array.from({ length: row_count }, () => new Set());

	return Array.from({ length: row_count }, (_, row_index) => {
		const cells_html = [];

		for (let column_index = 0; column_index < columns.length;) {
			if (covered_columns_by_row[row_index].has(column_index)) {
				column_index += 1;
				continue;
			}

			const cell_json = columns[column_index][row_index];

			if (!cell_json) {
				column_index += 1;
				continue;
			}

			const row_count_value = cell_json.r;
			const coverage_row_span = get_row_span(row_count_value);
			const column_span = Number(cell_json.c) || 1;

			if (coverage_row_span) {
				const last_covered_row = row_index + coverage_row_span - 1;

				for (let covered_row = row_index + 1; covered_row <= last_covered_row && covered_row < row_count; covered_row += 1) {
					for (let covered_column = column_index; covered_column < column_index + column_span; covered_column += 1) {
						covered_columns_by_row[covered_row].add(covered_column);
					}
				}
			}

			cells_html.push(build_table_cell(cell_json, coverage_row_span));
			column_index += column_span;
		}

		return `<tr>${cells_html.join("")}</tr>`;
	}).join("\n");
}

/**
 * Render recipe JSON as a flow-table HTML block.
 * @param {object} recipe_json - Recipe data using the project recipe schema.
 * @param {object} recipe_type_options - Type names mapped to theme options.
 * @returns {string} HTML table string.
 */
export function recipe_json_to_html_table(recipe_json, recipe_type_options = {}) {
	const { title, source, columns = [], type = "regular" } = recipe_json;
	const type_options = recipe_type_options[type] || recipe_type_options.regular;
	const theme_style = type_options
		? ` style="--recipe-accent:${escape_html(type_options.color)};--recipe-highlight:${escape_html(type_options.highlight)}"`
		: "";
	const rows_html = build_table_rows(columns);
	const source_content = /^https?:\/\//.test(source)
		? `<a href="${escape_html(source)}">${escape_html(source)}</a>`
		: escape_html(source || "");
	const source_html = source ? `<p class="recipe_source">Recipe source: ${source_content}</p>` : "";
	const recipe_id = title_to_id(title || "recipe");
	const title_html = title
		? `<h2 class="recipe_title">${escape_html(title)} <a class="recipe_link" href="#${recipe_id}" aria-label="Copy link to ${escape_html(title)}"><img src="assets/link.svg" alt=""></a></h2>`
		: "";

	return `<section class="recipe" id="${recipe_id}"${theme_style}>
	${title_html}
	<div class="recipe_table_frame"><table class="recipe_flow_table">
		<tbody>
            ${rows_html}
		</tbody>
	</table></div>
	${source_html}
	</section>`;
}
