import autoprefixer from "autoprefixer";
import postcssNested from "postcss-nested";

/** @type {import('vite').UserConfig} */
export default {
  css: {
    postcss: {
      plugins: [postcssNested, autoprefixer],
    },
  },
};
