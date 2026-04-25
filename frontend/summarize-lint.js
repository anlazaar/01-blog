const fs = require('fs');
const data = JSON.parse(fs.readFileSync('lint.json', 'utf8'));
for (const file of data) {
  if (file.errorCount > 0 || file.warningCount > 0) {
    console.log(`\nFile: ${file.filePath}`);
    for (const msg of file.messages) {
      console.log(`  Line ${msg.line}: ${msg.message} (${msg.ruleId})`);
    }
  }
}
