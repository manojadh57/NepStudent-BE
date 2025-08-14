const adjectives = ["nep", "everest", "yeti", "gaurav", "sun", "himal"];
const animals = ["panther", "eagle", "lion", "tiger", "bear", "rhino"];

export function generateUsername() {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const ani = animals[Math.floor(Math.random() * animals.length)];
  const num = Math.floor(Math.random() * 10000);
  return `${adj}-${ani}-${num}`;
}
