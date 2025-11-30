
import type { FileNode } from './types';
import JSZip from 'jszip';

export const generateId = (): string => {
  return `id-${Math.random().toString(36).substr(2, 9)}`;
};

export const findFileByPath = (path: string, nodes: FileNode[]): FileNode | null => {
    for (const node of nodes) {
        if (node.path === path) {
            return node;
        }
        if (node.children) {
            const found = findFileByPath(path, node.children);
            if (found) return found;
        }
    }
    return null;
}

export const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
        };
        reader.onerror = (error) => reject(error);
    });
};

export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 1000,
  factor = 2,
  shouldRetry?: (error: any) => boolean
): Promise<T> => {
  let lastError: Error = new Error('Retry failed');
  for (let i = 0; i < retries; i++) {
    try {
      const result = await fn();
      window.dispatchEvent(new CustomEvent('gemini-api-call-success'));
      return result;
    } catch (error) {
      lastError = error as Error;
      const errorMessage = lastError.message || lastError.toString();
      
      // If shouldRetry predicate is provided and returns false, fail immediately
      if (shouldRetry && !shouldRetry(error)) {
          throw lastError;
      }

      if (i < retries - 1) {
        console.warn(`Attempt ${i + 1} failed. Retrying in ${delay}ms...`, errorMessage);
        await new Promise(res => setTimeout(res, delay));
        delay *= factor;
      }
    }
  }
  throw lastError;
};

export const formatFullTimestamp = (isoString: string): string => {
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};


export const formatRelativeTime = (isoString: string): string => {
  const date = new Date(isoString);
  const now = new Date();
  const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);

  if (seconds < 5) return "just now";
  if (minutes < 1) return `${seconds} seconds ago`;
  if (minutes < 60) return `${minutes} minutes ago`;
  if (hours < 24) return `${hours} hours ago`;
  return `${days} days ago`;
};

// --- Code Formatter (Prettier Simulation) ---

export const formatCode = (code: string, language: string): string => {
    const languagesToFormat = ['tsx', 'jsx', 'js', 'json'];
    if (!languagesToFormat.includes(language)) {
        return code;
    }

    try {
        let formattedCode = code;

        // Basic spacing rules
        formattedCode = formattedCode.replace(/,(?=[^\s])/g, ', '); // Add space after comma
        formattedCode = formattedCode.replace(/([^\s])({)/g, '$1 {'); // Add space before opening brace
        
        // This regex for operators is simple to avoid breaking complex syntax like template literals or regexes.
        // It's not perfect but covers common cases.
        formattedCode = formattedCode.replace(/\s*([=+\-*/%&|<>?!])\s*(?!=)/g, ' $1 ');

        // Indentation logic
        const lines = formattedCode.split('\n');
        let indentLevel = 0;
        const indentSize = 2;

        return lines.map(line => {
            const trimmedLine = line.trim();
            if (!trimmedLine) return '';

            if (trimmedLine.match(/^[}\]]/)) {
                indentLevel = Math.max(0, indentLevel - 1);
            }
            
            const indentedLine = ' '.repeat(indentLevel * indentSize) + trimmedLine;

            if (trimmedLine.match(/[{[]$/)) {
                indentLevel++;
            }
            
            return indentedLine;
        }).join('\n');
        
    } catch (e) {
        console.error("Code formatting failed:", e);
        return code; // Return original code on error
    }
};


// --- File Tree Manipulation Utilities ---

export const addNodeToTree = (nodes: FileNode[], parentId: string | null, newNode: FileNode): FileNode[] => {
    if (!parentId) {
        return [...nodes, newNode];
    }
    return nodes.map(node => {
        if (node.id === parentId) {
            if (node.type !== 'folder') return node;
            return { ...node, children: [...(node.children || []), newNode] };
        }
        if (node.children) {
            return { ...node, children: addNodeToTree(node.children, parentId, newNode) };
        }
        return node;
    });
};

export const removeNodeFromTree = (nodes: FileNode[], nodeId: string): FileNode[] => {
    return nodes.reduce((acc, node) => {
        if (node.id === nodeId) {
            return acc; // Skip the node to delete it
        }
        if (node.children) {
            const newChildren = removeNodeFromTree(node.children, nodeId);
            acc.push({ ...node, children: newChildren });
        } else {
            acc.push(node);
        }
        return acc;
    }, [] as FileNode[]);
};

export const updateNodeInTree = (nodes: FileNode[], nodeId: string, updates: Partial<FileNode>): FileNode[] => {
    return nodes.map(node => {
        if (node.id === nodeId) {
            return { ...node, ...updates };
        }
        if (node.children) {
            return { ...node, children: updateNodeInTree(node.children, nodeId, updates) };
        }
        return node;
    });
};

export const findNodeAndPath = (nodes: FileNode[], nodeId: string, currentPath: FileNode[] = []): { node: FileNode, path: FileNode[] } | null => {
    for (const node of nodes) {
        const newPath = [...currentPath, node];
        if (node.id === nodeId) {
            return { node, path: newPath };
        }
        if (node.children) {
            const found = findNodeAndPath(node.children, nodeId, newPath);
            if (found) return found;
        }
    }
    return null;
};

export const moveNodeInTree = (nodes: FileNode[], draggedId: string, targetId: string, position: 'before' | 'after' | 'inside'): FileNode[] => {
    const found = findNodeAndPath(nodes, draggedId);
    if (!found) return nodes;
    const { node: draggedNode } = found;

    let treeWithoutDragged = removeNodeFromTree(nodes, draggedId);

    const insert = (tree: FileNode[], tId: string, pos: 'before' | 'after' | 'inside'): FileNode[] => {
        let inserted = false;
        const result = tree.reduce((acc, node) => {
            if (node.id === tId) {
                if (pos === 'before') acc.push(draggedNode, node);
                else if (pos === 'after') acc.push(node, draggedNode);
                else { // 'inside'
                    if (node.type === 'folder') {
                        acc.push({ ...node, children: [...(node.children || []), draggedNode] });
                    } else { 
                        acc.push(node, draggedNode);
                    }
                }
                inserted = true;
            } else {
                if (node.children) {
                    const newChildren = insert(node.children, tId, pos);
                    if(JSON.stringify(node.children) !== JSON.stringify(newChildren)) inserted = true;
                    acc.push({ ...node, children: newChildren });
                } else {
                    acc.push(node);
                }
            }
            return acc;
        }, [] as FileNode[]);
        return result;
    }
    
    return insert(treeWithoutDragged, targetId, position);
};

export const duplicateNode = (node: FileNode): FileNode => {
    const newNode = { ...node, id: generateId() };
    if (newNode.children) {
        newNode.children = newNode.children.map(child => duplicateNode(child));
    }
    return newNode;
};


const TOKEN_REGEX: Record<string, RegExp | RegExp[]> = {
  'comment': /(\/\*[\s\S]*?\*\/|\/\/.*|<!--[\s\S]*?-->)/,
  'property': [
    /"([^"\\]|\\.)*"(?=\s*:)/, // For JSON keys
    /(?<=[\s{;])([a-zA-Z-]+)(?=:)/, // For CSS properties
  ],
  'string': /(["'`])(?:\\.|(?!\1)[^\\])*\1/,
  'component': /<([A-Z][a-zA-Z0-9]*)/g,
  'tag-punctuation-bracket': /<|\/?>|>/,
  'tag-name': /(?<=<|<\/)([a-zA-Z0-9-]+)/,
  'attribute-name': /\b([a-zA-Z-:]+)(?=\s*=)/,
  'attribute-value': /(?<==)(["'`])(?:\\.|(?!\1)[^\\])*\1/,
  'keyword': /\b(import|from|export|default|const|let|var|as|in|of|for|while|do|if|else|switch|case|break|continue|return|new|delete|typeof|instanceof|void|function|class|extends|super|this|async|await|try|catch|finally|debugger|@media|@keyframes|@import|@font-face|!important)\b/,
  'class-name': /\b([A-Z][a-zA-Z0-9_]*)\b/,
  'function': /\b([a-zA-Z_][a-zA-Z0-9_]*)(?=\s*\()/,
  'number': /-?\b\d+(\.\d+)?(px|em|rem|%|vh|vw)?\b/,
  'boolean': /\b(true|false|null)\b/,
  'selector': /(^|[\s,}{>~+])([.#&]?[a-zA-Z0-9-_*:]+)/g,
  'operator': /([=+\-*/%&|<>!^~?:,;]+)/,
  'punctuation': /([{}()\[\]])/
};

const escapeHtml = (str: string) => {
    return str.replace(/[&<>"']/g, (match) => {
        switch (match) {
            case '&': return '&amp;';
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '"': return '&quot;';
            case "'": return '&#039;';
            default: return match;
        }
    });
};

type Token = { type: string, value: string };
export const highlightSyntax = (code: string, language: 'tsx' | 'html' | 'css' | 'json' | 'js' = 'tsx') => {
    if (!code) return '';

    function tokenize(code: string, grammar: Record<string, RegExp | RegExp[]>): Token[] {
        const tokens: Token[] = [];
        let remainingCode = code;

        while (remainingCode.length > 0) {
            let foundMatch = false;
            for (const tokenType in grammar) {
                const patternSource = grammar[tokenType];
                let patterns: RegExp[];
                if (Array.isArray(patternSource)) {
                    patterns = patternSource;
                } else {
                    patterns = [patternSource];
                }

                for (const pattern of patterns) {
                    const regex = new RegExp(`^(${pattern.source})`, pattern.flags.replace('g', ''));
                    const match = remainingCode.match(regex);

                    if (match) {
                        tokens.push({ type: tokenType, value: match[0] });
                        remainingCode = remainingCode.substring(match[0].length);
                        foundMatch = true;
                        break;
                    }
                }
                if (foundMatch) break;
            }
            if (!foundMatch) {
                tokens.push({ type: 'plain', value: remainingCode[0] });
                remainingCode = remainingCode.substring(1);
            }
        }
        return tokens;
    }

    const grammar = TOKEN_REGEX;
    const tokens = tokenize(code, grammar);

    return tokens.map(token => {
        const escapedValue = escapeHtml(token.value);
        if (token.type === 'plain') {
            return escapedValue;
        }
        return `<span class="token-${token.type}">${escapedValue}</span>`;
    }).join('');
};

export const downloadProjectAsZip = async (files: FileNode[], projectName: string) => {
    const zip = new JSZip();

    const addFilesToZip = (nodes: FileNode[], folder: JSZip | null) => {
        nodes.forEach(node => {
            if (node.type === 'file') {
                (folder || zip).file(node.name, node.content || '');
            } else if (node.type === 'folder' && node.children) {
                const childFolder = (folder || zip).folder(node.name);
                if(childFolder) {
                   addFilesToZip(node.children, childFolder);
                }
            }
        });
    };

    addFilesToZip(files, null);

    try {
        const content = await zip.generateAsync({ type: 'blob' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        const safeProjectName = projectName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        link.download = `${safeProjectName}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    } catch (error) {
        console.error("Failed to generate or download zip file:", error);
    }
};

export class RateLimiter {
  private queue: (() => void)[] = [];
  private lastRequestTime = 0;
  private isProcessing = false;
  private readonly interval: number;

  constructor(rpm: number) {
    this.interval = 60000 / rpm;
  }

  async schedule(): Promise<void> {
    return new Promise(resolve => {
      this.queue.push(resolve);
      if (!this.isProcessing) {
        this._processQueue();
      }
    });
  }

  private _processQueue() {
    if (this.queue.length === 0) {
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;
    const now = Date.now();
    const timeSinceLast = now - this.lastRequestTime;
    const delay = Math.max(0, this.interval - timeSinceLast);

    setTimeout(() => {
      this.lastRequestTime = Date.now();
      const resolve = this.queue.shift();
      if (resolve) {
        resolve();
      }
      this._processQueue();
    }, delay);
  }
}
