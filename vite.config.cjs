const { defineConfig } = require("vite");
const react = require("@vitejs/plugin-react");
const jalvin = require("@jalvin/vite-plugin");
const path = require("path");

module.exports = defineConfig({
  plugins: [
    (jalvin.default || jalvin)(),
    react(),
  ],
  resolve: {
    alias: {
      src: path.resolve(__dirname, "src"),
    },
    extensions: [".ts", ".tsx", ".js", ".jsx", ".jalvin"],
  },
  server: {
    port: 1234,
  },
  build: {
    target: "esnext",
  },
  worker: {
    format: "es",
  },
});
