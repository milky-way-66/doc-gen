#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const args = process.argv.slice(2);
const command = args[0];
let targetDirArg = '.';

if (command === 'init') {
  targetDirArg = args[1] || '.';
} else if (command === '--help' || command === '-h') {
  console.log(`
Usage: doc-writer init [target-directory]

Options:
  init       Install the AI skill into the target directory (default: current directory)
  --help     Show this help message
  `);
  process.exit(0);
} else {
  // If no init command but arguments provided, assume the first argument is the target directory for backward compatibility
  targetDirArg = args[0] || '.';
}

const targetDir = path.resolve(process.cwd(), targetDirArg);
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

function doCopy() {
  console.log(`\nInstalling doc-writer skills into ${targetDir}...`);
  
  directoriesToCopy.forEach(dir => {
    const sourceDir = path.join(packageDir, dir);
    const destinationDir = path.join(targetDir, dir);

    if (fs.existsSync(sourceDir)) {
      console.log(`Copying ${dir}...`);
      copyFolderRecursiveSync(sourceDir, destinationDir);
    }
  });
  
  console.log('\n✅ Installation complete! You can now use the doc-writer skill in your IDE.');
}

// Check for existing directories
const existingDirs = directoriesToCopy.filter(dir => fs.existsSync(path.join(targetDir, dir)));

if (existingDirs.length > 0) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log(`\n⚠️  The following directories already exist in the target path:`);
  existingDirs.forEach(d => console.log(`   - ${d}`));
  console.log(`\nOverwriting may destroy custom templates or settings you have modified.`);
  
  rl.question('Are you sure you want to overwrite them? (y/N) ', (answer) => {
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      doCopy();
    } else {
      console.log('\nInstallation cancelled. No files were modified.');
    }
    rl.close();
  });
} else {
  doCopy();
}
