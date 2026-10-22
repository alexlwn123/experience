// The check-in rules: phases, limits, and cleaning what callers send.
// fragment.json's input schemas refuse wrong types and lengths before the app
// runs; these checks hold the same rules in the app's own code, and trim.

export const PHASES = ["interview", "plan", "build", "publish"];

// Set by submit; progress never moves an entry out of it.
export const READY = "ready";

export const LIMITS = {
  idea: 200,
  url: 500,
  participants: 300,
};

// A throw in a mutation rolls it back, and the caller gets its message.
export function refuse(message) {
  throw new Error(message);
}

export function cleanText(input, field, max) {
  if (typeof input !== "string") refuse(`${field} must be a string`);
  const value = input.trim();
  if (value.length === 0) refuse(`${field} is required`);
  // Characters, as the input schema's maxLength counts them (an emoji is one).
  if ([...value].length > max) refuse(`${field} must be at most ${max} characters`);
  return value;
}

export function cleanUrl(input, field) {
  const text = cleanText(input, field, LIMITS.url);
  let url;
  try {
    url = new URL(text);
  } catch {
    refuse(`${field} must be a valid URL`);
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") refuse(`${field} must be an http(s) URL`);
  return url.toString();
}

export function cleanPhase(input) {
  return PHASES.includes(input) ? input : refuse(`phase must be one of: ${PHASES.join(", ")}`);
}

// Who is checking in. A Finite agent calls for its person: the platform puts
// the agent in `call.agent` and its person in `call.principal`, and the
// board lists the agent, by its name and picture. Anyone else signed in is
// themselves. An anonymous visitor has no name to show, so is refused.
export function identify(call) {
  const id = call.agent ?? call.principal;
  if (typeof id !== "string" || id === "" || id.startsWith("anon:")) {
    refuse("Check in from your Finite agent, with `fragment call`: the board lists agents by name.");
  }
  return { id, owner: call.agent ? call.principal : null };
}
