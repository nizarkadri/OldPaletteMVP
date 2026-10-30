/**
 * analyzeScreenshot
 * -----------------
 * Sends a UI screenshot to MiniMax M3 via OpenRouter and asks it to:
 *  1. Recreate the screenshot as a simplified, static HTML/CSS replica
 *     (no JS, no real data fetching — just markup + inline classes)
 *  2. Return a flat list of "colorable elements" it identified, each with
 *     - a unique id (used as a CSS class on the recreated HTML)
 *     - a human-readable label (shown in the kanban UI)
 *     - a best-guess role: "primary" | "secondary" | "accent"
 *     - a sampled hex color representing that element's current color
 *
 * The HTML returned MUST use the element ids as class names so the
 * frontend can later target `.${id}` with CSS variables for recoloring.
 *
 * This is the ONE paid AI call in the whole app. Everything downstream
 * (kanban drag/drop, hover highlight, Space-cycling palettes) is pure
 * client-side CSS variable swapping with zero further API calls.
 */

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || ""} ;

const SYSTEM_PROMPT = `You are a UI design analysis tool. You will be shown a screenshot of an app or website.

Your job has two parts:

PART 1 — Recreate the UI as simplified static HTML.
- Use plain HTML + inline "class" attributes only (no <script>, no external resources, no real images — use colored divs/placeholders for avatars/icons).
- Keep the layout structure recognizable (same rough positions/sizes/hierarchy as the screenshot) but DO NOT try to be pixel-perfect. Simplify decorative details.
- For repeated elements (e.g. multiple post cards, multiple list rows, multiple icon chips), give them the SAME class name so they can be recolored as a group.
- Use semantic, descriptive class names (e.g. "nav-bar", "post-card", "avatar", "cta-button", "heading-text", "body-text", "icon-chip").
- All elements that should be recolorable MUST have one of the classes listed in PART 2's "id" field.
- Wrap the whole thing in a single root <div class="ui-root">.
- Use inline style ONLY for layout (flexbox, sizing, spacing, position). DO NOT hardcode colors in inline styles — colors will be applied via CSS variables based on the class name, using the mapping you provide in PART 2.
- For text elements, set color via the class alone (no inline color).

PART 2 — Return a flat JSON array of "colorable elements" you used as class names.
For each one, return:
- "id": the exact class name used in the HTML (string, kebab-case, must match PART 1 exactly)
- "label": a short human-readable label for a UI list, e.g. "Post cards", "Avatars", "CTA buttons" (string)
- "role": your best guess at "primary" | "secondary" | "accent" based on standard UI conventions:
   - "primary": large background/structural areas (page background, nav bars, tab bars)
   - "secondary": surface elements that sit on top of primary (cards, panels, input fields, badges, muted text)
   - "accent": small high-emphasis interactive or brand elements (buttons, links, icons, highlighted text, avatars, brand marks)
- "swatch": the approximate hex color (string, e.g. "#1a1a2e") this element currently has in the screenshot — sample the dominant color for that element/class

Respond with ONLY a single raw JSON object, no markdown fences, no explanation, in this exact shape:

{
  "html": "<div class=\\"ui-root\\">...</div>",
  "elements": [
    {"id": "nav-bar", "label": "Nav bar", "role": "primary", "swatch": "#0d0d14"},
    ...
  ]
}

Keep the element list focused — typically 6 to 14 entries covering: page/app background, nav/tab bars, cards/surfaces, primary text, secondary/muted text, buttons, avatars, icons, badges, and any brand-colored elements. Don't list every single text node separately — group by visual role.`;

/**
 * @param {string} base64Image - base64-encoded image data (no data: prefix)
 * @param {string} mediaType - e.g. "image/png" or "image/jpeg"
 * @returns {Promise<{html: string, elements: Array<{id:string,label:string,role:string,swatch:string}>}>}
 */
export async function analyzeScreenshot(base64Image, mediaType = "image/png") {
	const response = await fetch(
		"https://openrouter.ai/api/v1/chat/completions",
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${OPENROUTER_API_KEY}`,
			},
			body: JSON.stringify({
				model: "anthropic/claude-sonnet-4.6",
				max_tokens: 4000,
				messages: [
					{
						role: "system",
						content: SYSTEM_PROMPT,
					},
					{
						role: "user",
						content: [
							{
								type: "text",
								text: "Analyze this UI screenshot and respond with the JSON object described in your instructions.",
							},
							{
								type: "image_url",
								image_url: { url: `data:${mediaType};base64,${base64Image}` },
							},
						],
					},
				],
			}),
		},
	);

	if (!response.ok) {
		throw new Error(`API error: ${response.status}`);
	}

	const data = await response.json();
	const text = data.choices?.[0]?.message?.content;
	if (!text) throw new Error("No text response from model");

	const cleaned = text
		.trim()
		.replace(/^```json\s*|^```\s*|```$/g, "")
		.trim();

	let parsed;
	try {
		parsed = JSON.parse(cleaned);
	} catch (e) {
		throw new Error("Failed to parse model response as JSON: " + e.message);
	}

	if (!parsed.html || !Array.isArray(parsed.elements)) {
		throw new Error(
			'Model response missing required "html" or "elements" fields',
		);
	}

	// Ensure every element has a valid role, default to "secondary"
	parsed.elements = parsed.elements.map((el) => ({
		id: el.id,
		label: el.label || el.id,
		role: ["primary", "secondary", "accent"].includes(el.role)
			? el.role
			: "secondary",
		swatch: /^#[0-9a-fA-F]{6}$/.test(el.swatch) ? el.swatch : "#888888",
	}));

	return parsed;
}

/**
 * Helper: convert a File object to a base64 string (no data: prefix)
 */
export function fileToBase64(file) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
			const result = reader.result;
			const base64 = result.split(",")[1];
			resolve(base64);
		};
		reader.onerror = reject;
		reader.readAsDataURL(file);
	});
}
