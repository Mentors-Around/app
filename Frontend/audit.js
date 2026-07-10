import fs from 'fs';
import path from 'path';

function walk(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const stat = fs.statSync(path.join(dir, file));
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== 'dist' && file !== '.git') {
        walk(path.join(dir, file), fileList);
      }
    } else if (file.endsWith('.jsx')) {
      fileList.push(path.join(dir, file));
    }
  }
  return fileList;
}

const files = walk('./src');

const issues = {
  fontAwesome: [],
  deadLinks: [],
  hardcodedImages: [],
  emptyLinks: [],
  placeholderData: [],
  inconsistentRadii: {}
};

for (const file of files) {
  const content = fs.readFileSync(file, 'utf-8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    // 1. FontAwesome classes
    if (line.match(/fa-solid|fa-regular|fas fa-|far fa-|fab fa-/)) {
      issues.fontAwesome.push({ file, line: index + 1, content: line.trim() });
    }
    // 2. Dead Links
    if (line.match(/href=["']#["']/)) {
      issues.deadLinks.push({ file, line: index + 1, content: line.trim() });
    }
    // 3. Hardcoded / External images
    if (line.match(/src=["']https:\/\/(via\.placeholder\.com|randomuser\.me|images\.unsplash\.com)[^"']*["']/)) {
      issues.hardcodedImages.push({ file, line: index + 1, content: line.trim() });
    }
    // 4. Empty links
    if (line.match(/to=["']["']/)) {
      issues.emptyLinks.push({ file, line: index + 1, content: line.trim() });
    }
    // 5. Placeholder text
    if (line.toLowerCase().match(/lorem ipsum/)) {
      issues.placeholderData.push({ file, line: index + 1, content: line.trim() });
    }
    
    // Track radii
    const radiiMatch = line.match(/rounded(-[a-z0-9]+)?/g);
    if (radiiMatch) {
      for (const rm of radiiMatch) {
        issues.inconsistentRadii[rm] = (issues.inconsistentRadii[rm] || 0) + 1;
      }
    }
  });
}

console.log(JSON.stringify({
  summary: {
    scannedFiles: files.length,
    fontAwesomeIssues: issues.fontAwesome.length,
    deadLinks: issues.deadLinks.length,
    hardcodedImages: issues.hardcodedImages.length,
    emptyLinks: issues.emptyLinks.length,
    placeholderData: issues.placeholderData.length
  },
  radiiDistribution: issues.inconsistentRadii
}, null, 2));

// Dump full report to a local json file for reading
fs.writeFileSync('audit_report.json', JSON.stringify(issues, null, 2));
console.log('Detailed report saved to audit_report.json');
