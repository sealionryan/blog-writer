/**
 * Local Storage Utilities
 * Handles saving and retrieving workflow data
 */

class StorageManager {
    constructor() {
        this.prefix = 'blog-workflow-';
    }

    /**
     * Save workflow data to localStorage
     */
    saveWorkflow(workflowId, data) {
        try {
            const key = this.prefix + workflowId;
            localStorage.setItem(key, JSON.stringify({
                ...data,
                timestamp: Date.now(),
                version: '1.0'
            }));
            return true;
        } catch (error) {
            console.error('Failed to save workflow:', error);
            return false;
        }
    }

    /**
     * Load workflow data from localStorage
     */
    loadWorkflow(workflowId) {
        try {
            const key = this.prefix + workflowId;
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Failed to load workflow:', error);
            return null;
        }
    }

    /**
     * Get all workflow IDs
     */
    getAllWorkflows() {
        const workflows = [];
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(this.prefix)) {
                    const workflowId = key.replace(this.prefix, '');
                    const data = this.loadWorkflow(workflowId);
                    if (data) {
                        workflows.push({
                            id: workflowId,
                            timestamp: data.timestamp,
                            title: data.inputs?.title || 'Untitled',
                            status: data.status || 'unknown'
                        });
                    }
                }
            }
            return workflows.sort((a, b) => b.timestamp - a.timestamp);
        } catch (error) {
            console.error('Failed to get workflows:', error);
            return [];
        }
    }

    /**
     * Delete a workflow
     */
    deleteWorkflow(workflowId) {
        try {
            const key = this.prefix + workflowId;
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Failed to delete workflow:', error);
            return false;
        }
    }

    /**
     * Clear all workflows
     */
    clearAllWorkflows() {
        try {
            const keys = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(this.prefix)) {
                    keys.push(key);
                }
            }
            keys.forEach(key => localStorage.removeItem(key));
            return true;
        } catch (error) {
            console.error('Failed to clear workflows:', error);
            return false;
        }
    }

    /**
     * Save user preferences
     */
    savePreferences(preferences) {
        try {
            localStorage.setItem('blog-workflow-preferences', JSON.stringify(preferences));
            return true;
        } catch (error) {
            console.error('Failed to save preferences:', error);
            return false;
        }
    }

    /**
     * Load user preferences
     */
    loadPreferences() {
        try {
            const data = localStorage.getItem('blog-workflow-preferences');
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('Failed to load preferences:', error);
            return {};
        }
    }

    /**
     * Generate a unique workflow ID
     */
    generateWorkflowId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * Get storage usage info
     */
    getStorageInfo() {
        try {
            let totalSize = 0;
            let workflowCount = 0;
            
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(this.prefix)) {
                    const value = localStorage.getItem(key);
                    totalSize += (key.length + (value ? value.length : 0));
                    workflowCount++;
                }
            }
            
            return {
                workflowCount,
                totalSize,
                totalSizeKB: Math.round(totalSize / 1024),
                available: this.isStorageAvailable()
            };
        } catch (error) {
            console.error('Failed to get storage info:', error);
            return { workflowCount: 0, totalSize: 0, totalSizeKB: 0, available: false };
        }
    }

    /**
     * Check if localStorage is available
     */
    isStorageAvailable() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (error) {
            return false;
        }
    }
}

// Export for use in other modules
window.StorageManager = StorageManager;