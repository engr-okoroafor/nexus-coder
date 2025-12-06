# Design Document

## Overview

This design document outlines the technical approach for implementing manual panel resizers with neon-accented visual feedback, fixing logout functionality across all view modes, and enhancing the agent chat workflow in the Nexus Coder IDE. The solution will provide users with granular control over their workspace layout while maintaining visual consistency and ensuring robust state management across view mode transitions.

## Architecture

### High-Level Architecture

The implementation follows a component-based architecture with centralized state management:

```
App.tsx (Root State Container)
├── Header.tsx (Logout Handler)
├── ControlPanel.tsx (Mission Control with Resizer)
│   └── ResizeHandle Component
├── CodeView.tsx (Main Workspace)
    ├── FileTree (Explorer with Resizer)
    │   └── ResizeHandle Component
    ├── CodeEditor (with Resizer in Split Mode)
    │   └── ResizeHandle Component
    └── Preview (with Resizer in Split Mode)
        └── ResizeHandle Component
```

### State Management Strategy

1. **Panel Width State**: Stored in App.tsx and persisted to sessionStorage
2. **View Mode State**: Managed in App.tsx, controls visibility of panels
3. **Authentication State**: Managed in App.tsx, persisted to localStorage
4. **Resize State**: Local component state with refs for performance

## Components and Interfaces

### 1. ResizeHandle Component

A reusable component for all panel adjusters with neon-accented styling.

```typescript
interface ResizeHandleProps {
  orientation: 'vertical' | 'horizontal';
  onMouseDown: (e: React.MouseEvent) => void;
  position?: 'left' | 'right' | 'top' | 'bottom';
  className?: string;
}

const ResizeHandle: React.FC<ResizeHandleProps> = ({
  orientation,
  onMouseDown,
  position = 'right',
  className
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  return (
    <div
      className={`resize-handle ${orientation} ${position} ${className}`}
      onMouseDown={onMouseDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        cursor: orientation === 'vertical' ? 'col-resize' : 'row-resize',
        width: orientation === 'vertical' ? '4px' : '100%',
        height: orientation === 'horizontal' ? '4px' : '100%',
        background: isDragging 
          ? 'rgba(34, 211, 238, 0.8)' 
          : isHovered 
            ? 'rgba(34, 211, 238, 0.6)' 
            : 'rgba(34, 211, 238, 0.4)',
        boxShadow: isDragging || isHovered
          ? '0 0 10px rgba(34, 211, 238, 0.8)'
          : '0 0 5px rgba(34, 211, 238, 0.4)',
        transition: 'all 0.2s ease',
        position: 'absolute',
        zIndex: 10
      }}
    />
  );
};
```

### 2. Enhanced App.tsx State

```typescript
interface PanelWidths {
  missionControl: number;
  explorer: number;
  codeSplit: number; // Percentage for code pane in split view
}

interface PanelWidthsPerViewMode {
  split: PanelWidths;
  code: PanelWidths;
  preview: PanelWidths;
}

// Add to App state
const [panelWidths, setPanelWidths] = useState<PanelWidthsPerViewMode>(() => {
  try {
    const saved = sessionStorage.getItem('nexus-panel-widths');
    return saved ? JSON.parse(saved) : {
      split: { missionControl: window.innerWidth / 3, explorer: 256, codeSplit: 50 },
      code: { missionControl: window.innerWidth / 3, explorer: 256, codeSplit: 50 },
      preview: { missionControl: window.innerWidth / 3, explorer: 256, codeSplit: 50 }
    };
  } catch {
    return {
      split: { missionControl: window.innerWidth / 3, explorer: 256, codeSplit: 50 },
      code: { missionControl: window.innerWidth / 3, explorer: 256, codeSplit: 50 },
      preview: { missionControl: window.innerWidth / 3, explorer: 256, codeSplit: 50 }
    };
  }
});
```

### 3. Enhanced CodeView Component

```typescript
interface CodeViewProps {
  // ... existing props
  explorerWidth: number;
  codeSplitPercentage: number;
  onExplorerResize: (width: number) => void;
  onCodeSplitResize: (percentage: number) => void;
}

export const CodeView: React.FC<CodeViewProps> = ({
  explorerWidth,
  codeSplitPercentage,
  onExplorerResize,
  onCodeSplitResize,
  // ... other props
}) => {
  const explorerResizeRef = useRef(false);
  const splitResizeRef = useRef(false);
  
  // Explorer resize handlers
  const handleExplorerMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    explorerResizeRef.current = true;
  };
  
  // Split view resize handlers
  const handleSplitMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    splitResizeRef.current = true;
  };
  
  // ... implementation
};
```

### 4. Logout Handler Enhancement

```typescript
const handleLogout = useCallback(() => {
  // Save current session before logout
  saveSessionToStorage();
  
  // Clear authentication state
  localStorage.removeItem('nexus-auth-state');
  setIsAuthenticated(false);
  setUser({ name: 'Demo User', email: 'demo@user.com', bio: 'AI enthusiast & developer.' });
  
  // Close all modals
  setAuthModalOpen(false);
  setBillingOpen(false);
  setTemplateModalOpen(false);
  setProfileModalOpen(false);
  setSettingsModalOpen(false);
  setGitHubImportModalOpen(false);
  setDeployModalOpen(false);
  setVersionHistoryModalOpen(false);
  setShareModalOpen(false);
  setCopyProjectModalOpen(false);
  
  // Reset view mode to ensure clean state
  setViewMode('preview');
  
  // Force re-render by updating a key state
  addLog('User logged out successfully.');
  
  // Navigate handled by parent component checking isAuthenticated
}, [saveSessionToStorage, addLog]);
```

## Data Models

### Panel Width Configuration

```typescript
interface PanelConstraints {
  min: number;
  max: number | ((viewportWidth: number) => number);
}

const PANEL_CONSTRAINTS: Record<string, PanelConstraints> = {
  missionControl: {
    min: 320,
    max: (vw) => vw * 0.6
  },
  explorer: {
    min: 200,
    max: 600
  },
  codeSplit: {
    min: 300, // pixels for each pane
    max: Infinity
  }
};
```

### Session Storage Schema

```typescript
interface SessionStorageSchema {
  panelWidths: PanelWidthsPerViewMode;
  workflowState: WorkflowState;
  fileHistories: Record<string, FileHistory>;
  appSettings: AppSettings;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Acceptance Criteria Testing Prework

1.1 WHEN the Explorer panel is visible THEN the system SHALL display a neon-accented vertical resize handle on the right edge of the panel
Thoughts: This is about rendering a UI element when a condition is met. We can test this by checking if the resize handle element exists in the DOM when the Explorer is visible.
Testable: yes - example

1.2 WHEN a user hovers over the Explorer resize handle THEN the system SHALL change the cursor to indicate resizability and increase the neon glow effect
Thoughts: This is testing CSS state changes on hover. We can simulate hover events and check computed styles.
Testable: yes - property

1.3 WHEN a user drags the Explorer resize handle THEN the system SHALL update the panel width in real-time following the cursor position
Thoughts: This is about the relationship between mouse position and panel width during drag. For any drag operation, the panel width should correspond to the mouse X position.
Testable: yes - property

1.4 WHEN the Explorer panel is resized THEN the system SHALL maintain a minimum width of 200 pixels and maximum width of 600 pixels
Thoughts: This is an invariant that must hold after any resize operation. For any resize action, the resulting width should be within bounds.
Testable: yes - property

1.5 WHEN the user switches between split, code, or preview view modes THEN the Explorer resize handle SHALL remain visible and functional
Thoughts: This is testing that the resize handle persists across view mode changes. For any view mode transition, the handle should remain in the DOM and be interactive.
Testable: yes - property

2.1 WHEN the system is in split view mode THEN the system SHALL display a neon-accented vertical resize handle between the code editor and preview window
Thoughts: This is checking for the presence of a UI element in a specific mode. This is a specific example to test.
Testable: yes - example

2.2 WHEN a user hovers over the code-preview resize handle THEN the system SHALL change the cursor to col-resize and increase the neon glow effect
Thoughts: Similar to 1.2, testing hover state changes.
Testable: yes - property

2.3 WHEN a user drags the code-preview resize handle THEN the system SHALL update both pane widths proportionally in real-time
Thoughts: This is about the relationship between drag position and the proportional split. For any drag operation, the sum of both pane widths should equal the container width.
Testable: yes - property

2.4 WHEN the code-preview split is adjusted THEN the system SHALL maintain a minimum width of 300 pixels for each pane
Thoughts: This is an invariant. For any split adjustment, both panes should be at least 300px.
Testable: yes - property

2.5 WHEN the user switches from split view to code or preview view THEN the system SHALL preserve the split ratio for when the user returns to split view
Thoughts: This is a round-trip property. Switching away and back should restore the split ratio.
Testable: yes - property

3.1 WHEN the Mission Control panel is visible THEN the system SHALL display a neon-accented vertical resize handle on the right edge of the panel
Thoughts: Similar to 1.1, checking for UI element presence.
Testable: yes - example

3.2 WHEN a user hovers over the Mission Control resize handle THEN the system SHALL change the cursor to col-resize and increase the neon glow effect
Thoughts: Hover state testing.
Testable: yes - property

3.3 WHEN a user drags the Mission Control resize handle THEN the system SHALL update the panel width in real-time without distorting internal components
Thoughts: This tests that resizing doesn't break layout. For any resize, internal components should remain properly laid out (no overflow, no distortion).
Testable: yes - property

3.4 WHEN the Mission Control panel is resized THEN the system SHALL maintain a minimum width of 320 pixels and maximum width of 60% of viewport width
Thoughts: Invariant testing with dynamic max constraint.
Testable: yes - property

3.5 WHEN Mission Control components (buttons, cards, model selector) are rendered THEN the system SHALL use responsive layouts that adapt to the panel width without overflow or distortion
Thoughts: This is about responsive design. For any panel width within constraints, components should render without overflow.
Testable: yes - property

4.1 WHEN a user clicks the logout button from the header dropdown THEN the system SHALL clear the authentication state from local storage
Thoughts: This is testing a specific action and its effect. We can check localStorage after logout.
Testable: yes - example

4.2 WHEN a user clicks the logout button THEN the system SHALL navigate the user to the landing page regardless of current view mode
Thoughts: For any view mode, logout should result in landing page navigation.
Testable: yes - property

4.3 WHEN a user is in split view and clicks logout THEN the system SHALL properly unmount all components before navigating to the landing page
Thoughts: This is testing cleanup during logout. We can check that component lifecycle methods are called.
Testable: yes - example

4.4 WHEN a user logs out THEN the system SHALL preserve the current project session for restoration upon next login
Thoughts: This is a round-trip property. Logout then login should restore session data.
Testable: yes - property

4.5 WHEN the landing page loads after logout THEN the system SHALL display the authentication modal if the user attempts to access protected features
Thoughts: This is testing conditional rendering based on auth state.
Testable: yes - example

5.1 WHEN a user submits a mission prompt THEN the system SHALL display the agent's planning phase with visual feedback in the Mission Control panel
Thoughts: This is testing UI response to user action.
Testable: yes - example

5.2 WHEN the agent is coding THEN the system SHALL update the preview window in real-time as files are modified
Thoughts: For any file modification during coding, the preview should reflect changes.
Testable: yes - property

5.3 WHEN the agent completes a task THEN the system SHALL mark the task as completed in the execution plan with visual confirmation
Thoughts: For any task completion, the UI should show completed status.
Testable: yes - property

5.4 WHEN the agent encounters an error THEN the system SHALL pause execution and display the error with retry options
Thoughts: Error handling behavior.
Testable: yes - example

5.5 WHEN the agent requests user input THEN the system SHALL display a prominent input field with context about what information is needed
Thoughts: UI response to agent pause state.
Testable: yes - example

5.6 WHEN a user provides feedback during agent pause THEN the system SHALL incorporate the feedback and resume the workflow
Thoughts: Testing the pause-resume cycle with user input.
Testable: yes - example

5.7 WHEN the agent completes the entire mission THEN the system SHALL display a completion summary and allow the user to start a new mission or refine the current one
Thoughts: Testing completion state UI.
Testable: yes - example

5.8 WHEN the preview window updates during agent work THEN the system SHALL maintain scroll position and not disrupt user observation
Thoughts: For any preview update, scroll position should be preserved.
Testable: yes - property

6.1 WHEN a user adjusts any panel width THEN the system SHALL save the adjustment to session storage
Thoughts: For any panel resize, sessionStorage should be updated.
Testable: yes - property

6.2 WHEN a user switches view modes THEN the system SHALL restore previously saved panel widths for that view mode
Thoughts: View mode switching should restore saved widths.
Testable: yes - property

6.3 WHEN a user refreshes the browser THEN the system SHALL restore all panel widths from session storage
Thoughts: Round-trip property for browser refresh.
Testable: yes - property

6.4 WHEN a user starts a new session THEN the system SHALL initialize panels with default widths
Thoughts: Testing initial state.
Testable: yes - example

6.5 WHEN panel widths are restored THEN the system SHALL validate that they fit within current viewport constraints
Thoughts: For any restored width, it should be clamped to valid constraints.
Testable: yes - property

7.1 WHEN a panel adjuster is rendered THEN the system SHALL display it with a neon cyan color (#22d3ee) and subtle glow effect
Thoughts: Testing default rendering state.
Testable: yes - example

7.2 WHEN a user hovers over a panel adjuster THEN the system SHALL increase the glow intensity and width of the handle
Thoughts: Hover state changes.
Testable: yes - property

7.3 WHEN a user is actively dragging a panel adjuster THEN the system SHALL display a brighter glow and change the cursor to indicate dragging
Thoughts: Drag state visual feedback.
Testable: yes - property

7.4 WHEN a panel adjuster is inactive THEN the system SHALL reduce opacity to 40% while maintaining visibility
Thoughts: Testing inactive state styling.
Testable: yes - example

7.5 WHEN multiple panel adjusters are present THEN the system SHALL ensure consistent styling across all handles
Thoughts: For any set of handles, they should have consistent styling.
Testable: yes - property

### Property Reflection

After reviewing all properties, I've identified the following redundancies:

- Properties 1.2, 2.2, 3.2, and 7.2 all test hover behavior on resize handles - these can be combined into one comprehensive property about hover states
- Properties 7.3 and 7.2 overlap with drag state testing - can be consolidated
- Properties 6.1, 6.2, and 6.3 all test persistence and can be combined into a comprehensive persistence property

The remaining properties provide unique validation value and should be kept separate.

### Correctness Properties

Property 1: Resize handle bounds enforcement
*For any* panel resize operation, the resulting panel width SHALL be clamped to the minimum and maximum constraints defined for that panel type
**Validates: Requirements 1.4, 2.4, 3.4**

Property 2: Real-time resize tracking
*For any* drag operation on a resize handle, the panel width SHALL update to match the cursor position within the valid bounds
**Validates: Requirements 1.3, 2.3, 3.3**

Property 3: Resize handle hover feedback
*For any* resize handle, hovering SHALL increase visual prominence (glow intensity, opacity) and change the cursor to indicate resizability
**Validates: Requirements 1.2, 2.2, 3.2, 7.2**

Property 4: Split view proportional resizing
*For any* code-preview split adjustment, the sum of both pane widths SHALL equal the container width minus the resize handle width
**Validates: Requirements 2.3**

Property 5: View mode persistence
*For any* view mode switch, returning to the original view mode SHALL restore the panel widths that were active before the switch
**Validates: Requirements 1.5, 2.5**

Property 6: Session storage round-trip
*For any* panel width adjustment, saving to and loading from session storage SHALL preserve the exact width values
**Validates: Requirements 6.1, 6.2, 6.3**

Property 7: Logout state cleanup
*For any* view mode, clicking logout SHALL clear authentication state, close all modals, and navigate to the landing page
**Validates: Requirements 4.2**

Property 8: Preview update scroll preservation
*For any* preview window content update during agent work, the scroll position SHALL remain unchanged unless explicitly scrolled by the user
**Validates: Requirements 5.8**

Property 9: Task completion visual feedback
*For any* task that transitions to completed status, the UI SHALL display visual confirmation (checkmark, color change, animation)
**Validates: Requirements 5.3**

Property 10: Component layout integrity during resize
*For any* Mission Control panel width within valid constraints, all internal components SHALL render without overflow or layout distortion
**Validates: Requirements 3.5**

Property 11: Resize handle visual consistency
*For any* set of resize handles rendered simultaneously, they SHALL have consistent neon cyan color, glow effects, and opacity values in the same interaction state
**Validates: Requirements 7.5**

Property 12: Viewport constraint validation
*For any* panel width restored from storage, if it exceeds current viewport constraints, the system SHALL clamp it to valid bounds
**Validates: Requirements 6.5**

## Error Handling

### Resize Operation Errors

1. **Invalid Width Values**: Clamp to min/max constraints
2. **Viewport Overflow**: Recalculate based on current viewport
3. **Storage Quota Exceeded**: Fall back to default widths, log warning

### Logout Errors

1. **Storage Access Denied**: Continue logout, log warning
2. **Component Unmount Errors**: Catch and log, proceed with navigation
3. **State Update After Unmount**: Use cleanup functions and abort controllers

### Agent Flow Errors

1. **Preview Update Failures**: Display error overlay, allow retry
2. **Task Status Update Failures**: Queue for retry, show warning
3. **Scroll Position Loss**: Attempt recovery from last known position

## Testing Strategy

### Unit Testing

Unit tests will cover:
- ResizeHandle component rendering and interaction
- Panel width calculation functions
- Constraint validation logic
- Storage persistence helpers
- Logout cleanup functions

### Property-Based Testing

We will use **fast-check** for JavaScript/TypeScript property-based testing.

Each property-based test will:
- Run a minimum of 100 iterations
- Be tagged with the format: `**Feature: ui-panel-adjusters-and-ux-improvements, Property {number}: {property_text}**`
- Generate random but valid inputs within the domain
- Verify the property holds for all generated inputs

Example property test structure:
```typescript
import fc from 'fast-check';

describe('Panel Resizing Properties', () => {
  it('Property 1: Resize handle bounds enforcement', () => {
    /**
     * Feature: ui-panel-adjusters-and-ux-improvements, Property 1: Resize handle bounds enforcement
     * Validates: Requirements 1.4, 2.4, 3.4
     */
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 2000 }), // attempted width
        fc.constantFrom('missionControl', 'explorer'), // panel type
        (attemptedWidth, panelType) => {
          const result = clampPanelWidth(attemptedWidth, panelType, 1920);
          const constraints = PANEL_CONSTRAINTS[panelType];
          const maxWidth = typeof constraints.max === 'function' 
            ? constraints.max(1920) 
            : constraints.max;
          
          return result >= constraints.min && result <= maxWidth;
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Integration Testing

Integration tests will verify:
- Complete resize workflows across view modes
- Logout flow from different application states
- Agent workflow with preview updates
- Session persistence across page reloads

### Manual Testing Checklist

- [ ] Resize all panels in each view mode
- [ ] Verify neon glow effects on hover and drag
- [ ] Test logout from split, code, and preview modes
- [ ] Verify agent chat flow with real-time preview updates
- [ ] Test panel width persistence across browser refresh
- [ ] Verify responsive behavior on different screen sizes
- [ ] Test with minimum and maximum viewport sizes

## Implementation Notes

### Performance Considerations

1. **Resize Throttling**: Use `requestAnimationFrame` for smooth resize updates
2. **Storage Debouncing**: Debounce sessionStorage writes to avoid excessive I/O
3. **Component Memoization**: Memoize ResizeHandle to prevent unnecessary re-renders
4. **Event Listener Cleanup**: Ensure all mouse event listeners are properly removed

### Browser Compatibility

- Target modern browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- Use CSS custom properties for neon colors
- Fallback for browsers without sessionStorage support
- Test touch events for tablet/mobile support

### Accessibility

- Resize handles should be keyboard accessible (Tab navigation)
- Provide ARIA labels for screen readers
- Ensure sufficient color contrast for neon accents
- Support reduced motion preferences for animations

### Security

- Validate all values loaded from sessionStorage
- Sanitize panel width values to prevent injection
- Ensure logout clears sensitive data completely
- Prevent XSS through proper React rendering

## Deployment Considerations

### Rollout Strategy

1. Deploy ResizeHandle component first (non-breaking)
2. Add panel width state management
3. Implement Explorer panel resizer
4. Implement Mission Control resizer
5. Implement split view resizer
6. Fix logout functionality
7. Enhance agent flow feedback

### Monitoring

- Track resize operation performance
- Monitor sessionStorage usage
- Log logout success/failure rates
- Track agent workflow completion rates

### Rollback Plan

- Feature flags for each resizer
- Ability to disable persistence
- Fallback to fixed panel widths
- Preserve existing logout behavior as backup
