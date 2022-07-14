import {defineConfig} from "vite";
import vue from "@vitejs/plugin-vue";
import tsconfigPaths from "vite-tsconfig-paths";
import {resolve} from "path";
import typescript from "@rollup/plugin-typescript";

// https://vitejs.dev/config/
export default defineConfig({
    resolve: {
        alias: {}
    },
    plugins: [
        vue(),
        typescript({
            "target": "es2020",
            "rootDir": resolve("./src"),
            "declaration": true,
            "declarationDir": resolve("./dist"),
            exclude: resolve("./node_modules/**"),
            allowSyntheticDefaultImports: true
        }),
        tsconfigPaths(),
    ],
    build: {
        target: "modules",
        sourcemap: true,
        lib: {
            entry: resolve(__dirname, "src/index.ts"),
            name: "vue3-flipbook-ts",
            fileName: "flipbook"
        },
        rollupOptions: {
            external: ["vue", "rematrix"],
            output: {
                globals: {
                    vue: "Vue"
                },
                manualChunks: undefined,
            }
        }
    },

});
