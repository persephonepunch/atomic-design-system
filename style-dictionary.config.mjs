// Style Dictionary build: tokens/*.json -> CSS custom properties + JS constants.
// All tokens are emitted with the `--pim-*` / `Pim*` prefix so they match the
// names the storefront components (and Webflow Variables) already reference.
//   npm run build:tokens
export default {
  source: ["tokens/**/*.json"],
  platforms: {
    css: {
      transformGroup: "css",
      prefix: "pim",
      buildPath: "src/generated/",
      files: [
        {
          destination: "tokens.css",
          format: "css/variables",
          options: { outputReferences: true },
        },
      ],
    },
    js: {
      transformGroup: "js",
      prefix: "pim",
      buildPath: "src/generated/",
      files: [{ destination: "tokens.js", format: "javascript/es6" }],
    },
  },
};
