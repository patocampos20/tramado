const fs = require('fs');

function repl(file) {
  let c = fs.readFileSync(file, 'utf8');
  
  // Example replacements, I'll just write a script to automatically patch s.project.cells
  // to s.project.layers[s.activeLayerIndex].cells
  c = c.replace(/s\.project\.cells/g, 's.project.layers[s.activeLayerIdx].cells');
  c = c.replace(/project\.cells/g, 'project.layers[useStore.getState().activeLayerIdx].cells');
  c = c.replace(/p\.cells/g, 'p.layers[useStore.getState().activeLayerIdx].cells');
  
  fs.writeFileSync(file, c);
}

// But this is fragile. I will do it carefully using replace_file_content.
