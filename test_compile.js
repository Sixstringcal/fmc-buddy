const compiler = require("@jalvin/compiler");
const fs = require("node:fs");
const path = require("node:path");

const filePath = "src/index.jalvin";
const code = fs.readFileSync(filePath, "utf-8");

console.log(`Compiling ${filePath}...`);
try {
    const result = compiler.compile(code, filePath, {
        emitTypes: false,
        runtimeImport: "@jalvin/runtime",
        sourceRoot: process.cwd(),
    });
    if (result.ok) {
        console.log("Success!");
        console.log(result.code);
    } else {
        console.error("Compilation failed:");
        console.error(JSON.stringify(result.diagnostics, null, 2));
    }
} catch (e) {
    console.error("Crash during compilation!");
    console.error(e);
}
