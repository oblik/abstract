#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
  extensions: ['.js', '.jsx', '.ts', '.tsx'],
  excludeDirs: ['node_modules', '.git', 'dist', 'build', '.next', 'out'],
  preservePatterns: [
    '/\\*\\*.*?\\*/', // JSDoc comments
    '//\\s*@', // Annotations
    '/\\*\\s*license.*?\\*/', // License headers
    '//\\s*license', // Single line license comments
  ],
  codePatterns: [
    '\\b(?:function|const|let|var|if|else|for|while|do|switch|case|break|continue|return|throw|try|catch|finally|class|interface|type|import|export|default|async|await)\\b',
    '\\b(?:console\\.log|console\\.error|console\\.warn|console\\.debug)\\b',
    '\\b(?:document\\.getElementById|document\\.querySelector|document\\.createElement)\\b',
    '\\b(?:window\\.|global\\.|process\\.|require\\(|import\\()\\b',
    '\\b(?:useState|useEffect|useContext|useReducer|useMemo|useCallback|useRef)\\b',
    '\\b(?:fetch|axios|XMLHttpRequest|ajax)\\b',
    '\\{.*\\}', // Object literals
    '\\[.*\\]', // Array literals
    '\\(.*\\)', // Function calls
    '\\=\\s*(?:true|false|null|undefined|\\d+|["\'][^"\']*["\'])', // Assignments
    '\\+\\+|--', // Increment/decrement
    '\\+=|-=|\\*=|\\/=|%=', // Compound assignments
  ]
};

class CommentCleaner {
  constructor() {
    this.stats = {
      filesProcessed: 0,
      filesModified: 0,
      commentsRemoved: 0,
      singleLineRemoved: 0,
      multiLineRemoved: 0,
      jsdocPreserved: 0,
      todoPreserved: 0,
      errors: 0
    };
  }

  shouldExclude(filePath) {
    const pathParts = filePath.split(path.sep);
    return CONFIG.excludeDirs.some(dir => pathParts.includes(dir));
  }

  shouldProcessFile(filePath) {
    const ext = path.extname(filePath);
    return CONFIG.extensions.includes(ext) && !this.shouldExclude(filePath);
  }

  // Find all relevant files in the project
  findFiles(startDir) {
    const files = [];
    
    const scanDir = (dir) => {
      const items = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const item of items) {
        const fullPath = path.join(dir, item.name);
        
        if (item.isDirectory()) {
          if (!this.shouldExclude(fullPath)) {
            scanDir(fullPath);
          }
        } else if (this.shouldProcessFile(fullPath)) {
          files.push(fullPath);
        }
      }
    };
    
    scanDir(startDir);
    return files;
  }

  containsCodePatterns(comment) {
    // Remove comment markers and whitespace
    const cleanComment = comment
      .replace(/^\/\*+|\*+\/$/g, '')
      .replace(/^\/\/\s?/gm, '')
      .replace(/^\s*\*\s?/gm, '')
      .trim();
    
    if (!cleanComment) return false;
    
    if (cleanComment.match(/^@\w+/)) return false;
    
    if (cleanComment.match(/^(TODO|FIXME|NOTE|BUG|HACK):/i)) return false;
    
    if (cleanComment.match(/^[A-Z][a-z].*[.!?]$/)) return false;
    
    for (const pattern of CONFIG.codePatterns) {
      if (cleanComment.match(new RegExp(pattern, 'g'))) {
        return true;
      }
    }
    
    const lines = cleanComment.split('\n').filter(line => line.trim());
    if (lines.length > 2) {
      const codeLikeLines = lines.filter(line => {
        return line.match(/^[a-zA-Z_$][a-zA-Z0-9_$]*\s*[:=]/) || // variable declarations
               line.match(/\b(if|else|for|while|do|switch|case|break|continue|return|throw|try|catch|finally)\b/) || // control structures
line.match(/\b(function|class|interface|type)\b/) ||
               line.match(/[{}[\]()]/); // brackets and parentheses
      });
      
      if (codeLikeLines.length > lines.length * 0.5) {
        return true;
      }
    }
    
    return false;
  }

  // Process single line comments
  processSingleLineComments(content) {
    const lines = content.split('\n');
    const result = [];
    let removedCount = 0;
    
    for (const line of lines) {
      const singleLineCommentMatch = line.match(/^(.*?)\/\/(.*)$/);
      
      if (singleLineCommentMatch) {
        const [_, beforeComment, comment] = singleLineCommentMatch;
        const trimmedComment = comment.trim();
        
        if (trimmedComment.match(/^(TODO|FIXME|NOTE|BUG|HACK):/i) ||
            trimmedComment.match(/^@/) ||
            trimmedComment.match(/^license/i)) {
          result.push(line);
          continue;
        }
        
        if (this.containsCodePatterns(trimmedComment)) {
          // If there's code before the comment, keep the code part
          if (beforeComment.trim()) {
            result.push(beforeComment.trim());
          }
          removedCount++;
          this.stats.todoPreserved++;
          continue;
        }
      }
      
      result.push(line);
    }
    
    return {
      content: result.join('\n'),
      removedCount
    };
  }

  // Process multi-line comments
  processMultiLineComments(content) {
    let result = content;
    let removedCount = 0;
    
    // Find all multi-line comments
    const commentRegex = /\/\*[\s\S]*?\*\//g;
    const comments = [];
    let match;
    
    while ((match = commentRegex.exec(content)) !== null) {
      comments.push({
        text: match[0],
        start: match.index,
        end: match.index + match[0].length
      });
    }
    
    // Process comments from end to start to avoid index issues
    for (let i = comments.length - 1; i >= 0; i--) {
      const comment = comments[i];
      
      // Skip JSDoc comments
      if (comment.text.match(/^\/\*\*.*\*\/$/s)) {
        this.stats.jsdocPreserved++;
        continue;
      }
      
      // Skip license comments
      if (comment.text.match(/\/\*\s*license.*?\*\//is)) {
        continue;
      }
      
      if (this.containsCodePatterns(comment.text)) {
        // Remove the comment
        result = result.substring(0, comment.start) + result.substring(comment.end);
        removedCount++;
        this.stats.multiLineRemoved++;
      }
    }
    
    return {
      content: result,
      removedCount
    };
  }

  // Process a single file
  processFile(filePath) {
    try {
      const originalContent = fs.readFileSync(filePath, 'utf8');
      let content = originalContent;
      let totalRemoved = 0;
      
      // Process multi-line comments first
      const multiLineResult = this.processMultiLineComments(content);
      content = multiLineResult.content;
      totalRemoved += multiLineResult.removedCount;
      
      // Process single-line comments
      const singleLineResult = this.processSingleLineComments(content);
      content = singleLineResult.content;
      totalRemoved += singleLineResult.removedCount;
      
      if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        this.stats.filesModified++;
        this.stats.commentsRemoved += totalRemoved;
        
        console.log(`✓ Modified: ${filePath} (${totalRemoved} comments removed)`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error(`✗ Error processing ${filePath}: ${error.message}`);
      this.stats.errors++;
      return false;
    }
  }

  // Generate report
  generateReport() {
    console.log('\n=== Comment Cleanup Report ===');
    console.log(`Files processed: ${this.stats.filesProcessed}`);
    console.log(`Files modified: ${this.stats.filesModified}`);
    console.log(`Comments removed: ${this.stats.commentsRemoved}`);
    console.log(`Single-line comments removed: ${this.stats.singleLineRemoved}`);
    console.log(`Multi-line comments removed: ${this.stats.multiLineRemoved}`);
    console.log(`JSDoc comments preserved: ${this.stats.jsdocPreserved}`);
    console.log(`TODO/FIXME comments preserved: ${this.stats.todoPreserved}`);
    console.log(`Errors encountered: ${this.stats.errors}`);
    console.log('============================\n');
  }

  // Main execution
  run() {
    const startTime = Date.now();
    console.log('Starting comment cleanup...');
    
    const projectRoot = process.cwd();
    const files = this.findFiles(projectRoot);
    
    console.log(`Found ${files.length} files to process...`);
    
    for (const file of files) {
      this.stats.filesProcessed++;
      this.processFile(file);
    }
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    this.generateReport();
    console.log(`Cleanup completed in ${duration.toFixed(2)} seconds`);
    
    return this.stats;
  }
}

if (require.main === module) {
  const cleaner = new CommentCleaner();
  cleaner.run();
}

module.exports = CommentCleaner;