# Fixes to Apply

## 1. Header Dropdown - Already Fixed
The dropdown is already using:
- `fixed` positioning at `top-[72px] right-6`
- `z-[99999]` which is the highest z-index
- This should be above everything

## 2. Terminal Bounds - Already Correct
The terminal height calculation is already using:
```
calc(100vh - 72px - 40px - ${terminalHeight}px)
```
This properly constrains the code view and preview panels.

## 3. Explorer Resizer - Needs Event Handler Fix
The issue is in the handleMouseMove callback - it needs to continuously update during drag.

## 4. Mission Control Resizer - Already Working
The ControlPanel resizer is already implemented and should be working.

## Issues to Fix:
1. Ensure handleMouseMove doesn't save to localStorage on every move (performance)
2. Ensure the resizer state persists properly
3. Make sure z-index hierarchy is correct for all modals
