import { Scene } from 'phaser';
import { eventBus, GameEvent } from '../events/EventBus';

/**
 * BaseManager - Abstract base class for all game managers
 * 
 * Provides common functionality:
 * - Singleton pattern implementation
 * - Scene reference management
 * - Event bus integration
 * - Lifecycle management
 */
export abstract class BaseManager {
    protected scene: Scene | null = null;
    protected initialized: boolean = false;
    
    /**
     * Initialize the manager with a scene reference
     */
    public initialize(scene: Scene): void {
        if (this.initialized) {
            console.warn(`${this.constructor.name} already initialized`);
            return;
        }
        
        this.scene = scene;
        this.initialized = true;
        this.onInitialize();
        
        // Listen for scene shutdown to cleanup
        eventBus.on(GameEvent.SCENE_SHUTDOWN, () => {
            this.cleanup();
        });
    }
    
    /**
     * Force re-initialization (useful for scene restarts)
     */
    public forceReinitialize(scene: Scene): void {
        // 先进行清理
        this.onCleanup();
        // 然后重新初始化
        this.scene = scene;
        this.onInitialize();
    }
    
    /**
     * Check if manager is initialized
     */
    public isInitialized(): boolean {
        return this.initialized && this.scene !== null;
    }
    
    /**
     * Called when the manager is initialized
     * Override in subclasses for custom initialization logic
     */
    protected onInitialize(): void {
        // Override in subclasses
    }
    
    /**
     * Cleanup manager resources
     */
    public cleanup(): void {
        this.onCleanup();
        this.initialized = false;
        this.scene = null;
    }
    
    /**
     * Called when the manager is cleaned up
     * Override in subclasses for custom cleanup logic
     */
    protected onCleanup(): void {
        // Override in subclasses
    }
    
    
    /**
     * Get the current scene
     */
    protected getScene(): Scene {
        if (!this.scene) {
            throw new Error(`${this.constructor.name} not initialized with scene`);
        }
        return this.scene;
    }
}

/**
 * SingletonManager - Base class for singleton managers
 */
export abstract class SingletonManager extends BaseManager {
    private static instances: Map<string, SingletonManager> = new Map();
    
    /**
     * Get singleton instance
     */
    public static getInstance<T extends SingletonManager>(this: new () => T): T {
        const className = this.name;
        if (!SingletonManager.instances.has(className)) {
            SingletonManager.instances.set(className, new this());
        }
        return SingletonManager.instances.get(className) as T;
    }
    
    /**
     * Reset singleton instance (useful for testing)
     */
    public static resetInstance<T extends SingletonManager>(this: new () => T): void {
        const className = this.name;
        const instance = SingletonManager.instances.get(className);
        if (instance) {
            instance.cleanup();
            SingletonManager.instances.delete(className);
        }
    }
}
