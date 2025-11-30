/**
 * @file analyticsService.ts
 * @description A mock analytics service for tracking user events.
 * 
 * This service simulates a real analytics integration (like Google Analytics, Mixpanel, etc.)
 * by logging events to the console. This allows us to instrument the application with tracking
 * calls without needing a full third-party library during development.
 */

interface EventProperties {
    [key: string]: any;
}

/**
 * Tracks a user event. In a real application, this would send data
 * to an analytics service.
 * 
 * @param eventName - The name of the event to track (e.g., 'agent_workflow_started').
 * @param properties - An object of key-value pairs with additional event data.
 */
export const trackEvent = (eventName: string, properties: EventProperties = {}): void => {
    // In a real app, you would replace this console.log with an actual analytics call.
    // For example:
    // mixpanel.track(eventName, properties);
    // analytics.track(eventName, properties);
    
    console.log('[ANALYTICS]', {
        event: eventName,
        properties,
        timestamp: new Date().toISOString(),
    });
};
