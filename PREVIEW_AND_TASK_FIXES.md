# Preview and Task Completion Fixes

## Issues Fixed

### 1. Preview Not Initializing ("Initializing System...Waiting for index.html")
**Problem**: Preview was stuck on loading screen and not showing the default MOCK_INITIAL_FILES content.

**Root Cause**: The initial preview load useEffect had an empty dependency array `[]`, which meant it ran before `projectFiles` was available from state.

**Solution**: Changed `generatedMarkup` from a simple useState to use an initializer function that processes files immediately:

```typescript
const [generatedMarkup, setGeneratedMarkup] = useState<string>(() => {
  // Initialize preview immediately with MOCK_INITIAL_FILES
  const initialState = getInitialState();
  if (initialState.projectFiles.length > 0) {
    const bundle = previewUpdateAgent.processFiles(initialState.projectFiles);
    if (bundle.html) {
      console.log('✅ Initial preview initialized with', bundle.html.length, 'characters');
      return bundle.html;
    }
  }
  return '';
});
```

This ensures the preview is populated immediately when the component mounts, before any useEffects run.

### 2. Tasks Not Turning Green When Completed
**Problem**: Execution Plan cards were not showing green completion status even though tasks were completing.

**Root Cause**: State was being mutated directly before calling setState, which could prevent React from detecting changes:

```typescript
// BEFORE - Direct mutation
state.tasks = state.tasks.map(...);
state.currentTaskIndex++;
state.agentLogs.push(...);
setState(prev => ({ ...prev, tasks: state.tasks, ... }));
```

**Solution**: Create new arrays/objects to ensure React detects changes:

```typescript
// AFTER - Immutable updates
const updatedTasks = state.tasks.map((t, idx) => 
    idx === state.currentTaskIndex ? { ...t, status: 'completed' as const } : t
);
const updatedLogs = [...state.agentLogs, `✓ Task completed: ${task.description}`];

setState(prev => ({
    ...prev,
    tasks: updatedTasks,
    currentTaskIndex: state.currentTaskIndex + 1,
    agentLogs: updatedLogs,
    ...
}));

// Update local state for next iteration
state.tasks = updatedTasks;
state.currentTaskIndex++;
state.agentLogs = updatedLogs;
```

### 3. Empty Folders Showing in File Tree
**Problem**: Agent was creating empty folders during code generation that remained visible in the file tree.

**Solution**: 
1. Added `removeEmptyFolders` utility function in `utils.ts`:

```typescript
export const removeEmptyFolders = (nodes: FileNode[]): FileNode[] => {
  return nodes.filter(node => {
    if (node.type === 'file') {
      return true; // Keep all files
    }
    
    if (node.type === 'folder') {
      if (!node.children || node.children.length === 0) {
        return false; // Remove empty folders
      }
      
      // Recursively clean children
      node.children = removeEmptyFolders(node.children);
      
      // After cleaning, check if folder is now empty
      return node.children.length > 0;
    }
    
    return true;
  }).map(node => ({
    ...node,
    children: node.children ? removeEmptyFolders(node.children) : node.children
  }));
};
```

2. Called this function after workflow completes:

```typescript
// Clean up empty folders before completing
const cleanedFiles = removeEmptyFolders(state.projectFiles);

setState(prev => ({ 
    ...prev, 
    projectFiles: cleanedFiles, 
    agentStatus: 'completed',
    statusMessage: `Mission Complete. Score: ${score}/100 (${quality})` 
}));
```

## Files Modified

1. **App.tsx**
   - Changed `generatedMarkup` initialization to use function initializer
   - Fixed task completion state updates to use immutable patterns
   - Added empty folder cleanup on workflow completion
   - Imported `removeEmptyFolders` utility

2. **utils.ts**
   - Added `removeEmptyFolders` function for recursive empty folder removal

## Expected Behavior After Fixes

✅ **Preview**: Shows default Real Estate project immediately on load
✅ **Preview**: Updates in real-time as agent builds projects
✅ **Tasks**: Turn green with checkmark when completed
✅ **Tasks**: Show proper in-progress animation (cyan pulse)
✅ **File Tree**: No empty folders after workflow completes
✅ **File Tree**: Clean, organized structure

## Testing Checklist

- [ ] Preview shows content immediately on page load
- [ ] Preview updates as agent generates files
- [ ] CSS and JS files are injected automatically
- [ ] Task cards turn green when completed
- [ ] Task cards show cyan pulse when in progress
- [ ] No empty folders in file tree after completion
- [ ] Console shows proper logging for all operations

## Technical Notes

### React State Updates
Always use immutable updates when working with React state:
- ✅ `const newArray = [...oldArray, newItem]`
- ✅ `const newObject = { ...oldObject, newProp: value }`
- ❌ `oldArray.push(newItem)` then setState
- ❌ `oldObject.prop = value` then setState

### useState Initializers
Use function initializers for expensive computations:
```typescript
const [state, setState] = useState(() => {
  // This only runs once on mount
  return expensiveComputation();
});
```

### Recursive Tree Operations
When working with file trees, always:
1. Process recursively (depth-first)
2. Return new objects/arrays (immutability)
3. Handle both files and folders
4. Consider edge cases (empty, null, undefined)
