import { recipe_json_to_html_table } from "./utils/recipe_conversion.js";

const RECIPE_FILE_PATHS = [
	"recipes/ground_beef_and_potatoes_recipe.json",
	"recipes/guacamole.json",
	"recipes/espresso_brownie_recipe.json",
];

// Add future recipe types here; recipes reference them through their "type" field.
const RECIPE_TYPES = {
	"one-pot": { label: "One-pot", color: "#7651a8", highlight: "#eee5f8" },
	"regular": { label: "Regular", color: "#2f7f3e", highlight: "#eefad0" }
};

function build_recipe_type_key() {
	const items_html = Object.values(RECIPE_TYPES).map((options) =>
		`<li><span class="recipe_type_swatch" style="--type-color: ${options.color}"></span>${options.label}</li>`
	).join("");

	return `<aside class="recipe_type_key" aria-label="Recipe type key">
		<h2>Recipe type</h2>
		<ul>${items_html}</ul>
	</aside>`;
}

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
		const recipe_json_list = await Promise.all(RECIPE_FILE_PATHS.map(async (recipe_file_path) => {
			const response = await fetch(recipe_file_path);

			if (!response.ok) {
				throw new Error(`Could not load ${recipe_file_path}: ${response.status}`);
			}

			return response.json();
		}));

		const recipes_html = recipe_json_list
			.map((recipe_json) => recipe_json_to_html_table(recipe_json, RECIPE_TYPES))
			.join("\n");
		app_element.innerHTML = `<div class="recipe_list">${recipes_html}</div>${build_recipe_type_key()}`;
		app_element.addEventListener("click", (event) => {
			const recipe_link = event.target.closest(".recipe_link");

			if (recipe_link) {
				navigator.clipboard?.writeText(recipe_link.href).catch(() => {});
			}
		});

		if (location.hash) {
			document.getElementById(location.hash.slice(1))?.scrollIntoView();
		}
	} catch (error) {
		render_error(app_element, `Could not load recipe: ${error.message}`);
	}
}

initialize_recipe_view();
