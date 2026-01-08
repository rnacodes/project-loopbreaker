import { createContext, useContext, useState, useEffect } from 'react';

const DemoAdminContext = createContext(null);

const STORAGE_KEY = 'demoAdminKey';

export const useDemoAdmin = () => {
    const context = useContext(DemoAdminContext);
    if (!context) {
        throw new Error('useDemoAdmin must be used within a DemoAdminProvider');
    }
    return context;
};

export const DemoAdminProvider = ({ children }) => {
    const [isAdminMode, setIsAdminMode] = useState(false);
    const [adminKey, setAdminKey] = useState(null);

    // Check for existing key in sessionStorage on mount
    useEffect(() => {
        const storedKey = sessionStorage.getItem(STORAGE_KEY);
        if (storedKey) {
            setAdminKey(storedKey);
            setIsAdminMode(true);
        }
    }, []);

    const enableAdminMode = (key) => {
        if (!key || key.trim() === '') {
            return { success: false, error: 'Admin key is required' };
        }

        sessionStorage.setItem(STORAGE_KEY, key);
        setAdminKey(key);
        setIsAdminMode(true);
        return { success: true };
    };

    const disableAdminMode = () => {
        sessionStorage.removeItem(STORAGE_KEY);
        setAdminKey(null);
        setIsAdminMode(false);
    };

    const getAdminKey = () => {
        return adminKey;
    };

    const value = {
        isAdminMode,
        enableAdminMode,
        disableAdminMode,
        getAdminKey
    };

    return (
        <DemoAdminContext.Provider value={value}>
            {children}
        </DemoAdminContext.Provider>
    );
};
