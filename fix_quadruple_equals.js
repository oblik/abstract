#!/usr/bin/env node

/**
 * Script to fix critical error where loose equality (==) was incorrectly replaced
 * with quadruple equals (===) instead of triple equals (===)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const TARGET_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx'];
const EXCLUDE_DIRS = ['node_modules', '.git', 'dist', 'build'];
const ROOT_DIR = process.cwd();

// Statistics
let stats = {
  totalFiles: 0,
  affectedFiles: 0,
  totalReplacements: 0,
  filesWithChanges: []
};

/**
 * Check if a directory should be excluded
 */
function shouldExcludeDir(dirPath) {
  const dirName = path.basename(dirPath);
  return EXCLUDE_DIRS.includes(dirName);
}

/**
 * Check if a file should be processed based on its extension
 */
function shouldProcessFile(filePath) {
  const ext = path.extname(filePath);
  return TARGET_EXTENSIONS.includes(ext);
}

/**
 * Process a single file
 */
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Count occurrences of "==="
    const quadrupleEqualsCount = (content.match(/===/g) || []).length;
    
    if (quadrupleEqualsCount === 0) {
      return;
    }
    
    const fixedContent = content.replace(/===/g, '===');
    
    if (fixedContent !== originalContent) {
      fs.writeFileSync(filePath, fixedContent, 'utf8');
      
      const tripleEqualsCount = (fixedContent.match(/===/g) || []).length;
      const replacementsMade = quadrupleEqualsCount;
      
      stats.affectedFiles++;
      stats.totalReplacements += replacementsMade;
      stats.filesWithChanges.push({
        file: filePath,
        replacements: replacementsMade,
        quadrupleEquals: quadrupleEqualsCount,
        tripleEquals: tripleEqualsCount
      });
      
      console.log(`✅ Fixed: ${filePath} (${replacementsMade} replacements)`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

/**
 * Recursively scan directory
 */
function scanDirectory(dirPath) {
  try {
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory()) {
        if (!shouldExcludeDir(itemPath)) {
          scanDirectory(itemPath);
        }
      } else if (stat.isFile() && shouldProcessFile(itemPath)) {
        stats.totalFiles++;
        processFile(itemPath);
      }
    }
  } catch (error) {
    console.error(`❌ Error scanning directory ${dirPath}:`, error.message);
  }
}

/**
 * Main function
 */
function main() {
  console.log('🔧 Starting fix for quadruple equals (===) issue...\n');
  
  const startTime = Date.now();
  
  // Scan the entire codebase
  scanDirectory(ROOT_DIR);
  
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  // Generate report

  console.log('=' .repeat(50));




  if (stats.filesWithChanges.length > 0) {

    console.log('-'.repeat(50));
    
    stats.filesWithChanges.forEach(change => {
      const relativePath = path.relative(ROOT_DIR, change.file);





    });
  } else {
    console.log('✅ No quadruple equals (===) found in the codebase.');
  }

  // Return exit code based on whether changes were made
  process.exit(stats.totalReplacements > 0 ? 0 : 1);
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  processFile,
  scanDirectory,
  stats
};