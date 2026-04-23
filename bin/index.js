#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const targetDir = process.cwd();
const packageDir = path.join(__dirname, '..');

const directoriesToCopy = [
  '.cursor',
  '.claude',
  '.source-investigator'
];

function copyFolderRecursiveSync(source, target) {
  if (!fs.existsSync(source)) {
    return;
  }

  // Check if target exists; if not, create it
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }

  // Get all items in the source folder
  const items = fs.readdirSync(source);

  items.forEach(item => {
    const sourcePath = path.join(source, item);
    const targetPath = path.join(target, item);

    // Check if the current item is a directory
    if (fs.lstatSync(sourcePath).isDirectory()) {
      copyFolderRecursiveSync(sourcePath, targetPath);
    } else {
      // Copy the file
      fs.copyFileSync(sourcePath, targetPath);
    }
  });
}

console.log('Installing gen-doc skills into your project...');

directoriesToCopy.forEach(dir => {
  const sourceDir = path.join(packageDir, dir);
  const destinationDir = path.join(targetDir, dir);

  if (fs.existsSync(sourceDir)) {
    console.log(`Copying ${dir}...`);
    copyFolderRecursiveSync(sourceDir, destinationDir);
  }
});

console.log('✅ Installation complete! You can now use the gen-doc skill in your IDE.');
