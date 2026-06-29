/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: "class",
    content: [
        "./popup.tsx",
        "./tabs/**/*.tsx",
        "./components/**/*.tsx"
    ],
    theme: {
        extend: {},
    },
    plugins: [],
}