export enum GameEvent {
    // Scene events
    SCENE_CHANGE = 'scene:change',
    SCENE_START = 'scene:start',
    SCENE_PAUSE = 'scene:pause',
    SCENE_RESUME = 'scene:resume',
    SCENE_SHUTDOWN = 'scene:shutdown',
    
    // Player events
    PLAYER_MOVE = 'player:move',
    PLAYER_IDLE = 'player:idle',
    PLAYER_DAMAGE = 'player:damage',
    PLAYER_DEATH = 'player:death',
    PLAYER_RESPAWN = 'player:respawn',
    PLAYER_SHOOT = 'player:shoot',
    PLAYER_WEAPON_SWITCH = 'player:weapon_switch',
    
    // Animation events
    ANIMATION_PLAY = 'animation:play',
    ANIMATION_STOP = 'animation:stop',
    ANIMATION_COMPLETE = 'animation:complete',
    
    // Audio events
    BGM_PLAY = 'bgm:play',
    BGM_STOP = 'bgm:stop',
    BGM_PAUSE = 'bgm:pause',
    BGM_RESUME = 'bgm:resume',
    BGM_VOLUME_CHANGE = 'bgm:volume_change',
    
    SOUND_EFFECT_PLAY = 'sound:play',
    SOUND_EFFECT_STOP = 'sound:stop',
    SOUND_EFFECT_VOLUME_CHANGE = 'sound:volume_change',
    
    // Game events
    GAME_START = 'game:start',
    GAME_OVER = 'game:over',
    GAME_VICTORY = 'game:victory',
    GAME_PAUSE = 'game:pause',
    GAME_RESUME = 'game:resume',
    GAME_TIMER_UPDATE = 'game:timer_update',
    
    // Score events
    SCORE_UPDATE = 'score:update',
    SCORE_TIME_BONUS = 'score:time_bonus',
    SCORE_KILL_BONUS = 'score:kill_bonus',
    
    // Enemy events
    ENEMY_SPAWN = 'enemy:spawn',
    ENEMY_DEATH = 'enemy:death',
    ENEMY_ATTACK = 'enemy:attack',
    ENEMY_DIFFICULTY_UPDATE = 'enemy:difficulty_update',
    
    // Collectible events
    ITEM_COLLECT = 'item:collect',
    
    // Hazard events
    HAZARD_DAMAGE = 'hazard:damage'
}

export interface EventData {
    [GameEvent.SCENE_CHANGE]: {
        from: string;
        to: string;
    };
    [GameEvent.SCENE_START]: {
        scene: string;
    };
    [GameEvent.SCENE_PAUSE]: {
        scene: string;
    };
    [GameEvent.SCENE_RESUME]: {
        scene: string;
    };
    [GameEvent.SCENE_SHUTDOWN]: {
        scene: string;
    };
    
    [GameEvent.PLAYER_MOVE]: {
        player: any;
        direction: 'left' | 'right' | 'up' | 'down';
        velocity: { x: number; y: number };
    };
    [GameEvent.PLAYER_IDLE]: {
        player: any;
    };
    [GameEvent.PLAYER_DAMAGE]: {
        player: any;
        damage: number;
        source: string;
    };
    [GameEvent.PLAYER_DEATH]: {
        player: any;
        position: { x: number; y: number };
    };
    [GameEvent.PLAYER_RESPAWN]: {
        player: any;
        position: { x: number; y: number };
    };
    [GameEvent.PLAYER_SHOOT]: {
        player: any;
        weapon: string;
        direction: { x: number; y: number };
    };
    [GameEvent.PLAYER_WEAPON_SWITCH]: {
        player: any;
        oldWeapon: string;
        newWeapon: string;
    };
    
    [GameEvent.ANIMATION_PLAY]: {
        sprite: any;
        animation: string;
    };
    [GameEvent.ANIMATION_STOP]: {
        sprite: any;
    };
    [GameEvent.ANIMATION_COMPLETE]: {
        sprite: any;
        animation: string;
    };
    
    [GameEvent.BGM_PLAY]: {
        track: string;
        volume?: number;
    };
    [GameEvent.BGM_STOP]: {
        track?: string;
    };
    [GameEvent.BGM_PAUSE]: {
        track?: string;
    };
    [GameEvent.BGM_RESUME]: {
        track?: string;
    };
    [GameEvent.BGM_VOLUME_CHANGE]: {
        volume: number;
    };
    
    [GameEvent.SOUND_EFFECT_PLAY]: {
        sound: string;
        volume?: number;
    };
    [GameEvent.SOUND_EFFECT_STOP]: {
        sound: string;
    };
    [GameEvent.SOUND_EFFECT_VOLUME_CHANGE]: {
        volume: number;
    };
    
    [GameEvent.GAME_START]: void;
    [GameEvent.GAME_OVER]: {
        reason: string;
        finalScore: number;
        gameTime: number;
    };
    [GameEvent.GAME_VICTORY]: {
        finalScore: number;
        gameTime: number;
        kills: number;
    };
    [GameEvent.GAME_PAUSE]: void;
    [GameEvent.GAME_RESUME]: void;
    [GameEvent.GAME_TIMER_UPDATE]: {
        elapsed: number;
        timeScore: number;
    };
    
    [GameEvent.SCORE_UPDATE]: {
        score: number;
        delta: number;
        source: string;
    };
    [GameEvent.SCORE_TIME_BONUS]: {
        bonus: number;
        totalTime: number;
    };
    [GameEvent.SCORE_KILL_BONUS]: {
        bonus: number;
        enemyType: string;
        totalKills: number;
    };
    
    [GameEvent.ENEMY_SPAWN]: {
        enemy: any;
        type: string;
        position: { x: number; y: number };
    };
    [GameEvent.ENEMY_DEATH]: {
        enemy: any;
        type: string;
        position: { x: number; y: number };
        killedBy: string;
    };
    [GameEvent.ENEMY_ATTACK]: {
        enemy: any;
        target: any;
        damage: number;
    };
    [GameEvent.ENEMY_DIFFICULTY_UPDATE]: {
        multiplier: number;
        gameTime: number;
    };
    
    [GameEvent.ITEM_COLLECT]: {
        item: any;
        name: string;
        type: string;
        score: number;
        player: any;
    };
    
    [GameEvent.HAZARD_DAMAGE]: {
        hazard: any;
        target: any;
        damage: number;
    };
}

type EventCallback<T extends GameEvent> = EventData[T] extends void 
    ? () => void 
    : (data: EventData[T]) => void;

/**
 * EventBus - Centralized event management system
 * 
 * This singleton class provides:
 * - Type-safe event handling
 * - Decoupled communication between game components
 * - Debug mode for development
 * - Listener lifecycle management
 */
export class EventBus {
    private static instance: EventBus;
    private listeners: Map<GameEvent, Set<Function>> = new Map();
    private debugMode: boolean = false;
    
    private constructor() {}
    
    public static getInstance(): EventBus {
        if (!EventBus.instance) {
            EventBus.instance = new EventBus();
        }
        return EventBus.instance;
    }
    
    public on<T extends GameEvent>(event: T, callback: EventCallback<T>): void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event)!.add(callback);
        
        if (this.debugMode) {
            console.log(`[EventBus] Listener registered for ${event}`);
        }
    }
    
    public off<T extends GameEvent>(event: T, callback: EventCallback<T>): void {
        const callbacks = this.listeners.get(event);
        if (callbacks) {
            callbacks.delete(callback);
            if (callbacks.size === 0) {
                this.listeners.delete(event);
            }
            
            if (this.debugMode) {
                console.log(`[EventBus] Listener removed for ${event}`);
            }
        }
    }
    
    public once<T extends GameEvent>(event: T, callback: EventCallback<T>): void {
        const onceCallback: EventCallback<T> = (data: any) => {
            callback(data);
            this.off(event, onceCallback);
        };
        this.on(event, onceCallback);
    }
    
    public emit<T extends GameEvent>(event: T, ...args: EventData[T] extends void ? [] : [EventData[T]]): void {
        const data = args[0];
        if (this.debugMode) {
            console.log(`[EventBus] Event emitted: ${event}`, data);
        }
        
        const callbacks = this.listeners.get(event);
        if (callbacks) {
            callbacks.forEach(callback => {
                try {
                    if (data === undefined) {
                        (callback as () => void)();
                    } else {
                        callback(data);
                    }
                } catch (error) {
                    console.error(`[EventBus] Error in listener for ${event}:`, error);
                }
            });
        }
    }
    
    public removeAllListeners(event?: GameEvent): void {
        if (event) {
            this.listeners.delete(event);
            if (this.debugMode) {
                console.log(`[EventBus] All listeners removed for ${event}`);
            }
        } else {
            this.listeners.clear();
            if (this.debugMode) {
                console.log(`[EventBus] All listeners removed`);
            }
        }
    }
    
    public hasListeners(event: GameEvent): boolean {
        return this.listeners.has(event) && this.listeners.get(event)!.size > 0;
    }
    
    public getListenerCount(event?: GameEvent): number {
        if (event) {
            return this.listeners.get(event)?.size || 0;
        }
        let total = 0;
        this.listeners.forEach(callbacks => {
            total += callbacks.size;
        });
        return total;
    }
    
    public setDebugMode(enabled: boolean): void {
        this.debugMode = enabled;
        console.log(`[EventBus] Debug mode ${enabled ? 'enabled' : 'disabled'}`);
    }
    
    public reset(): void {
        this.removeAllListeners();
        if (this.debugMode) {
            console.log(`[EventBus] EventBus reset`);
        }
    }
}

// Export singleton instance for convenience
export const eventBus = EventBus.getInstance();

// Debug utility for development
export const eventBusDebugger = {
    enable: () => eventBus.setDebugMode(true),
    disable: () => eventBus.setDebugMode(false),
    listenerCount: (event?: GameEvent) => eventBus.getListenerCount(event),
    hasListeners: (event: GameEvent) => eventBus.hasListeners(event)
};
