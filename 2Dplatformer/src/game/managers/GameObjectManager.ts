import { UUIDGenerator } from '../utils/UUIDGenerator';

export interface GameObjectWithUUID {
    uuid: string;
    object: Phaser.GameObjects.GameObject;
    type: string;
    name?: string;
}

export class GameObjectManager {
    private static instance: GameObjectManager;
    private gameObjects: Map<string, GameObjectWithUUID>;

    private constructor() {
        this.gameObjects = new Map();
    }

    /**
     * Get the singleton instance of GameObjectManager
     */
    static getInstance(): GameObjectManager {
        if (!GameObjectManager.instance) {
            GameObjectManager.instance = new GameObjectManager();
        }
        return GameObjectManager.instance;
    }

    /**
     * Register a game object with its UUID
     * @param uuid The UUID of the object (from tilemap or generated)
     * @param object The Phaser GameObject
     * @param type The type of the object (player, enemy, collectible, etc.)
     * @param name Optional name of the object
     */
    registerObject(uuid: string, object: Phaser.GameObjects.GameObject, type: string, name?: string): void {
        if (uuid === undefined || uuid === null || uuid === '') {
            console.warn(`Invalid UUID: ${uuid}. Generating a new one.`);
            uuid = UUIDGenerator.generate();
        }

        this.gameObjects.set(uuid, {
            uuid,
            object,
            type,
            name
        });

        // Store UUID in the GameObject's data for easy reference
        object.setData('uuid', uuid);
    }

    /**
     * Get a game object by its UUID
     * @param uuid The UUID of the object to retrieve
     * @returns The GameObjectWithUUID or undefined if not found
     */
    getObjectByUUID(uuid: string): GameObjectWithUUID | undefined {
        return this.gameObjects.get(uuid);
    }

    /**
     * Get all objects of a specific type
     * @param type The type of objects to retrieve
     * @returns Array of GameObjectWithUUID matching the type
     */
    getObjectsByType(type: string): GameObjectWithUUID[] {
        const results: GameObjectWithUUID[] = [];
        this.gameObjects.forEach(obj => {
            if (obj.type === type) {
                results.push(obj);
            }
        });
        return results;
    }

    /**
     * Remove an object from the manager
     * @param uuid The UUID of the object to remove
     * @returns True if the object was removed, false if not found
     */
    removeObject(uuid: string): boolean {
        return this.gameObjects.delete(uuid);
    }
    
    /**
     * Unregister an object from the manager (alias for removeObject)
     * @param uuid The UUID of the object to unregister
     * @returns True if the object was removed, false if not found
     */
    unregisterObject(uuid: string): boolean {
        return this.removeObject(uuid);
    }

    /**
     * Clear all registered objects
     */
    clear(): void {
        this.gameObjects.clear();
    }

    /**
     * Get all registered objects
     * @returns Array of all GameObjectWithUUID
     */
    getAllObjects(): GameObjectWithUUID[] {
        return Array.from(this.gameObjects.values());
    }

    /**
     * Check if an object with the given UUID exists
     * @param uuid The UUID to check
     * @returns True if the object exists, false otherwise
     */
    hasObject(uuid: string): boolean {
        return this.gameObjects.has(uuid);
    }

    /**
     * Get the UUID of a GameObject
     * @param object The GameObject to get the UUID for
     * @returns The UUID or undefined if not found
     */
    getUUIDForObject(object: Phaser.GameObjects.GameObject): string | undefined {
        for (const [uuid, obj] of this.gameObjects.entries()) {
            if (obj.object === object) {
                return uuid;
            }
        }
        return undefined;
    }

    /**
     * Debug: Log all registered objects
     */
    debugLogObjects(): void {
        console.log('Registered GameObjects:');
        this.gameObjects.forEach((obj, uuid) => {
            console.log(`  UUID: ${uuid}, Type: ${obj.type}, Name: ${obj.name || 'unnamed'}`);
        });
    }
}