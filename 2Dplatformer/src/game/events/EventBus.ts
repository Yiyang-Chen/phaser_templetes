export enum GameEvent {
    // Scene events
    SCENE_CHANGE = 'scene:change',
    SCENE_START = 'scene:start',
    SCENE_PAUSE = 'scene:pause',
    SCENE_RESUME = 'scene:resume',
    SCENE_SHUTDOWN = 'scene:shutdown',
    
    // Player events
    PLAYER_JUMP = 'player:jump',
    PLAYER_DOUBLE_JUMP = 'player:double_jump',
    PLAYER_WALL_JUMP = 'player:wall_jump',
    PLAYER_MOVE = 'player:move',
    PLAYER_IDLE = 'player:idle',
    PLAYER_DAMAGE = 'player:damage',
    PLAYER_DEATH = 'player:death',
    PLAYER_RESPAWN = 'player:respawn',
    
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
    
    // Item events
    ITEM_COLLECT = 'item:collect',
    GOAL_REACHED = 'goal:reached',
    
    // Enemy events
    ENEMY_SPAWN = 'enemy:spawn',
    ENEMY_DEATH = 'enemy:death',
    ENEMY_ATTACK = 'enemy:attack',
    
    // Obstacle events
    OBSTACLE_DESTROYED = 'obstacle:destroyed'
}

export interface EventData {
    [GameEvent.SCENE_CHANGE]: {
        from: string;
        to: string;
    };
    [GameEvent.SCENE_START]: {
        scene: string;
        level?: number;
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
    
    [GameEvent.PLAYER_JUMP]: {
        player: any;
        velocity: number;
    };
    [GameEvent.PLAYER_DOUBLE_JUMP]: {
        player: any;
        jumpCount: number;
    };
    [GameEvent.PLAYER_WALL_JUMP]: {
        player: any;
        direction: 'left' | 'right';
    };
    [GameEvent.PLAYER_MOVE]: {
        player: any;
        direction: 'left' | 'right';
        velocity: number;
    };
    [GameEvent.PLAYER_IDLE]: {
        player: any;
    };
    [GameEvent.PLAYER_DAMAGE]: {
        player: any;
        damage: number;
        health: number;
    };
    [GameEvent.PLAYER_DEATH]: {
        player: any;
    };
    [GameEvent.PLAYER_RESPAWN]: {
        player: any;
        position: { x: number; y: number };
    };
    
    [GameEvent.ANIMATION_PLAY]: {
        sprite: any;
        atlasKey: string;
        animationName: string;
    };
    [GameEvent.ANIMATION_STOP]: {
        sprite: any;
        animationName: string;
    };
    [GameEvent.ANIMATION_COMPLETE]: {
        sprite: any;
        animationName: string;
    };
    
    [GameEvent.BGM_PLAY]: {
        key: string;
        volume?: number;
        loop?: boolean;
    };
    [GameEvent.BGM_STOP]: {
        key?: string;
    };
    [GameEvent.BGM_PAUSE]: void;
    [GameEvent.BGM_RESUME]: void;
    [GameEvent.BGM_VOLUME_CHANGE]: {
        volume: number;
    };
    
    [GameEvent.SOUND_EFFECT_PLAY]: {
        key: string;
        volume?: number;
        atlasKey?: string;
        animationName?: string;
    };
    [GameEvent.SOUND_EFFECT_STOP]: {
        key?: string;
    };
    [GameEvent.SOUND_EFFECT_VOLUME_CHANGE]: {
        volume: number;
    };
    
    [GameEvent.GAME_START]: void;
    [GameEvent.GAME_OVER]: {
        reason?: string;
    };
    [GameEvent.GAME_VICTORY]: {
        score?: number;
    };
    [GameEvent.GAME_PAUSE]: void;
    [GameEvent.GAME_RESUME]: void;
    
    [GameEvent.ITEM_COLLECT]: {
        item: any;
        type: string;
        value?: number;
    };
    [GameEvent.GOAL_REACHED]: {
        player: any;
    };
    
    [GameEvent.ENEMY_SPAWN]: {
        enemy: any;
        position: { x: number; y: number };
    };
    [GameEvent.ENEMY_DEATH]: {
        enemy: any;
    };
    [GameEvent.ENEMY_ATTACK]: {
        enemy: any;
        target: any;
    };
    
    [GameEvent.OBSTACLE_DESTROYED]: {
        x: number;
        y: number;
        type: string;
    };
}

type EventCallback<T extends GameEvent> = EventData[T] extends void 
    ? () => void 
    : (data: EventData[T]) => void;

export class EventBus {
    private static instance: EventBus;
    private listeners: Map<GameEvent, Set<EventCallback<any>>> = new Map();
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
        const onceCallback = (data: any) => {
            if (data === undefined) {
                (callback as () => void)();
            } else {
                (callback as (data: any) => void)(data);
            }
            this.off(event, onceCallback as EventCallback<T>);
        };
        this.on(event, onceCallback as EventCallback<T>);
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
        console.log('[EventBus] Reset complete');
    }
}

export const eventBus = EventBus.getInstance();