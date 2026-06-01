const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      if (file !== 'node_modules') {
          filelist = walkSync(dirFile, filelist);
      }
    } else if (dirFile.endsWith('.js') || dirFile.endsWith('.jsx')) {
      filelist.push(dirFile);
    }
  });
  return filelist;
};

const files = walkSync('frontend/src');
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let newContent = content.replace(/http:\/\/localhost:3000/g, '${API_BASE}');
  
  // Some files might not have API_BASE defined, so we inject it if needed
  if (newContent !== content) {
      if (!newContent.includes('const API_BASE =')) {
          // If we replaced something with API_BASE but it's not defined, define it
          newContent = "const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:7000';\n" + newContent;
      }
      fs.writeFileSync(file, newContent, 'utf8');
      console.log('Fixed', file);
  }
});
