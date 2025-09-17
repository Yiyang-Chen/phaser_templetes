/**
 * 游戏通用类型定义
 * Common type definitions for the game
 */

// 基础游戏对象接口
export interface GameObject extends Phaser.GameObjects.GameObject {
    body?: Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody;
}

// 精灵对象接口
export interface GameSprite extends Phaser.Physics.Arcade.Sprite {
    body: Phaser.Physics.Arcade.Body;
}

// 静态精灵对象接口
export interface GameStaticSprite extends Phaser.Physics.Arcade.Sprite {
    body: Phaser.Physics.Arcade.StaticBody;
}

// 玩家类型
export interface IPlayer extends GameSprite {
    takeDamage(damage: number): void;
    getHealth(): number;
    getMaxHealth(): number;
    isPlayerMoving(): boolean;
    getLastDirection(): string;
    getWeapon(): IWeapon;
    isShooting(): boolean;
}

// 敌人类型
export interface IEnemy extends GameSprite {
    getDamage(): number;
    takeDamage(damage: number): void;
    getHealth(): number;
    die(): void;
}

// 战斗敌人类型
export interface IBattleEnemy extends IEnemy {
    getEnemyType(): string;
    setPlayer(player: IPlayer): void;
}

// 危险物品类型
export interface IHazard extends GameStaticSprite {
    getDamage(): number;
}

// 目标类型
export interface IGoal extends GameStaticSprite {
    isCollected(): boolean;
    collect(): void;
}

// 收集品类型
export interface ICollectible extends GameStaticSprite {
    isCollected(): boolean;
    collect(): void;
    getName(): string;
    getType(): string;
    getScore(): number;
    isMustCollect(): boolean;
    getProperties(): CollectibleProperties;
}

// 子弹类型
export interface IBullet extends GameSprite {
    hitTarget(): void;
    getBulletType(): string;
}

// 武器类型
export interface IWeapon extends Phaser.GameObjects.Sprite {
    shoot(targetX?: number, targetY?: number): boolean;
    isWeaponReady(): boolean;
    getWeaponType(): string;
    getWeaponName(): string;
    getWeaponIndex(): number;
    switchToNextWeapon(): void;
    switchToPreviousWeapon(): void;
    update(playerX: number, playerY: number, direction: string, isMoving: boolean, mouseX?: number, mouseY?: number): void;
}

// 收集品属性
export interface CollectibleProperties {
    [key: string]: string | number | boolean;
    score?: number;
    must_collect?: boolean;
    type?: string;
    rotate?: boolean;
    particle_color?: string;
}

// 敌人属性
export interface EnemyProperties {
    [key: string]: string | number | boolean;
    move_method?: string;
    move_speed?: number;
    jump_power?: number;
    patrol_distance?: number;
    detection_range?: number;
    jump_interval?: number;
    damage?: number;
    atlas?: boolean;
}

// 碰撞回调类型
export type CollisionCallback<T1 extends GameObject, T2 extends GameObject> = (
    object1: T1,
    object2: T2
) => void;

// 碰撞检测回调类型
export type OverlapCallback<T1 extends GameObject, T2 extends GameObject> = (
    object1: T1,
    object2: T2
) => void;

// 游戏场景类型
export interface IGameScene extends Phaser.Scene {
    player?: IPlayer;
    enemies?: Phaser.Physics.Arcade.Group;
    battleEnemies?: Phaser.Physics.Arcade.Group;
    bullets?: Phaser.Physics.Arcade.Group;
    collectibles?: Phaser.Physics.Arcade.StaticGroup;
    hazards?: Phaser.Physics.Arcade.StaticGroup;
    goals?: Phaser.Physics.Arcade.StaticGroup;
    restartGame?(): void;
    victory?(): void;
}

// Tilemap对象属性类型
export interface TilemapObjectProperty {
    name: string;
    type: string;
    value: any; // Tiled可以有各种类型的属性值
}

// Tilemap对象类型扩展
export interface ExtendedTiledObject extends Phaser.Types.Tilemaps.TiledObject {
    properties?: TilemapObjectProperty[];
}

// 对象池回调类型
export type PoolCreateCallback<T> = (obj: T) => void;
export type PoolRemoveCallback<T> = (obj: T) => void;

// 资源加载状态
export interface LoadingProgress {
    progress: number;
    file?: Phaser.Loader.File;
}

// 动画配置扩展类型
export interface AnimationFrameConfig {
    key: string;
    frame: string | number;
    duration?: number;
}

// 游戏状态类型
export type GameState = 'loading' | 'menu' | 'playing' | 'paused' | 'gameover' | 'victory';

// 敌人类型枚举
export type EnemyType = 'flying_creature' | 'goblin' | 'slime';

// 武器类型
export type WeaponType = string; // 可以根据需要更具体化

// 子弹类型
export type BulletType = 'bullets1' | 'bullets2' | 'bullets3' | 'bullet';

// 方向类型
export type Direction = 'up' | 'down' | 'left' | 'right' | 'idle';

// 游戏事件类型
export interface GameEvent {
    type: string;
    data?: any;
    timestamp: number;
}

// 音效配置类型
export interface SoundConfig {
    key: string;
    volume?: number;
    loop?: boolean;
    delay?: number;
}
