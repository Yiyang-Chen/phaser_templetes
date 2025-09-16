# Code Extension and Abstraction Guide

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Core Design Patterns](#core-design-patterns)
3. [Extension Points](#extension-points)
4. [Creating New Game Objects](#creating-new-game-objects)
5. [Abstract Base Classes](#abstract-base-classes)
6. [Manager Pattern Extensions](#manager-pattern-extensions)
7. [Event System Extensions](#event-system-extensions)
8. [UI Component System](#ui-component-system)
9. [Best Practices](#best-practices)
10. [Common Extension Scenarios](#common-extension-scenarios)

## Architecture Overview

### System Layers
```
┌─────────────────────────────────────┐
│         Main Entry Point            │
│         (main.ts)                   │
└─────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│         Scene Management            │
│   Boot(preload+create) → Preloader → Game │
└─────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│         Core Systems                │
│  ┌──────────┬──────────┬─────────┐ │
│  │ EventBus │ Managers │  Utils  │ │
│  │          │ Resource │         │ │
│  │          │ Manager  │         │ │
│  │          │ Audio    │         │ │
│  │          │ Animation│         │ │
│  └──────────┴──────────┴─────────┘ │
└─────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│       Game Objects Layer           │
│  ┌──────────┬──────────┬─────────┐ │
│  │ Sprites  │    UI    │ Effects │ │
│  └──────────┴──────────┴─────────┘ │
└─────────────────────────────────────┘
```

### Key Architectural Principles
1. **Singleton Managers**: Centralized system control
2. **Event-Driven Communication**: Loose coupling between components
3. **Property-Based Configuration**: Data-driven object behavior
4. **Composition Over Inheritance**: Flexible object capabilities
5. **Unified Resource Management**: Local/remote asset loading through configuration

## Core Design Patterns

### 1. Singleton Pattern
Used in all manager classes for global state management.

```typescript
export class CustomManager {
    private static instance: CustomManager;
    
    private constructor() {
        // Private constructor prevents direct instantiation
    }
    
    public static getInstance(): CustomManager {
        if (!CustomManager.instance) {
            CustomManager.instance = new CustomManager();
        }
        return CustomManager.instance;
    }
    
    public reset(): void {
        // Reset manager state
    }
}
```

### 2. Observer Pattern (EventBus)
Enables decoupled communication between components.

```typescript
// Define new event
export enum CustomEvent {
    POWER_UP_COLLECTED = 'powerup:collected'
}

// Extend EventData interface
interface CustomEventData {
    [CustomEvent.POWER_UP_COLLECTED]: {
        type: string;
        duration: number;
    };
}

// Emit event
eventBus.emit(CustomEvent.POWER_UP_COLLECTED, {
    type: 'speed',
    duration: 5000
});

// Listen to event
eventBus.on(CustomEvent.POWER_UP_COLLECTED, (data) => {
    console.log(`Power-up collected: ${data.type}`);
});
```

### 3. Factory Pattern
For creating game objects from tilemap data.

```typescript
export class GameObjectFactory {
    static createObject(
        scene: Scene,
        tiledObject: Phaser.Types.Tilemaps.TiledObject
    ): Phaser.GameObjects.GameObject | null {
        switch (tiledObject.type) {
            case 'player':
                return new Player(scene, tiledObject);
            case 'enemy':
                return new Enemy(scene, tiledObject);
            case 'custom_type':
                return new CustomObject(scene, tiledObject);
            default:
                console.warn(`Unknown object type: ${tiledObject.type}`);
                return null;
        }
    }
}
```

## Extension Points

### 1. Adding New Object Types

#### Step 1: Create the Sprite Class
```typescript
// src/game/sprites/PowerUp.ts
import { Scene } from 'phaser';
import { eventBus, GameEvent } from '../events/EventBus';

export class PowerUp extends Phaser.Physics.Arcade.Sprite {
    private powerType: string;
    private duration: number;
    private effect: string;
    
    constructor(scene: Scene, tiledObject: Phaser.Types.Tilemaps.TiledObject) {
        const x = tiledObject.x || 0;
        const y = tiledObject.y || 0;
        const texture = tiledObject.name || 'powerup';
        
        super(scene, x, y - 32, texture);
        
        scene.add.existing(this);
        scene.physics.add.existing(this, true);
        
        // Parse properties
        this.extractProperties(tiledObject);
        
        // Setup animations
        this.createAnimations();
    }
    
    private extractProperties(tiledObject: Phaser.Types.Tilemaps.TiledObject): void {
        const properties = tiledObject.properties as any[];
        if (properties) {
            properties.forEach(prop => {
                switch (prop.name) {
                    case 'power_type':
                        this.powerType = prop.value;
                        break;
                    case 'duration':
                        this.duration = prop.value;
                        break;
                    case 'effect':
                        this.effect = prop.value;
                        break;
                }
            });
        }
    }
    
    private createAnimations(): void {
        // Floating animation
        this.scene.tweens.add({
            targets: this,
            y: this.y - 10,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // Glow effect
        this.scene.tweens.add({
            targets: this,
            alpha: { from: 0.7, to: 1 },
            duration: 500,
            yoyo: true,
            repeat: -1
        });
    }
    
    collect(player: any): void {
        // Apply power-up effect
        this.applyEffect(player);
        
        // Emit event
        eventBus.emit(GameEvent.ITEM_COLLECT, {
            item: this,
            type: 'powerup',
            value: this.duration
        });
        
        // Visual feedback
        this.createCollectionEffect();
        
        // Destroy
        this.destroy();
    }
    
    private applyEffect(player: any): void {
        switch (this.powerType) {
            case 'speed':
                player.applySpeedBoost(this.duration);
                break;
            case 'invincibility':
                player.applyInvincibility(this.duration);
                break;
            case 'double_damage':
                player.applyDoubleDamage(this.duration);
                break;
        }
    }
    
    private createCollectionEffect(): void {
        // Particle burst
        for (let i = 0; i < 10; i++) {
            const particle = this.scene.add.circle(
                this.x,
                this.y,
                3,
                0xffff00
            );
            
            const angle = (Math.PI * 2 / 10) * i;
            const speed = 200;
            
            this.scene.physics.add.existing(particle);
            const body = particle.body as Phaser.Physics.Arcade.Body;
            body.setVelocity(
                Math.cos(angle) * speed,
                Math.sin(angle) * speed
            );
            
            this.scene.tweens.add({
                targets: particle,
                alpha: 0,
                scale: 0,
                duration: 500,
                onComplete: () => particle.destroy()
            });
        }
    }
}
```

#### Step 2: Register in Game Scene
```typescript
// In Game.ts createObjectsFromTilemap()
case 'powerup':
    const powerup = new PowerUp(this, tiledObject);
    this.physics.add.overlap(this.player, powerup, () => {
        powerup.collect(this.player);
    });
    break;
```

### 2. Creating New Managers

```typescript
// src/game/managers/PowerUpManager.ts
export interface ActivePowerUp {
    type: string;
    startTime: number;
    duration: number;
    effect: any;
}

export class PowerUpManager {
    private static instance: PowerUpManager;
    private activePowerUps: Map<string, ActivePowerUp> = new Map();
    private scene: Scene | null = null;
    
    private constructor() {}
    
    public static getInstance(): PowerUpManager {
        if (!PowerUpManager.instance) {
            PowerUpManager.instance = new PowerUpManager();
        }
        return PowerUpManager.instance;
    }
    
    public init(scene: Scene): void {
        this.scene = scene;
        this.setupEventListeners();
    }
    
    private setupEventListeners(): void {
        eventBus.on(GameEvent.ITEM_COLLECT, (data) => {
            if (data.type === 'powerup') {
                this.activatePowerUp(data.item);
            }
        });
    }
    
    public activatePowerUp(powerUp: any): void {
        const active: ActivePowerUp = {
            type: powerUp.powerType,
            startTime: this.scene!.time.now,
            duration: powerUp.duration,
            effect: powerUp.effect
        };
        
        this.activePowerUps.set(powerUp.powerType, active);
        
        // Schedule deactivation
        this.scene!.time.delayedCall(powerUp.duration, () => {
            this.deactivatePowerUp(powerUp.powerType);
        });
    }
    
    public deactivatePowerUp(type: string): void {
        this.activePowerUps.delete(type);
        
        // Emit deactivation event
        eventBus.emit('powerup:deactivated', { type });
    }
    
    public isActive(type: string): boolean {
        return this.activePowerUps.has(type);
    }
    
    public getActivePowerUps(): ActivePowerUp[] {
        return Array.from(this.activePowerUps.values());
    }
    
    public update(): void {
        // Check for expired power-ups
        const now = this.scene!.time.now;
        
        this.activePowerUps.forEach((powerUp, type) => {
            if (now - powerUp.startTime >= powerUp.duration) {
                this.deactivatePowerUp(type);
            }
        });
    }
    
    public reset(): void {
        this.activePowerUps.clear();
    }
}
```

## Abstract Base Classes

### 1. BaseSprite - Common Sprite Functionality

```typescript
// src/game/sprites/BaseSprite.ts
import { Scene } from 'phaser';
import { GameObjectManager } from '../managers/GameObjectManager';

export abstract class BaseSprite extends Phaser.Physics.Arcade.Sprite {
    protected uuid: string;
    protected spriteType: string;
    protected properties: Map<string, any> = new Map();
    
    constructor(
        scene: Scene,
        x: number,
        y: number,
        texture: string,
        type: string
    ) {
        super(scene, x, y, texture);
        
        this.spriteType = type;
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.setupPhysics();
        this.registerWithManager();
    }
    
    protected abstract setupPhysics(): void;
    
    protected registerWithManager(): void {
        if (this.uuid) {
            GameObjectManager.getInstance().registerObject(
                this.uuid,
                this,
                this.spriteType,
                this.texture.key
            );
        }
    }
    
    protected extractProperties(tiledObject: Phaser.Types.Tilemaps.TiledObject): void {
        const properties = tiledObject.properties as any[];
        if (properties) {
            properties.forEach(prop => {
                this.properties.set(prop.name, prop.value);
                if (prop.name === 'uuid') {
                    this.uuid = prop.value;
                }
            });
        }
    }
    
    public getProperty(name: string): any {
        return this.properties.get(name);
    }
    
    public setProperty(name: string, value: any): void {
        this.properties.set(name, value);
    }
    
    public destroy(): void {
        if (this.uuid) {
            GameObjectManager.getInstance().unregisterObject(this.uuid);
        }
        super.destroy();
    }
}
```

### 2. BaseEnemy - Common Enemy Behavior

```typescript
// src/game/sprites/BaseEnemy.ts
import { BaseSprite } from './BaseSprite';
import { eventBus, GameEvent } from '../events/EventBus';

export abstract class BaseEnemy extends BaseSprite {
    protected health: number = 1;
    protected damage: number = 1;
    protected moveSpeed: number = 100;
    protected player: any = null;
    protected isDead: boolean = false;
    
    constructor(scene: Scene, tiledObject: Phaser.Types.Tilemaps.TiledObject) {
        const x = tiledObject.x || 0;
        const y = tiledObject.y || 0;
        const texture = tiledObject.name || 'enemy';
        
        super(scene, x, y - 32, texture, 'enemy');
        
        this.extractProperties(tiledObject);
        this.applyProperties();
    }
    
    protected applyProperties(): void {
        this.health = this.getProperty('health') || 1;
        this.damage = this.getProperty('damage') || 1;
        this.moveSpeed = this.getProperty('move_speed') || 100;
    }
    
    protected setupPhysics(): void {
        this.setBounce(0.1);
        this.setGravityY(800);
        this.setCollideWorldBounds(true);
    }
    
    public takeDamage(amount: number): void {
        if (this.isDead) return;
        
        this.health -= amount;
        
        if (this.health <= 0) {
            this.die();
        } else {
            this.showDamageEffect();
        }
    }
    
    protected showDamageEffect(): void {
        // Flash red
        this.setTint(0xff0000);
        this.scene.time.delayedCall(100, () => {
            this.clearTint();
        });
    }
    
    protected die(): void {
        if (this.isDead) return;
        this.isDead = true;
        
        // Emit death event
        eventBus.emit(GameEvent.ENEMY_DEATH, { enemy: this });
        
        // Death animation
        this.createDeathEffect();
        
        // Destroy
        this.destroy();
    }
    
    protected abstract createDeathEffect(): void;
    
    public abstract update(time: number, delta: number): void;
    
    public setPlayer(player: any): void {
        this.player = player;
    }
    
    public getDamage(): number {
        return this.damage;
    }
}
```

### 3. BaseUI - Common UI Component

```typescript
// src/game/ui/BaseUI.ts
import { Scene } from 'phaser';

export abstract class BaseUI {
    protected scene: Scene;
    protected container: Phaser.GameObjects.Container;
    protected x: number;
    protected y: number;
    protected visible: boolean = true;
    
    constructor(scene: Scene, x: number, y: number) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        
        this.container = scene.add.container(x, y);
        this.container.setScrollFactor(0);
        this.container.setDepth(1000);
        
        this.createElements();
    }
    
    protected abstract createElements(): void;
    
    public show(): void {
        this.visible = true;
        this.scene.tweens.add({
            targets: this.container,
            alpha: 1,
            duration: 200
        });
    }
    
    public hide(): void {
        this.visible = false;
        this.scene.tweens.add({
            targets: this.container,
            alpha: 0,
            duration: 200
        });
    }
    
    public setPosition(x: number, y: number): void {
        this.x = x;
        this.y = y;
        this.container.setPosition(x, y);
    }
    
    public destroy(): void {
        this.container.destroy();
    }
}
```

## Manager Pattern Extensions

### 1. Extending Existing Managers

```typescript
// Extend AnimationManager for custom animations
export class ExtendedAnimationManager extends AnimationManager {
    private customEffects: Map<string, Phaser.GameObjects.Particles.ParticleEmitter> = new Map();
    
    createParticleAnimation(
        key: string,
        config: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig
    ): void {
        const emitter = this.scene.add.particles(0, 0, 'particle', config);
        this.customEffects.set(key, emitter);
    }
    
    playParticleAnimation(key: string, x: number, y: number): void {
        const emitter = this.customEffects.get(key);
        if (emitter) {
            emitter.setPosition(x, y);
            emitter.start();
        }
    }
}
```

### 2. Manager Registry Pattern

```typescript
// src/game/managers/ManagerRegistry.ts
export class ManagerRegistry {
    private static managers: Map<string, any> = new Map();
    
    static register(name: string, manager: any): void {
        this.managers.set(name, manager);
    }
    
    static get<T>(name: string): T | undefined {
        return this.managers.get(name) as T;
    }
    
    static initAll(scene: Scene): void {
        this.managers.forEach(manager => {
            if (typeof manager.init === 'function') {
                manager.init(scene);
            }
        });
    }
    
    static resetAll(): void {
        this.managers.forEach(manager => {
            if (typeof manager.reset === 'function') {
                manager.reset();
            }
        });
    }
}

// Usage
ManagerRegistry.register('powerup', PowerUpManager.getInstance());
ManagerRegistry.register('animation', AnimationManager.getInstance());

// In scene
ManagerRegistry.initAll(this);
```

## Event System Extensions

### 1. Custom Event System

```typescript
// src/game/events/CustomEventBus.ts
export class CustomEventBus extends EventBus {
    private eventHistory: Array<{ event: string; data: any; timestamp: number }> = [];
    private eventFilters: Map<string, (data: any) => boolean> = new Map();
    
    emit<T extends GameEvent>(event: T, ...args: any[]): void {
        // Log event to history
        this.eventHistory.push({
            event,
            data: args[0],
            timestamp: Date.now()
        });
        
        // Apply filters
        const filter = this.eventFilters.get(event);
        if (filter && !filter(args[0])) {
            return; // Event filtered out
        }
        
        super.emit(event, ...args);
    }
    
    addFilter(event: string, filter: (data: any) => boolean): void {
        this.eventFilters.set(event, filter);
    }
    
    removeFilter(event: string): void {
        this.eventFilters.delete(event);
    }
    
    getEventHistory(event?: string): any[] {
        if (event) {
            return this.eventHistory.filter(e => e.event === event);
        }
        return this.eventHistory;
    }
    
    clearHistory(): void {
        this.eventHistory = [];
    }
}
```

### 2. Event Priority System

```typescript
// src/game/events/PriorityEventBus.ts
interface PriorityListener {
    callback: Function;
    priority: number;
}

export class PriorityEventBus {
    private listeners: Map<string, PriorityListener[]> = new Map();
    
    on(event: string, callback: Function, priority: number = 0): void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        
        const listeners = this.listeners.get(event)!;
        listeners.push({ callback, priority });
        
        // Sort by priority (higher priority first)
        listeners.sort((a, b) => b.priority - a.priority);
    }
    
    emit(event: string, data?: any): void {
        const listeners = this.listeners.get(event);
        if (listeners) {
            for (const listener of listeners) {
                listener.callback(data);
            }
        }
    }
}
```

## UI Component System

### 1. Reusable UI Components

```typescript
// src/game/ui/components/Button.ts
export class UIButton extends BaseUI {
    private button: Phaser.GameObjects.Rectangle;
    private text: Phaser.GameObjects.Text;
    private onClick: () => void;
    
    constructor(
        scene: Scene,
        x: number,
        y: number,
        width: number,
        height: number,
        label: string,
        onClick: () => void
    ) {
        super(scene, x, y);
        this.onClick = onClick;
    }
    
    protected createElements(): void {
        // Background
        this.button = this.scene.add.rectangle(0, 0, 200, 50, 0x4444ff);
        this.button.setInteractive();
        
        // Text
        this.text = this.scene.add.text(0, 0, 'Button', {
            fontSize: '20px',
            color: '#ffffff'
        });
        this.text.setOrigin(0.5);
        
        // Add to container
        this.container.add([this.button, this.text]);
        
        // Setup interactions
        this.setupInteractions();
    }
    
    private setupInteractions(): void {
        this.button.on('pointerdown', () => {
            this.button.setScale(0.95);
            this.onClick();
        });
        
        this.button.on('pointerup', () => {
            this.button.setScale(1);
        });
        
        this.button.on('pointerover', () => {
            this.button.setFillStyle(0x6666ff);
        });
        
        this.button.on('pointerout', () => {
            this.button.setFillStyle(0x4444ff);
        });
    }
}
```

### 2. UI Layout System

```typescript
// src/game/ui/UILayout.ts
export class UILayout {
    static arrangeHorizontal(
        elements: Phaser.GameObjects.GameObject[],
        startX: number,
        y: number,
        spacing: number
    ): void {
        let currentX = startX;
        
        elements.forEach(element => {
            element.setPosition(currentX, y);
            const bounds = element.getBounds();
            currentX += bounds.width + spacing;
        });
    }
    
    static arrangeVertical(
        elements: Phaser.GameObjects.GameObject[],
        x: number,
        startY: number,
        spacing: number
    ): void {
        let currentY = startY;
        
        elements.forEach(element => {
            element.setPosition(x, currentY);
            const bounds = element.getBounds();
            currentY += bounds.height + spacing;
        });
    }
    
    static arrangeGrid(
        elements: Phaser.GameObjects.GameObject[],
        startX: number,
        startY: number,
        columns: number,
        spacingX: number,
        spacingY: number
    ): void {
        elements.forEach((element, index) => {
            const col = index % columns;
            const row = Math.floor(index / columns);
            
            element.setPosition(
                startX + col * spacingX,
                startY + row * spacingY
            );
        });
    }
}
```

## Best Practices

### 1. Property-Driven Development

```typescript
// Define configurable properties in tilemap
interface CustomObjectConfig {
    speed?: number;
    health?: number;
    damage?: number;
    behavior?: string;
    [key: string]: any;
}

// Use properties to configure behavior
export class ConfigurableObject extends BaseSprite {
    private config: CustomObjectConfig = {};
    
    constructor(scene: Scene, tiledObject: Phaser.Types.Tilemaps.TiledObject) {
        super(scene, tiledObject.x!, tiledObject.y! - 32, tiledObject.name!, 'custom');
        
        this.extractProperties(tiledObject);
        this.applyConfiguration();
    }
    
    private applyConfiguration(): void {
        // Apply all properties as configuration
        this.properties.forEach((value, key) => {
            this.config[key] = value;
        });
        
        // Use configuration to set behavior
        if (this.config.speed) {
            this.setVelocityX(this.config.speed);
        }
        
        if (this.config.behavior) {
            this.setBehavior(this.config.behavior);
        }
    }
    
    private setBehavior(behavior: string): void {
        switch (behavior) {
            case 'patrol':
                this.enablePatrolBehavior();
                break;
            case 'follow':
                this.enableFollowBehavior();
                break;
            // Add more behaviors
        }
    }
    
    protected setupPhysics(): void {
        // Default physics setup
    }
}
```

### 2. Composition Pattern

```typescript
// Component interfaces
interface Movable {
    move(x: number, y: number): void;
    setVelocity(x: number, y: number): void;
}

interface Damageable {
    takeDamage(amount: number): void;
    heal(amount: number): void;
    getHealth(): number;
}

interface Collectible {
    collect(collector: any): void;
    getValue(): number;
}

// Composite game object
export class CompositeGameObject extends BaseSprite 
    implements Movable, Damageable, Collectible {
    
    private healthComponent: HealthComponent;
    private movementComponent: MovementComponent;
    private collectibleComponent: CollectibleComponent;
    
    constructor(scene: Scene, config: any) {
        super(scene, config.x, config.y, config.texture, config.type);
        
        // Compose with components
        this.healthComponent = new HealthComponent(config.health);
        this.movementComponent = new MovementComponent(this, config.speed);
        this.collectibleComponent = new CollectibleComponent(config.value);
    }
    
    // Delegate to components
    move(x: number, y: number): void {
        this.movementComponent.move(x, y);
    }
    
    setVelocity(x: number, y: number): void {
        this.movementComponent.setVelocity(x, y);
    }
    
    takeDamage(amount: number): void {
        this.healthComponent.takeDamage(amount);
        if (this.healthComponent.isDead()) {
            this.destroy();
        }
    }
    
    heal(amount: number): void {
        this.healthComponent.heal(amount);
    }
    
    getHealth(): number {
        return this.healthComponent.getHealth();
    }
    
    collect(collector: any): void {
        this.collectibleComponent.collect(collector);
        this.destroy();
    }
    
    getValue(): number {
        return this.collectibleComponent.getValue();
    }
    
    protected setupPhysics(): void {
        // Physics setup
    }
}
```

### 3. Plugin System

```typescript
// src/game/plugins/BasePlugin.ts
export abstract class BasePlugin {
    protected scene: Scene;
    protected enabled: boolean = true;
    
    constructor(scene: Scene) {
        this.scene = scene;
    }
    
    abstract init(): void;
    abstract update(time: number, delta: number): void;
    abstract destroy(): void;
    
    enable(): void {
        this.enabled = true;
    }
    
    disable(): void {
        this.enabled = false;
    }
    
    isEnabled(): boolean {
        return this.enabled;
    }
}

// Example plugin
export class DebugPlugin extends BasePlugin {
    private debugText: Phaser.GameObjects.Text;
    
    init(): void {
        this.debugText = this.scene.add.text(10, 10, '', {
            fontSize: '12px',
            color: '#00ff00'
        });
        this.debugText.setScrollFactor(0);
        this.debugText.setDepth(9999);
    }
    
    update(time: number, delta: number): void {
        if (!this.enabled) return;
        
        const player = this.scene.player;
        if (player) {
            this.debugText.setText([
                `FPS: ${Math.round(1000 / delta)}`,
                `Player: (${Math.round(player.x)}, ${Math.round(player.y)})`,
                `Velocity: (${Math.round(player.body.velocity.x)}, ${Math.round(player.body.velocity.y)})`,
                `Objects: ${this.scene.children.length}`
            ]);
        }
    }
    
    destroy(): void {
        this.debugText.destroy();
    }
}

// Plugin manager
export class PluginManager {
    private plugins: Map<string, BasePlugin> = new Map();
    
    register(name: string, plugin: BasePlugin): void {
        this.plugins.set(name, plugin);
        plugin.init();
    }
    
    unregister(name: string): void {
        const plugin = this.plugins.get(name);
        if (plugin) {
            plugin.destroy();
            this.plugins.delete(name);
        }
    }
    
    update(time: number, delta: number): void {
        this.plugins.forEach(plugin => {
            if (plugin.isEnabled()) {
                plugin.update(time, delta);
            }
        });
    }
    
    get(name: string): BasePlugin | undefined {
        return this.plugins.get(name);
    }
}
```

## Common Extension Scenarios

### 1. Adding New Enemy Type

```typescript
// src/game/sprites/FlyingEnemy.ts
export class FlyingEnemy extends BaseEnemy {
    private amplitude: number = 50;
    private frequency: number = 0.002;
    private baseY: number;
    
    constructor(scene: Scene, tiledObject: Phaser.Types.Tilemaps.TiledObject) {
        super(scene, tiledObject);
        this.baseY = this.y;
        
        // Flying enemies don't have gravity
        this.setGravityY(0);
    }
    
    protected setupPhysics(): void {
        // No gravity for flying enemies
        this.setGravityY(0);
        this.setBounce(0);
    }
    
    public update(time: number, delta: number): void {
        if (this.isDead) return;
        
        // Sine wave movement
        this.y = this.baseY + Math.sin(time * this.frequency) * this.amplitude;
        
        // Move towards player if in range
        if (this.player) {
            const distance = Phaser.Math.Distance.Between(
                this.x, this.y,
                this.player.x, this.player.y
            );
            
            if (distance < 300) {
                const angle = Phaser.Math.Angle.Between(
                    this.x, this.y,
                    this.player.x, this.player.y
                );
                
                this.setVelocityX(Math.cos(angle) * this.moveSpeed);
            } else {
                this.setVelocityX(0);
            }
        }
    }
    
    protected createDeathEffect(): void {
        // Feather particles for flying enemy
        for (let i = 0; i < 8; i++) {
            const feather = this.scene.add.rectangle(
                this.x,
                this.y,
                10,
                5,
                0xffffff
            );
            
            this.scene.physics.add.existing(feather);
            const body = feather.body as Phaser.Physics.Arcade.Body;
            
            body.setVelocity(
                Phaser.Math.Between(-100, 100),
                Phaser.Math.Between(-50, -150)
            );
            body.setGravityY(100);
            body.setAngularVelocity(Phaser.Math.Between(-300, 300));
            
            this.scene.tweens.add({
                targets: feather,
                alpha: 0,
                duration: 1000,
                onComplete: () => feather.destroy()
            });
        }
    }
}
```

### 2. Adding Save System

```typescript
// src/game/managers/SaveManager.ts
export interface SaveData {
    level: number;
    score: number;
    health: number;
    position: { x: number; y: number };
    collectibles: string[];
    timestamp: number;
}

export class SaveManager {
    private static instance: SaveManager;
    private readonly SAVE_KEY = 'game_save';
    
    public static getInstance(): SaveManager {
        if (!SaveManager.instance) {
            SaveManager.instance = new SaveManager();
        }
        return SaveManager.instance;
    }
    
    save(data: SaveData): boolean {
        try {
            data.timestamp = Date.now();
            localStorage.setItem(this.SAVE_KEY, JSON.stringify(data));
            
            eventBus.emit('save:success', data);
            return true;
        } catch (error) {
            console.error('Save failed:', error);
            eventBus.emit('save:failed', error);
            return false;
        }
    }
    
    load(): SaveData | null {
        try {
            const saveString = localStorage.getItem(this.SAVE_KEY);
            if (saveString) {
                return JSON.parse(saveString);
            }
        } catch (error) {
            console.error('Load failed:', error);
        }
        return null;
    }
    
    hasSave(): boolean {
        return localStorage.getItem(this.SAVE_KEY) !== null;
    }
    
    deleteSave(): void {
        localStorage.removeItem(this.SAVE_KEY);
    }
    
    autoSave(scene: any): void {
        const saveData: SaveData = {
            level: scene.currentLevel,
            score: scene.score,
            health: scene.player.health,
            position: {
                x: scene.player.x,
                y: scene.player.y
            },
            collectibles: scene.collectedItems,
            timestamp: Date.now()
        };
        
        this.save(saveData);
    }
}
```

### 3. Adding Dialogue System

```typescript
// src/game/systems/DialogueSystem.ts
export interface DialogueNode {
    id: string;
    speaker: string;
    text: string;
    choices?: DialogueChoice[];
    next?: string;
}

export interface DialogueChoice {
    text: string;
    next: string;
    condition?: () => boolean;
}

export class DialogueSystem {
    private scene: Scene;
    private dialogueBox: Phaser.GameObjects.Container;
    private dialogueText: Phaser.GameObjects.Text;
    private speakerText: Phaser.GameObjects.Text;
    private choices: Phaser.GameObjects.Text[] = [];
    private currentNode: DialogueNode | null = null;
    private dialogueData: Map<string, DialogueNode> = new Map();
    
    constructor(scene: Scene) {
        this.scene = scene;
        this.createDialogueBox();
    }
    
    private createDialogueBox(): void {
        const { width, height } = this.scene.cameras.main;
        
        this.dialogueBox = this.scene.add.container(width / 2, height - 150);
        this.dialogueBox.setScrollFactor(0);
        this.dialogueBox.setDepth(2000);
        
        // Background
        const bg = this.scene.add.rectangle(0, 0, width - 100, 200, 0x000000, 0.8);
        bg.setStrokeStyle(2, 0xffffff);
        
        // Speaker name
        this.speakerText = this.scene.add.text(-width / 2 + 70, -80, '', {
            fontSize: '20px',
            color: '#ffff00'
        });
        
        // Dialogue text
        this.dialogueText = this.scene.add.text(-width / 2 + 70, -40, '', {
            fontSize: '16px',
            color: '#ffffff',
            wordWrap: { width: width - 140 }
        });
        
        this.dialogueBox.add([bg, this.speakerText, this.dialogueText]);
        this.dialogueBox.setVisible(false);
    }
    
    loadDialogue(dialogueData: DialogueNode[]): void {
        dialogueData.forEach(node => {
            this.dialogueData.set(node.id, node);
        });
    }
    
    startDialogue(nodeId: string): void {
        const node = this.dialogueData.get(nodeId);
        if (!node) return;
        
        this.currentNode = node;
        this.showDialogue(node);
    }
    
    private showDialogue(node: DialogueNode): void {
        this.dialogueBox.setVisible(true);
        this.speakerText.setText(node.speaker);
        
        // Typewriter effect
        this.typewriterEffect(node.text, () => {
            if (node.choices) {
                this.showChoices(node.choices);
            } else {
                this.showContinuePrompt();
            }
        });
    }
    
    private typewriterEffect(text: string, onComplete: () => void): void {
        let index = 0;
        this.dialogueText.setText('');
        
        const timer = this.scene.time.addEvent({
            delay: 30,
            callback: () => {
                this.dialogueText.setText(text.substring(0, index));
                index++;
                
                if (index > text.length) {
                    timer.destroy();
                    onComplete();
                }
            },
            loop: true
        });
    }
    
    private showChoices(choices: DialogueChoice[]): void {
        const validChoices = choices.filter(
            choice => !choice.condition || choice.condition()
        );
        
        validChoices.forEach((choice, index) => {
            const choiceText = this.scene.add.text(
                -this.scene.cameras.main.width / 2 + 70,
                20 + index * 30,
                `${index + 1}. ${choice.text}`,
                {
                    fontSize: '16px',
                    color: '#ffffff'
                }
            );
            
            choiceText.setInteractive();
            choiceText.on('pointerdown', () => {
                this.selectChoice(choice);
            });
            
            this.dialogueBox.add(choiceText);
            this.choices.push(choiceText);
        });
    }
    
    private selectChoice(choice: DialogueChoice): void {
        this.clearChoices();
        
        if (choice.next) {
            this.startDialogue(choice.next);
        } else {
            this.endDialogue();
        }
    }
    
    private clearChoices(): void {
        this.choices.forEach(choice => choice.destroy());
        this.choices = [];
    }
    
    private showContinuePrompt(): void {
        const prompt = this.scene.add.text(
            this.scene.cameras.main.width / 2 - 100,
            80,
            '[Press SPACE]',
            {
                fontSize: '14px',
                color: '#888888'
            }
        );
        
        this.dialogueBox.add(prompt);
        
        const spaceKey = this.scene.input.keyboard?.addKey('SPACE');
        spaceKey?.once('down', () => {
            prompt.destroy();
            
            if (this.currentNode?.next) {
                this.startDialogue(this.currentNode.next);
            } else {
                this.endDialogue();
            }
        });
    }
    
    private endDialogue(): void {
        this.dialogueBox.setVisible(false);
        this.currentNode = null;
        eventBus.emit('dialogue:ended');
    }
}
```

## Conclusion

This guide provides a comprehensive framework for extending the codebase through:

1. **Abstract Base Classes**: Reduce code duplication and enforce consistent interfaces
2. **Manager Pattern**: Centralize system control and state management
3. **Event-Driven Architecture**: Enable loose coupling between components
4. **Composition Pattern**: Build complex behaviors from simple components
5. **Plugin System**: Add optional features without modifying core code

Key principles for extension:
- **Property-Driven**: Use tilemap properties for configuration
- **Event-Based**: Communicate through EventBus for decoupling
- **Singleton Managers**: Centralize global state and functionality
- **Composition Over Inheritance**: Build flexible objects through composition
- **Type Safety**: Leverage TypeScript for robust extensions
- **Resource Management**: Use GlobalResourceManager for unified asset loading

## 🆕 Resource Management System Extensions

### 系统概述

资源管理系统位于 `src/game/resourceManager/` 目录，提供统一的本地/远程资源加载能力：

```
src/game/resourceManager/
├── GlobalResourceManager.ts     # 全局资源管理器（单例）
├── LoaderExtensions.ts         # 加载器扩展注册
├── CustomLoader/               # 自定义加载器
│   ├── GameConfigLoader.ts     # 游戏配置加载器
│   ├── AudioConfigLoader.ts    # 音频配置加载器
│   └── CustomTileMapLoader.ts  # 瓦片地图加载器
└── CustomLoadFile/             # 自定义文件类型
    ├── AudioConfigFile.ts      # 音频配置文件
    └── CustomTilemapFile.ts    # 自定义瓦片地图文件
```

### 添加新资源类型

#### 1. 扩展GameConfig接口

```typescript
// 在 GlobalResourceManager.ts 中扩展接口
interface CustomResourceConfig extends ResourceConfig {
    local?: {
        key: string;
        resource_type: 'custom_type';
        full_path: string;
        custom_property?: any;
    };
    remote?: {
        key: string;
        resource_type: 'custom_type';
        url: string;
        custom_property?: any;
    };
}

// Create custom loader
export function registerCustomResourceLoader(): void {
    Loader.LoaderPlugin.prototype.customResource = function(key: string, configPath: string) {
        const resourceManager = GlobalResourceManager.getInstance();
        
        // Load configuration
        this.json(key, configPath);
        
        this.once('filecomplete-json-' + key, (fileKey: string, type: string, data: any) => {
            // Process custom resources
            data.customResources?.forEach((resourceKey: string) => {
                const resource = resourceManager.getResource(resourceKey);
                if (resource && resource.local?.resource_type === 'custom_type') {
                    const actualPath = resourceManager.getResourcePath(resourceKey);
                    if (actualPath) {
                        // Add to loading queue with custom handling
                        this.customLoad(resourceKey, actualPath, resource.local.custom_property);
                    }
                }
            });
        });

        return this;
    };
}
```

### Resource Management Best Practices

```typescript
// Use resource manager in custom components
export class CustomGameObject extends BaseSprite {
    private resourceManager = GlobalResourceManager.getInstance();
    
    constructor(scene: Scene, config: any) {
        super(scene, config.x, config.y, config.texture, 'custom');
        
        // Load additional resources dynamically
        this.loadCustomResources(config.resources);
    }
    
    private async loadCustomResources(resourceKeys: string[]): Promise<void> {
        for (const key of resourceKeys) {
            const resource = this.resourceManager.getResource(key);
            if (resource) {
                const actualPath = this.resourceManager.getResourcePath(key);
                if (actualPath) {
                    // Load resource based on type
                    await this.loadResourceByType(key, actualPath, resource);
                }
            }
        }
    }
    
    private async loadResourceByType(key: string, path: string, resource: ResourceConfig): Promise<void> {
        const resourceType = resource.local?.resource_type || resource.remote?.resource_type;
        
        switch (resourceType) {
            case 'image':
                this.scene.load.image(key, path);
                break;
            case 'audio':
                this.scene.load.audio(key, path);
                break;
            case 'json':
                this.scene.load.json(key, path);
                break;
            // Add more resource types as needed
        }
        
        return new Promise((resolve) => {
            this.scene.load.once('complete', resolve);
            this.scene.load.start();
        });
    }
}
```

By following these patterns and practices, you can extend the game engine while maintaining code quality, reusability, and maintainability. The unified resource management system provides a solid foundation for scalable asset handling across local and remote deployments.