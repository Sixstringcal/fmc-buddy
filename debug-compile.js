import fs from 'node:fs';
import { compile } from '@jalvin/compiler';

const file = 'src/views/CubeControlsView.jalvin';
const source = fs.readFileSync(file, 'utf8');
const result = compile(source, file);
if (result.ok) {
    console.log(result.code);
} else {
    console.log(JSON.stringify(result.diagnostics, null, 2));
}
