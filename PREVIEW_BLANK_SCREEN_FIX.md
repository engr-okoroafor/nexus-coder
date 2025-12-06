# Preview Blank Screen Fix

## Issue
The preview window was showing a blank white screen despite files being generated. The Preview Update Agent was processing files correctly, but the preview wasn't displaying the content.

## Root Causes Identified

### 1. **useEffect Dependency Issue**
The preview update useEffect had `generatedMarkup` in its dependencies, which could cause:
- Infinite re-render loops
- Prevented updates from being applied
- Unnecessary re-executions

### 2. **Missing Initial Preview Load**
The preview wasn't being initialized on mount with the default MOCK_INITIAL_FILES content.

### 3. **Insufficient Logging**
Not enough visibility into what content was being passed to the iframe.

## Fixes Applied

### 1. **Fixed useEffect Dependencies** (`App.tsx`)
```typescript
// BEFORE: Had generatedMarkup in dependencies
}, [projectFiles, agentStatus, generatedMarkup]);

// AFTER: Removed generatedMarkup to prevent loops
}, [projectFiles, agentStatus]);
```

### 2. **Added Initial Preview Load** (`App.tsx`)
```typescript
// Initialize preview with default HTML on mount
useEffect(() => {
  if (projectFiles.length > 0 && !generatedMarkup) {
    console.log('🚀 Initializing preview on mount...');
    const bundle = previewUpdateAgent.processFiles(projectFiles);
    if (bundle.html) {
      console.log('✅ Initial preview set with', bundle.html.length, 'characters');
      setGeneratedMarkup(bundle.html);
    }
  }
}, []); // Run only once on mount
```

### 3. **Enhanced Logging** (`services/previewUpdateAgent.ts`)
- Added input file count and names logging
- Added HTML content preview (first 200 chars)
- Added detailed file discovery logging
- Shows which HTML, CSS, and JS files are found

### 4. **Improved Preview Component** (`components/Preview.tsx`)
- Added markup validation logging
- Added iframe onLoad and onError handlers
- Added empty HTML detection
- Shows first 500 chars of markup for debugging
- Validates HTML structure (DOCTYPE, html, body tags)

### 5. **Better Error Handling**
- Check for empty/whitespace-only HTML
- Warn when HTML structure is incomplete
- Show specific error messages for different failure modes

## How It Works Now

1. **On Mount**: Preview initializes with MOCK_INITIAL_FILES content
2. **On File Changes**: Preview Update Agent processes all files
3. **CSS Injection**: Automatically finds and injects all .css files as `<style>` tags
4. **JS Injection**: Automatically finds and injects all .js files as `<script>` tags
5. **Real-time Updates**: Preview updates whenever projectFiles or agentStatus changes

## Console Logs to Monitor

### Preview Update Agent Logs:
- `🔍 Preview Update Agent triggered` - useEffect fired
- `🔧 Preview Agent: Input files` - Shows what files are being processed
- `📁 Preview Agent: Found files` - HTML, CSS, JS counts
- `✅ Preview Agent: Using HTML file` - Which HTML file is selected
- `📦 Bundle created` - Bundle statistics
- `💅 CSS files injected` - Which CSS files were added
- `⚡ JS files injected` - Which JS files were added
- `🎨 UI elements rendered` - Count of UI components

### Preview Component Logs:
- `📺 Preview component received markup` - Markup length
- `📺 First 500 chars of markup` - Content preview
- `📺 Markup validation` - Structure checks
- `✅ Iframe loaded successfully` - Iframe rendered
- `❌ Iframe error` - Iframe failed to load

## Testing

To verify the fix works:

1. **Check Initial Load**: Preview should show MOCK_INITIAL_FILES content immediately
2. **Check Console**: Should see all the logging messages above
3. **Generate New Project**: Preview should update in real-time as files are created
4. **Check CSS**: Styles should be applied automatically
5. **Check JS**: Scripts should execute in the preview

## Files Modified

1. `App.tsx` - Fixed useEffect dependencies, added initial load
2. `components/Preview.tsx` - Enhanced logging and error handling
3. `services/previewUpdateAgent.ts` - Added detailed logging

## Expected Behavior

- ✅ Preview shows content immediately on load
- ✅ Preview updates in real-time as agent builds
- ✅ CSS files are automatically injected
- ✅ JS files are automatically injected
- ✅ UI components are visible with styling
- ✅ Console shows detailed progress logs
- ✅ No blank white screens
- ✅ No infinite loops
