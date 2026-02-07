import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const DemoReadOnlyContext = createContext(null);

export const useDemoReadOnly = () => {
    const context = useContext(DemoReadOnlyContext);
    if (!context) {
        throw new Error('useDemoReadOnly must be used within a DemoReadOnlyProvider');
    }
    return context;
};

export const DemoReadOnlyProvider = ({ children }) => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [blockedAction, setBlockedAction] = useState(null);
    // Track when user last dismissed to avoid repeated popups
    const [lastDismissedAt, setLastDismissedAt] = useState(0);

    const showReadOnlyDialog = useCallback((actionInfo = null) => {
        // Don't show if dismissed within the last 2 seconds (prevents rapid re-triggering)
        const now = Date.now();
        if (now - lastDismissedAt < 2000) {
            return;
        }
        setBlockedAction(actionInfo);
        setIsDialogOpen(true);
    }, [lastDismissedAt]);

    const hideReadOnlyDialog = useCallback(() => {
        setIsDialogOpen(false);
        setBlockedAction(null);
        setLastDismissedAt(Date.now());
    }, []);

    // Listen for custom event from apiClient
    useEffect(() => {
        const handleDemoWriteBlocked = (event) => {
            showReadOnlyDialog(event.detail);
        };

        window.addEventListener('demoWriteBlocked', handleDemoWriteBlocked);
        return () => {
            window.removeEventListener('demoWriteBlocked', handleDemoWriteBlocked);
        };
    }, [showReadOnlyDialog]);

    const value = {
        isDialogOpen,
        blockedAction,
        showReadOnlyDialog,
        hideReadOnlyDialog,
    };

    return (
        <DemoReadOnlyContext.Provider value={value}>
            {children}
        </DemoReadOnlyContext.Provider>
    );
};

export default DemoReadOnlyContext;
