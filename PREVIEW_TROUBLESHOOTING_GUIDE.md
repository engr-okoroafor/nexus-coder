# Preview Update Troubleshooting Guide

## Enhanced Debugging Added

### New Console Logs to Watch For:

**1. Preview Update Agent Trigger:**
```
🔍 Preview Update Agent triggered - Files: X Status: coding
```
- This confirms the useEffect is running
- Shows number of files and agent status

**2. File Processing:**
```
⚙️ Processing files with Preview Update Agent...
```
- Confirms agent is processing files

**3. Bundle Creation:**
```
📦 Bundle created: { hasHtml: true, htmlLength: 1234, cssFiles: 1, jsFiles: 0 }
```
- Shows if HTML was found
- Shows HTML length
- Shows number of CSS and JS files

**4. Preview Update:**
```
✅ Updating preview - HTML length: 1234
🔄 Preview updated with new content
```
- Confirms preview is being updated
- Shows HTML content length

**5. Preview Component:**
```
📺 Preview component received markup: 1234 characters
```
- Confirms Preview component received the HTML
- Shows character count

**6. File Statistics:**
```
🎨 Preview Update Agent: Processing 3 files
📄 HTML files: 1
💅 CSS files injected: style.css
🎨 15 UI elements rendered in preview
✨ Styling applied: 1 CSS file(s)
```

---

## Troubleshooting Steps

### Step 1: Check Browser Console

Open browser DevTools (F12) and look for the console logs above.

**If you see:**
- ✅ `🔍 Preview Update Agent triggered` - Agent is running
- ✅ `📦 Bundle created` - Files are being processed
- ✅ `✅ Updating preview` - Preview is being updated
- ✅ `📺 Preview component received markup` - Component got the HTML

**If you DON'T see these logs:**
- ❌ useEffect might not be triggering
- ❌ Dependencies might be wrong
- ❌ Component might not be mounted

### Step 2: Check Project Files

In console, check if files exist:
```javascript
// In browser console
console.log('Project files:', window.projectFiles);
```

Look for:
- `index.html` file
- `style.css` or other CSS files
- File content is not empty

### Step 3: Check Generated Markup

In console, check the markup:
```javascript
// In browser console
console.log('Generated markup:', window.generatedMarkup);
```

Should show complete HTML with injected CSS.

### Step 4: Check Preview Component

Verify Preview component is rendering:
```javascript
// In browser console
document.querySelector('iframe[title="Live Preview"]');
```

Should return the iframe element.

### Step 5: Check View Mode

Ensure view mode is set to show preview:
```javascript
// In browser console
console.log('View mode:', window.viewMode);
```

Should be `'split'` or `'preview'`, not `'code'`.

---

## Common Issues and Solutions

### Issue 1: "No project files to process"

**Symptom:**
```
⚠️ No project files to process
```

**Cause:** `projectFiles` array is empty

**Solution:**
- Wait for agent to generate files
- Check if files are being added to state
- Verify `setState` is being called with files

### Issue 2: "Bundle created but no HTML"

**Symptom:**
```
📦 Bundle created: { hasHtml: false, htmlLength: 0, ... }
```

**Cause:** No HTML file found or HTML file has no content

**Solution:**
- Check if `index.html` exists in project files
- Verify HTML file has content
- Check file name is exactly `index.html` (case-insensitive)

### Issue 3: "Preview component not receiving markup"

**Symptom:**
- See `✅ Updating preview` but not `📺 Preview component received markup`

**Cause:** Props not being passed correctly

**Solution:**
- Check `<Preview generatedMarkup={generatedMarkup} />` in App.tsx
- Verify Preview component is mounted
- Check React DevTools for prop values

### Issue 4: "CSS not showing in preview"

**Symptom:**
- HTML renders but no styling

**Cause:** CSS files not being injected

**Solution:**
- Check console for `💅 CSS files injected: ...`
- Verify CSS files have content
- Check CSS file names end with `.css`
- Inspect iframe HTML to see if `<style>` tags are present

### Issue 5: "Preview shows old content"

**Symptom:**
- Preview doesn't update when files change

**Cause:** Change detection not working

**Solution:**
- Check if `generatedMarkup !== bundle.html` condition is true
- Try clicking "Reload" button in preview
- Clear browser cache

---

## Manual Testing

### Test 1: Force Preview Update

In browser console:
```javascript
// Force update with test HTML
window.setGeneratedMarkup('<html><body><h1>Test</h1></body></html>');
```

If this works, the Preview component is fine.

### Test 2: Check Agent Processing

In browser console:
```javascript
// Manually trigger agent
const bundle = window.previewUpdateAgent.processFiles(window.projectFiles);
console.log('Manual bundle:', bundle);
```

Should show bundle with HTML, CSS, JS.

### Test 3: Check File Tree

In browser console:
```javascript
// Log all files
const logFiles = (files, indent = 0) => {
  files.forEach(f => {
    console.log(' '.repeat(indent) + f.name, f.type, f.content?.length || 0);
    if (f.children) logFiles(f.children, indent + 2);
  });
};
logFiles(window.projectFiles);
```

Should show file tree with content lengths.

---

## Expected Flow

1. **Agent generates files** → `projectFiles` state updates
2. **useEffect triggers** → Logs `🔍 Preview Update Agent triggered`
3. **Agent processes files** → Logs `⚙️ Processing files...`
4. **Bundle created** → Logs `📦 Bundle created`
5. **Preview updates** → Logs `✅ Updating preview`
6. **Component receives** → Logs `📺 Preview component received markup`
7. **Iframe renders** → User sees website

---

## Debug Checklist

- [ ] Browser console is open
- [ ] See `🔍 Preview Update Agent triggered` log
- [ ] See `📦 Bundle created` with `hasHtml: true`
- [ ] See `✅ Updating preview` log
- [ ] See `📺 Preview component received markup` log
- [ ] See file statistics logs
- [ ] Iframe element exists in DOM
- [ ] View mode is `split` or `preview`
- [ ] No JavaScript errors in console
- [ ] Files have content (not empty)

---

## Next Steps

If preview still doesn't work after checking all above:

1. **Share console logs** - Copy all console output
2. **Check React DevTools** - Inspect component props
3. **Check Network tab** - Look for errors
4. **Try manual test** - Use Test 1 above
5. **Restart dev server** - Sometimes helps

The enhanced logging should help identify exactly where the issue is!
