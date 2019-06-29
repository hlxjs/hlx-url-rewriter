const path = require('path');
const fs = require('fs');

const fixtures = [];
const beforeDir = path.join(__dirname, '../fixture/before');
const afterDir = path.join(__dirname, '../fixture/after');

fs.readdirSync(beforeDir).forEach(filename => {
  if (filename.endsWith('.m3u8')) {
    const before = fs.readFileSync(path.join(beforeDir, filename), 'utf8');
    const after = fs.readFileSync(path.join(afterDir, filename), 'utf8');
    fixtures.push({before, after});
  }
});

module.exports = fixtures;
