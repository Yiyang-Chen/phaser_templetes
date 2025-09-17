import { SingletonManager } from '../core/BaseManager';
import { eventBus, GameEvent } from '../events/EventBus';

export enum GameState {
    MENU = 'menu',
    LOADING = 'loading',
    PLAYING = 'playing',
    PAUSED = 'paused',
    GAME_OVER = 'game_over',
    VICTORY = 'victory'
}

export interface GameSession {
    startTime: number;
    currentTime: number;
    elapsedTime: number;
    score: {
        total: number;
        items: number;
        time: number;
        kills: number;
    };
    stats: {
        killCount: number;
        itemsCollected: number;
        damageDealt: number;
        damageTaken: number;
    };
    difficulty: {
        multiplier: number;
        level: number;
    };
}

/**
 * GameStateManager - Centralized game state management
 * 
 * Manages:
 * - Current game state
 * - Game session data
 * - State transitions
 * - Persistent data
 */
export class GameStateManager extends SingletonManager {
    private currentState: GameState = GameState.MENU;
    private previousState: GameState = GameState.MENU;
    private session: GameSession | null = null;
    private stateHistory: GameState[] = [];
    
    protected onInitialize(): void {
        // Listen to game events to update state automatically
        eventBus.on(GameEvent.GAME_START, () => {
            this.startNewSession();
            this.setState(GameState.PLAYING);
        });
        
        eventBus.on(GameEvent.GAME_OVER, (data) => {
            this.endSession('game_over', data);
            this.setState(GameState.GAME_OVER);
        });
        
        eventBus.on(GameEvent.GAME_VICTORY, (data) => {
            this.endSession('victory', data);
            this.setState(GameState.VICTORY);
        });
        
        eventBus.on(GameEvent.GAME_PAUSE, () => {
            if (this.currentState === GameState.PLAYING) {
                this.setState(GameState.PAUSED);
            }
        });
        
        eventBus.on(GameEvent.GAME_RESUME, () => {
            if (this.currentState === GameState.PAUSED) {
                this.setState(GameState.PLAYING);
            }
        });
        
        eventBus.on(GameEvent.SCORE_UPDATE, (data) => {
            this.updateScore(data.source, data.delta);
        });
        
        eventBus.on(GameEvent.ENEMY_DEATH, () => {
            this.updateStats('killCount', 1);
        });
        
        eventBus.on(GameEvent.ITEM_COLLECT, () => {
            this.updateStats('itemsCollected', 1);
        });
        
        eventBus.on(GameEvent.PLAYER_DAMAGE, (data) => {
            this.updateStats('damageTaken', data.damage);
        });
    }
    
    /**
     * Set the current game state
     */
    public setState(newState: GameState): void {
        if (newState === this.currentState) {
            return;
        }
        
        this.previousState = this.currentState;
        this.currentState = newState;
        this.stateHistory.push(newState);
        
        // Keep history limited
        if (this.stateHistory.length > 10) {
            this.stateHistory.shift();
        }
        
        // Emit state change event
        eventBus.emit(GameEvent.SCENE_CHANGE, {
            from: this.previousState,
            to: this.currentState
        });
    }
    
    /**
     * Get current game state
     */
    public getState(): GameState {
        return this.currentState;
    }
    
    /**
     * Get previous game state
     */
    public getPreviousState(): GameState {
        return this.previousState;
    }
    
    /**
     * Check if in a specific state
     */
    public isState(state: GameState): boolean {
        return this.currentState === state;
    }
    
    /**
     * Check if game is currently playable
     */
    public isPlaying(): boolean {
        return this.currentState === GameState.PLAYING;
    }
    
    /**
     * Start a new game session
     */
    public startNewSession(): void {
        const now = Date.now();
        this.session = {
            startTime: now,
            currentTime: now,
            elapsedTime: 0,
            score: {
                total: 0,
                items: 0,
                time: 0,
                kills: 0
            },
            stats: {
                killCount: 0,
                itemsCollected: 0,
                damageDealt: 0,
                damageTaken: 0
            },
            difficulty: {
                multiplier: 1.0,
                level: 1
            }
        };
    }
    
    /**
     * Update current session time
     */
    public updateSessionTime(): void {
        if (!this.session || !this.isPlaying()) {
            return;
        }
        
        const now = Date.now();
        this.session.currentTime = now;
        this.session.elapsedTime = now - this.session.startTime;
    }
    
    /**
     * End current session
     */
    public endSession(reason: string, data?: any): void {
        if (!this.session) {
            return;
        }
        
        this.updateSessionTime();
        
        // Calculate final scores
        this.session.score.time = Math.floor(this.session.elapsedTime / 1000);
        this.session.score.total = this.session.score.items + this.session.score.time + this.session.score.kills;
        
        // Store session data for victory/game over screens
        if (data) {
            Object.assign(data, {
                session: this.session,
                finalScore: this.session.score.total,
                gameTime: this.session.elapsedTime,
                kills: this.session.stats.killCount
            });
        }
    }
    
    /**
     * Get current session data
     */
    public getSession(): GameSession | null {
        return this.session;
    }
    
    /**
     * Update score by category
     */
    public updateScore(category: string, delta: number): void {
        if (!this.session) {
            return;
        }
        
        switch (category) {
            case 'items':
                this.session.score.items += delta;
                break;
            case 'time':
                this.session.score.time += delta;
                break;
            case 'kills':
                this.session.score.kills += delta;
                break;
            default:
                // Add to total if category not recognized
                this.session.score.total += delta;
                break;
        }
    }
    
    /**
     * Update session statistics
     */
    public updateStats(stat: keyof GameSession['stats'], delta: number): void {
        if (!this.session) {
            return;
        }
        
        this.session.stats[stat] += delta;
    }
    
    /**
     * Update difficulty
     */
    public updateDifficulty(multiplier: number): void {
        if (!this.session) {
            return;
        }
        
        this.session.difficulty.multiplier = multiplier;
        this.session.difficulty.level = Math.floor(multiplier * 10);
        
        eventBus.emit(GameEvent.ENEMY_DIFFICULTY_UPDATE, {
            multiplier,
            gameTime: this.session.elapsedTime
        });
    }
    
    /**
     * Get formatted game time
     */
    public getFormattedTime(): string {
        if (!this.session) {
            return '00:00';
        }
        
        const seconds = Math.floor(this.session.elapsedTime / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    /**
     * Reset manager state
     */
    protected onCleanup(): void {
        this.currentState = GameState.MENU;
        this.previousState = GameState.MENU;
        this.session = null;
        this.stateHistory = [];
    }
}
