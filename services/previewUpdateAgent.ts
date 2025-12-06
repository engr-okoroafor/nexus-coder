/**
 * Preview Update Agent
 * Monitors all project files and updates preview in real-time
 */

import { FileNode } from '../types';

export interface PreviewBundle {
  html: string;
  css: string[];
  js: string[];
  hasChanges: boolean;
  timestamp: number;
}

export class PreviewUpdateAgent {
  private lastBundle: PreviewBundle | null = null;
  private fileCache: Map<string, string> = new Map();

  /**
   * Process all project files and create a complete preview bundle
   */
  public processFiles(files: FileNode[]): PreviewBundle {
    const htmlFiles: FileNode[] = [];
    const cssFiles: FileNode[] = [];
    const jsFiles: FileNode[] = [];

    console.log('🔧 Preview Agent: Starting file processing...');
    console.log('🔧 Preview Agent: Input files count:', files.length);
    console.log('🔧 Preview Agent: Input files:', files.map(f => f.name).join(', '));

    // Traverse file tree and collect all relevant files
    this.traverseFiles(files, htmlFiles, cssFiles, jsFiles);

    console.log('📁 Preview Agent: Found files -', {
      html: htmlFiles.length,
      css: cssFiles.length,
      js: jsFiles.length
    });
    
    if (htmlFiles.length > 0) {
      console.log('📄 HTML files found:', htmlFiles.map(f => f.name).join(', '));
    }
    if (cssFiles.length > 0) {
      console.log('💅 CSS files found:', cssFiles.map(f => f.name).join(', '));
    }
    if (jsFiles.length > 0) {
      console.log('⚡ JS files found:', jsFiles.map(f => f.name).join(', '));
    }

    // Find main HTML file (index.html or first HTML file)
    const mainHtml = this.findMainHtml(htmlFiles);
    
    if (!mainHtml || !mainHtml.content) {
      console.warn('⚠️ Preview Agent: No HTML file found or HTML is empty');
      console.warn('⚠️ mainHtml:', mainHtml ? 'exists but no content' : 'null');
      return {
        html: '',
        css: [],
        js: [],
        hasChanges: false,
        timestamp: Date.now()
      };
    }

    console.log('✅ Preview Agent: Using HTML file:', mainHtml.name, 'Length:', mainHtml.content.length);
    console.log('✅ Preview Agent: HTML content preview (first 200 chars):', mainHtml.content.substring(0, 200));

    // Check if files have changed
    const hasChanges = this.detectChanges(mainHtml, cssFiles, jsFiles);

    // Build complete HTML with injected CSS and JS
    console.log('🔨 Preview Agent: Building complete HTML...');
    const completeHtml = this.buildCompleteHtml(mainHtml, cssFiles, jsFiles);
    console.log('📦 Preview Agent: Complete HTML length:', completeHtml.length);

    if (cssFiles.length > 0) {
      console.log('💅 Preview Agent: Injected CSS files:', cssFiles.map(f => f.name).join(', '));
    }

    if (jsFiles.length > 0) {
      console.log('⚡ Preview Agent: Injected JS files:', jsFiles.map(f => f.name).join(', '));
    }

    const bundle: PreviewBundle = {
      html: completeHtml,
      css: cssFiles.map(f => f.name),
      js: jsFiles.map(f => f.name),
      hasChanges,
      timestamp: Date.now()
    };

    this.lastBundle = bundle;
    console.log('✅ Preview Agent: Bundle created successfully');
    return bundle;
  }

  /**
   * Traverse file tree recursively
   */
  private traverseFiles(
    nodes: FileNode[],
    htmlFiles: FileNode[],
    cssFiles: FileNode[],
    jsFiles: FileNode[]
  ): void {
    nodes.forEach(node => {
      if (node.type === 'file' && node.content) {
        const lowerName = node.name.toLowerCase();
        
        if (lowerName.endsWith('.html') || lowerName.endsWith('.htm')) {
          htmlFiles.push(node);
        } else if (lowerName.endsWith('.css')) {
          cssFiles.push(node);
        } else if (lowerName.endsWith('.js') && !lowerName.includes('node_modules')) {
          jsFiles.push(node);
        }
      }
      
      if (node.children) {
        this.traverseFiles(node.children, htmlFiles, cssFiles, jsFiles);
      }
    });
  }

  /**
   * Find main HTML file (prioritize index.html)
   */
  private findMainHtml(htmlFiles: FileNode[]): FileNode | null {
    if (htmlFiles.length === 0) return null;
    
    // Prioritize index.html
    const indexHtml = htmlFiles.find(f => 
      f.name.toLowerCase() === 'index.html'
    );
    
    if (indexHtml) return indexHtml;
    
    // Return first HTML file
    return htmlFiles[0];
  }

  /**
   * Detect if files have changed since last bundle
   */
  private detectChanges(
    htmlFile: FileNode,
    cssFiles: FileNode[],
    jsFiles: FileNode[]
  ): boolean {
    const currentHash = this.generateHash(htmlFile, cssFiles, jsFiles);
    const cachedHash = this.fileCache.get('bundle-hash');
    
    if (currentHash !== cachedHash) {
      this.fileCache.set('bundle-hash', currentHash);
      return true;
    }
    
    return false;
  }

  /**
   * Generate hash for change detection
   */
  private generateHash(
    htmlFile: FileNode,
    cssFiles: FileNode[],
    jsFiles: FileNode[]
  ): string {
    const parts = [
      htmlFile.content || '',
      ...cssFiles.map(f => f.content || ''),
      ...jsFiles.map(f => f.content || '')
    ];
    
    return parts.join('|').length.toString();
  }

  /**
   * Build complete HTML with injected CSS and JS
   * Ensures production-quality rendering with proper meta tags and structure
   */
  private buildCompleteHtml(
    htmlFile: FileNode,
    cssFiles: FileNode[],
    jsFiles: FileNode[]
  ): string {
    let html = htmlFile.content || '';

    // Ensure proper HTML structure
    const hasDoctype = html.toLowerCase().includes('<!doctype');
    const hasHtmlTag = html.toLowerCase().includes('<html');
    const hasHead = html.toLowerCase().includes('<head');
    const hasBody = html.toLowerCase().includes('<body');

    // Add DOCTYPE if missing
    if (!hasDoctype) {
      html = '<!DOCTYPE html>\n' + html;
    }

    // Wrap in proper HTML structure if needed
    if (!hasHtmlTag) {
      html = `<html lang="en">\n${html}\n</html>`;
    }

    // Ensure head section exists with essential meta tags
    if (!hasHead) {
      const essentialHead = `
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Preview</title>
</head>`;
      
      if (html.includes('<html')) {
        html = html.replace(/<html[^>]*>/i, (match) => `${match}\n${essentialHead}`);
      } else {
        html = essentialHead + html;
      }
    } else {
      // Ensure viewport meta tag exists for responsive design
      if (!html.includes('viewport')) {
        const viewportMeta = '<meta name="viewport" content="width=device-width, initial-scale=1.0">';
        if (html.includes('<head>')) {
          html = html.replace('<head>', `<head>\n  ${viewportMeta}`);
        } else if (html.includes('<head')) {
          html = html.replace(/<head[^>]*>/i, (match) => `${match}\n  ${viewportMeta}`);
        }
      }
    }

    // Inject CSS files with proper formatting
    if (cssFiles.length > 0) {
      const cssInjection = cssFiles
        .map(cssFile => {
          const content = cssFile.content || '';
          return `  <style data-file="${cssFile.name}">\n${content}\n  </style>`;
        })
        .join('\n');

      // Inject before </head>
      if (html.includes('</head>')) {
        html = html.replace('</head>', `${cssInjection}\n</head>`);
      } else if (html.includes('<head>')) {
        html = html.replace('<head>', `<head>\n${cssInjection}`);
      }
    }

    // Ensure body tag exists
    if (!hasBody) {
      const bodyContent = html.replace(/<\/head>/i, '</head>\n<body>\n').replace(/<\/html>/i, '\n</body>\n</html>');
      html = bodyContent;
    }

    // Inject JS files before </body> for better performance
    if (jsFiles.length > 0) {
      const jsInjection = jsFiles
        .map(jsFile => {
          const content = jsFile.content || '';
          return `  <script data-file="${jsFile.name}">\n${content}\n  </script>`;
        })
        .join('\n');

      // Inject before </body>
      if (html.includes('</body>')) {
        html = html.replace('</body>', `${jsInjection}\n</body>`);
      } else {
        // No body tag, append JS before </html>
        html = html.replace('</html>', `${jsInjection}\n</html>`);
      }
    }

    // Add smooth scrolling and better defaults
    const enhancementStyles = `
  <style data-enhancement="true">
    * {
      box-sizing: border-box;
    }
    html {
      scroll-behavior: smooth;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    body {
      margin: 0;
      padding: 0;
      min-height: 100vh;
    }
    img {
      max-width: 100%;
      height: auto;
    }
  </style>`;

    // Inject enhancement styles
    if (html.includes('</head>')) {
      html = html.replace('</head>', `${enhancementStyles}\n</head>`);
    }

    console.log('🎨 Preview Agent: Enhanced HTML with production-quality structure');
    return html;
  }

  /**
   * Get detailed file statistics
   */
  public getFileStats(files: FileNode[]): {
    htmlCount: number;
    cssCount: number;
    jsCount: number;
    totalFiles: number;
  } {
    let htmlCount = 0;
    let cssCount = 0;
    let jsCount = 0;
    let totalFiles = 0;

    const traverse = (nodes: FileNode[]) => {
      nodes.forEach(node => {
        if (node.type === 'file') {
          totalFiles++;
          const lowerName = node.name.toLowerCase();
          if (lowerName.endsWith('.html')) htmlCount++;
          if (lowerName.endsWith('.css')) cssCount++;
          if (lowerName.endsWith('.js')) jsCount++;
        }
        if (node.children) traverse(node.children);
      });
    };

    traverse(files);

    return { htmlCount, cssCount, jsCount, totalFiles };
  }

  /**
   * Clear cache
   */
  public clearCache(): void {
    this.fileCache.clear();
    this.lastBundle = null;
  }
}

// Singleton instance
export const previewUpdateAgent = new PreviewUpdateAgent();
