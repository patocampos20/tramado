const fs = require('fs');
const glob = require('glob');

function refactorFile(path) {
  let content = fs.readFileSync(path, 'utf8');
  // We won't just blindly replace.
  // Actually, I'll do this manually using multi_replace_file_content to be safe, but a script might be faster for simple replacements.
}
