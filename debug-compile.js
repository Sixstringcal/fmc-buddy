import fs from 'node:fs';
import { lex, Parser } from '/Users/calvinnielson/jalvin/packages/compiler/dist/index.js';
import { DiagnosticBag } from '/Users/calvinnielson/jalvin/packages/compiler/dist/diagnostics.js';

const source = fs.readFileSync('src/views/RotationButtonsView.jalvin', 'utf8');
const file = 'src/views/RotationButtonsView.jalvin';

try {
  const diag = new DiagnosticBag();
  const tokens = lex(source, file, diag);
  const parser = new Parser(tokens, file, diag, source);
  
  let count = 0;
  const oldAdvance = parser.advance.bind(parser);
  parser.advance = () => {
    count++;
    const tok = oldAdvance();
    if (count % 100 === 0) {
        console.log(`[${count}] Adv to Pos ${parser.pos-1}: ${tok.kind} at ${tok.span.startLine}:${tok.span.startCol}`);
    }
    if (count > 5000) throw new Error('Infinite loop');
    return tok;
  };

  parser.parseProgram();
  console.log('Done');
} catch (e) {
  console.error('Stop:', e.message);
}
