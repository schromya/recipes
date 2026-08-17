const recipe_file_paths = [
	"recipes/espresso_brownie_recipe.json"
];

/**
 * Render an error message in the app mount element.
 * @param {HTMLElement} app_element - Root mount node.
 * @param {string} message - Error text to display.
 * @returns {void}
 */
function render_error(app_element, message) {
	app_element.innerHTML = `<p class="error_message">${message}</p>`;
}

/**
 * Fetch recipe JSON and render it as a flow-style table.
 * @returns {Promise<void>}
 */
async function initialize_recipe_view() {
	const app_element = document.getElementById("app");

	if (!app_element) {
		return;
	}

	try {
		if (typeof recipe_json_to_html_table !== "function") {
			throw new Error("recipe_json_to_html_table is unavailable.");
		}

		const recipe_json_list = await Promise.all(recipe_file_paths.map(async (recipe_file_path) => {
			const response = await fetch(recipe_file_path);

			if (!response.ok) {
				throw new Error(`Could not load ${recipe_file_path}: ${response.status}`);
			}

			return response.json();
		}));

		app_element.innerHTML = recipe_json_list
			.map(recipe_json_to_html_table)
			.join("\n");
	} catch (error) {
		render_error(app_element, `Could not load recipe: ${error.message}`);
	}
}

initialize_recipe_view();
