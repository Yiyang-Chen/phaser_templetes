import { Scene } from 'phaser';
import { Player } from '../sprites/Player';
import { StaticHazard } from '../sprites/StaticHazard';


import { Collectible } from '../sprites/Collectible';
import { BattleEnemy } from '../sprites/BattleEnemy';
import { OptimizedBullet } from '../sprites/OptimizedBullet';
import { HealthUI } from '../ui/HealthUI';
import { CollectedItemsManager } from '../managers/CollectedItemsManager';
import { EnemySpawner } from '../managers/EnemySpawner';
import { ObjectPoolManager } from '../managers/ObjectPoolManager';
import { ConfigManager } from '../config/ConfigManager';
import { GameStateManager } from '../managers/GameStateManager';
import { SafetyUtils } from '../utils/SafetyUtils';
import { eventBus, GameEvent } from '../events/EventBus';
import type { IGameScene } from '../types/GameTypes';

export class Game extends Scene implements IGameScene
{
    camera: Phaser.Cameras.Scene2D.Camera;
    background: Phaser.GameObjects.Image;
    msg_text : Phaser.GameObjects.Text;
    map: Phaser.Tilemaps.Tilemap;
    tilesets: Phaser.Tilemaps.Tileset[];
    layers: Phaser.Tilemaps.TilemapLayer[];
    player: Player;
    hazards: Phaser.Physics.Arcade.StaticGroup;

    collectibles: Phaser.Physics.Arcade.StaticGroup;
    battleEnemies: Phaser.Physics.Arcade.Group;
    bullets: Phaser.Physics.Arcade.Group;
    enemySpawner: EnemySpawner;
    restartKey: Phaser.Input.Keyboard.Key;
    isVictory: boolean = false;
    healthUI: HealthUI;
    scoreText: Phaser.GameObjects.Text;
    timerText: Phaser.GameObjects.Text;
    weaponInfoText: Phaser.GameObjects.Text;
    collectedItemsManager: CollectedItemsManager;
    
    // 计时器相关
    private gameStartTime: number = 0;
    private gameElapsedTime: number = 0;
    private timerEvent: Phaser.Time.TimerEvent | null = null;
    private timeScore: number = 0;
    
    // 击杀得分相关
    private killCount: number = 0;
    private killScore: number = 0;
    
    // 配置管理器
    private configManager: ConfigManager;
    private objectPoolManager: ObjectPoolManager;
    private gameStateManager: GameStateManager;

    constructor ()
    {
        super('Game');
        this.collectedItemsManager = CollectedItemsManager.getInstance();
        this.configManager = ConfigManager.getInstance();
        this.objectPoolManager = ObjectPoolManager.getInstance();
        
        // 对于GameStateManager，只获取实例，不重新初始化
        this.gameStateManager = GameStateManager.getInstance();
        if (!this.gameStateManager.isInitialized()) {
            this.gameStateManager.initialize(this);
        }
    }

    create ()
    {
        // Emit scene start event
        eventBus.emit(GameEvent.SCENE_START, { scene: 'Game' });
        
        // Reset collected items manager for new game
        this.collectedItemsManager.reset();
        
        // Initialize timer
        this.initializeTimer();
        
        // Initialize object pools
        this.initializeObjectPools();
        
        this.camera = this.cameras.main;
        this.camera.setBackgroundColor(0x87CEEB);

        // Create the tilemap first
        this.map = this.make.tilemap({ key: 'tilemap' });
        
        // Add background image after tilemap is created
        if (this.textures.exists('background')) {
            // 背景图片是1024x768，游戏屏幕也是1024x768，应该1:1显示
            this.background = this.add.image(512, 384, 'background');
            this.background.setScrollFactor(0.5); // 背景滚动速度较慢，产生视差效果
            
            // 背景加载完成
        } else {
            console.error('Background texture not found');
        }

        // Load tilesets from tilemap config using safe methods
        this.tilesets = [];
        this.map.tilesets.forEach((tileset: Phaser.Tilemaps.Tileset) => {
            const addedTileset = SafetyUtils.safeAddTileset(this.map, tileset.name, tileset.name, this);
            if (addedTileset) {
                this.tilesets.push(addedTileset);
            }
        });

        // find tilemap layer.
        this.layers = [];
        this.map.getTileLayerNames().forEach((tileLayerName: string) => {
            const layer = this.map.createLayer(tileLayerName, this.tilesets, 0, 0);
            if (layer) {
                this.layers.push(layer);
                layer.setCollisionByProperty({ collides: true });
                
                // 使用统一配置的tilemap缩放
                const tilemapConfig = this.configManager.getTilemapConstants();
                layer.setScale(tilemapConfig.scale, tilemapConfig.scale);
                
                // Ensure layer is visible
                //layer.setVisible(true);
                //layer.setAlpha(1);
            } else {
                console.error('Failed to create layer:', tileLayerName);
            }
        })

        this.createObjectsFromTilemap()
        
        // 创建战斗系统
        this.createBattleSystem();

        // Create collides events
        this.createOverleapEvents();
        
        // Setup restart key (R key)
        this.restartKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.R);
        
        // Create UI using configuration
        this.createUI();
        
        // 设置自定义鼠标光标
        this.setupCustomCursor();
    }
    
    private initializeObjectPools(): void {
        const bulletConfig = this.configManager.getBulletConfig();
        
        // 初始化子弹对象池
        OptimizedBullet.initializePool(this, bulletConfig.poolSize);
        this.objectPoolManager.setMaxPoolSize('bullets', bulletConfig.maxPoolSize);
        
        if (this.configManager.getDebugConfig().enableLogging) {
            // 对象池初始化完成
        }
    }
    
    private createUI(): void {
        const uiConfig = this.configManager.getUIConfig();
        
        // Create health UI
        this.healthUI = new HealthUI(this, uiConfig.healthUI.x, uiConfig.healthUI.y);
        if (this.player) {
            this.healthUI.updateHealth(this.player.getHealth());
        }
        
        // Create score UI - 放置在屏幕中上方
        const centerX = this.cameras.main.width / 2;
        this.scoreText = this.add.text(centerX - 80, 30, 'Score: 0', {
            fontSize: '24px',
            color: '#FFFFFF',
            stroke: '#000000',
            strokeThickness: 3
        });
        this.scoreText.setScrollFactor(0);
        this.scoreText.setDepth(1000);
        this.scoreText.setOrigin(0.5, 0);
        
        // Create timer UI - 放置在得分右侧
        this.timerText = this.add.text(centerX + 80, 30, 'Time: 00:00', {
            fontSize: '24px',
            color: '#FFFFFF',
            stroke: '#000000',
            strokeThickness: 3
        });
        this.timerText.setScrollFactor(0);
        this.timerText.setDepth(1000);
        this.timerText.setOrigin(0.5, 0);
        
        // Create weapon switch instruction UI
        const weaponSwitchText = this.add.text(uiConfig.instructionUI.x, uiConfig.instructionUI.y, 'Weapons: Q/E to switch', {
            fontSize: uiConfig.instructionUI.fontSize,
            color: uiConfig.colors.text,
            stroke: uiConfig.colors.stroke,
            strokeThickness: uiConfig.strokeThickness - 1
        });
        weaponSwitchText.setScrollFactor(0);
        weaponSwitchText.setDepth(uiConfig.depth);
        
        // Create weapon info UI
        this.weaponInfoText = this.add.text(uiConfig.weaponUI.x, uiConfig.weaponUI.y, 'Weapon: Loading...', {
            fontSize: uiConfig.weaponUI.fontSize,
            color: uiConfig.colors.weaponText,
            stroke: uiConfig.colors.stroke,
            strokeThickness: uiConfig.strokeThickness - 1
        });
        this.weaponInfoText.setScrollFactor(0);
        this.weaponInfoText.setDepth(uiConfig.depth);
    }

    private createObjectsFromTilemap() {
        this.map.getObjectLayerNames().forEach(((objectLayerName: string) => {
            let objectLayer = this.map.getObjectLayer(objectLayerName);

            objectLayer?.objects.forEach((obj: Phaser.Types.Tilemaps.TiledObject) => {
                this.createObject(obj)
            })
        }))
    }

    private createObject(obj: Phaser.Types.Tilemaps.TiledObject) {
        switch (obj.type) {
            case "player":
                this.createPlayerFromTilemap(obj);
                return
            case "hazard":
                this.createHazardFromTilemap(obj);
                return

            case "collectible":
                this.createCollectibleFromTilemap(obj);
                return
            case "enemy":
                // 旧敌人系统已移除，所有敌人都通过EnemySpawner动态生成
                console.warn("Tilemap enemy objects are deprecated. Use EnemySpawner for all enemies.");
                return
            case "goal":
                // Goal对象已移除，忽略tilemap中的goal对象
                console.log("Goal objects are no longer needed, skipping:", obj.name);
                return
            default:
                console.log("unknown object type", obj.type);
        }
    }

    private createPlayerFromTilemap(playerObject: Phaser.Types.Tilemaps.TiledObject) {
        // if player is already created, then skip.
        if (this.player) {
            return;
        }
        
        // 创建玩家精灵，使用骑士待机精灵表
        this.player = new Player(this, {
            ...playerObject,
            name: 'knight_idle' // 使用骑士精灵表
        });

        // Set up collides between player and tilemap layers
        this.layers.forEach(layer => {
            this.physics.add.collider(this.player, layer);
        });

        // Set camera bounds to match the scaled tilemap size
        // 使用统一配置的tilemap缩放
        const tilemapConfig = this.configManager.getTilemapConstants();
        const scaledWidth = this.map.widthInPixels * tilemapConfig.scale;
        const scaledHeight = this.map.heightInPixels * tilemapConfig.scale;
        this.cameras.main.setBounds(0, 0, scaledWidth, scaledHeight);
        
        // Make camera follow the player with configured lerp
        const cameraConfig = this.configManager.getCameraConfig();
        this.cameras.main.startFollow(this.player);
        this.cameras.main.setLerp(cameraConfig.lerp.x, cameraConfig.lerp.y);

        // Set world bounds for physics
        this.physics.world.setBounds(0, 0, scaledWidth, scaledHeight);
        
        // 地图尺寸已设置
    }

    private createHazardFromTilemap(hazardObject: Phaser.Types.Tilemaps.TiledObject) {
        // 创建静态危险（包括spikes）
        if (!this.hazards) {
            this.hazards = this.physics.add.staticGroup();
        }
        
        const hazard = new StaticHazard(this, hazardObject);
        this.hazards.add(hazard);
    }
    

    
    private createCollectibleFromTilemap(collectibleObject: Phaser.Types.Tilemaps.TiledObject) {
        if (!this.collectibles) {
            this.collectibles = this.physics.add.staticGroup();
        }
        
        const collectible = new Collectible(this, collectibleObject);
        this.collectibles.add(collectible);
        
        // Track must-collect items
        if (collectible.isMustCollect()) {
            this.collectedItemsManager.addMustCollectItem(collectible.getName());
        }
    }
    
    // 已移除：createGoalFromTilemap 方法
    // Goal对象不再需要
    
    // 已移除：createEnemyFromTilemap 方法
    // 所有敌人现在都通过 EnemySpawner 动态生成

    private createOverleapEvents() {
        // Setup player vs hazards overlap detection
        if (this.player && this.hazards) {
            this.physics.add.overlap(
                this.player, 
                this.hazards, 
                this.handlePlayerHazardCollision, 
                undefined, 
                this
            );
        }
        

        

        
        // Setup player vs collectibles overlap detection
        if (this.player && this.collectibles) {
            this.physics.add.overlap(
                this.player,
                this.collectibles,
                this.handlePlayerCollectibleCollision,
                undefined,
                this
            );
        }
        
        // 已移除：Goal碰撞检测
        // Goal对象不再需要
        
        // 已移除：旧敌人系统的碰撞检测
        
        // Setup player vs battle enemies overlap detection
        if (this.player && this.battleEnemies && this.battleEnemies.children) {
            this.physics.add.overlap(
                this.player,
                this.battleEnemies,
                this.handlePlayerBattleEnemyCollision,
                undefined,
                this
            );
        }
        
        // Setup bullet vs battle enemies collision detection
        if (this.bullets && this.battleEnemies && this.battleEnemies.children) {
            this.physics.add.overlap(
                this.bullets,
                this.battleEnemies,
                this.handleBulletEnemyCollision,
                undefined,
                this
            );
        }
    }

    private handlePlayerHazardCollision(player: any, hazard: any): void {
        const hazardInstance = hazard as StaticHazard;
        const playerInstance = player as Player;
        
        playerInstance.takeDamage(hazardInstance.getDamage());
        
        // Update health UI
        if (this.healthUI) {
            this.healthUI.updateHealth(playerInstance.getHealth());
        }
    }
    

    

    

    
    private handlePlayerCollectibleCollision(_player: any, collectible: any): void {
        const collectibleInstance = collectible as Collectible;
        if (collectibleInstance.isCollected()) return;
        
        collectibleInstance.collect();
        
        // Use the type from the collectible (configured in tilemap)
        const itemName = collectibleInstance.getName();
        const itemType = collectibleInstance.getType();
        
        // Collect the item
        this.collectedItemsManager.collectItem(
            itemName,
            itemType,
            collectibleInstance.getScore(),
            collectibleInstance.isMustCollect(),
            collectibleInstance.getProperties()
        );
        
        // Update score display
        this.updateScoreDisplay();
    }
    
    // 已移除：handlePlayerGoalCollision 方法
    // Goal对象不再需要
    
    // 已移除：handlePlayerEnemyCollision 方法
    // 现在只使用 handlePlayerBattleEnemyCollision
    
    private updateScoreDisplay() {
        if (this.scoreText) {
            const totalScore = this.collectedItemsManager.getTotalScore() + this.timeScore + this.killScore;
            this.scoreText.setText(`Score: ${totalScore}`);
            
            // Score pop animation
            this.tweens.add({
                targets: this.scoreText,
                scale: 1.2,
                duration: 100,
                yoyo: true,
                ease: 'Power2'
            });
        }
    }
    
    private initializeTimer() {
        this.gameStartTime = this.time.now;
        this.gameElapsedTime = 0;
        this.timeScore = 0;
        this.killCount = 0;
        this.killScore = 0;
        
        // 创建计时器事件，每100毫秒更新一次
        this.timerEvent = this.time.addEvent({
            delay: 100,
            callback: this.updateTimer,
            callbackScope: this,
            loop: true
        });
    }
    
    private updateTimer() {
        this.gameElapsedTime = this.time.now - this.gameStartTime;
        
        // 每秒给予1分的时间奖励
        this.timeScore = Math.floor(this.gameElapsedTime / 1000);
        
        // 更新计时器显示
        this.updateTimerDisplay();
        
        // 更新总分显示
        this.updateScoreDisplay();
        
        // 更新怪物速度
        this.updateEnemyDifficulty();
    }
    
    private updateEnemyDifficulty() {
        if (this.battleEnemies && this.battleEnemies.children && this.battleEnemies.children.entries) {
            // 计算难度倍数：每30秒增加10%的速度，最大200%
            const elapsedSeconds = Math.floor(this.gameElapsedTime / 1000);
            const difficultyMultiplier = Math.min(1 + (Math.floor(elapsedSeconds / 30) * 0.1), 2.0);
            
            // 更新所有活跃敌人的速度
            this.battleEnemies.children.entries.forEach((enemy: any) => {
                if (enemy && enemy.setDifficultyMultiplier) {
                    enemy.setDifficultyMultiplier(difficultyMultiplier);
                }
            });
        }
    }
    
    private updateTimerDisplay() {
        if (this.timerText) {
            const seconds = Math.floor(this.gameElapsedTime / 1000);
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            
            const timeString = `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
            this.timerText.setText(`Time: ${timeString}`);
        }
    }
    
    getGameElapsedTime(): number {
        return this.gameElapsedTime;
    }
    
    getTimeScore(): number {
        return this.timeScore;
    }
    
    private addKillScore(enemyType: string): void {
        let scorePerKill = 0;
        
        // 根据敌人类型给予不同分数
        switch (enemyType) {
            case 'slime':
                scorePerKill = 10;
                break;
            case 'flying_creature':
                scorePerKill = 15;
                break;
            case 'goblin':
                scorePerKill = 20;
                break;
            default:
                scorePerKill = 10;
        }
        
        this.killCount++;
        this.killScore += scorePerKill;
        
        // 更新得分显示
        this.updateScoreDisplay();
        
        
    }
    
    getKillCount(): number {
        return this.killCount;
    }
    
    getKillScore(): number {
        return this.killScore;
    }
    
    private createBattleSystem(): void {
        // 创建子弹组
        this.bullets = this.physics.add.group({
            classType: OptimizedBullet,
            runChildUpdate: true, // 确保子弹的update方法被调用
            maxSize: 50, // 最大子弹数量
            createCallback: (_bullet: Phaser.GameObjects.GameObject) => {
                // 子弹创建时的回调（暂无需处理）
            },
            removeCallback: (_bullet: Phaser.GameObjects.GameObject) => {
                // 子弹移除时的回调（暂无需处理）
            }
        });
        
        // 初始化敌人生成器
        if (this.player) {
            this.enemySpawner = EnemySpawner.getInstance();
            // 对于游戏重启，强制重新初始化
            if (this.enemySpawner.isInitialized()) {
                console.log('[Game] Reinitializing EnemySpawner for scene restart');
                this.enemySpawner.forceReinitialize(this);
            } else {
                console.log('[Game] First time initializing EnemySpawner');
                this.enemySpawner.initialize(this);
            }
            this.enemySpawner.setPlayer(this.player);
            this.battleEnemies = this.enemySpawner.getEnemies();
            
            // 验证battleEnemies初始化
            if (!this.battleEnemies) {
                console.error('Failed to initialize battleEnemies group');
                return;
            }
            
            // 启动敌人生成
            this.enemySpawner.start();
            
            // 战斗系统初始化完成
        }
    }
    
    private handlePlayerBattleEnemyCollision(player: any, enemy: any): void {
        const playerInstance = player as Player;
        const enemyInstance = enemy as BattleEnemy;
        
        if (playerInstance && enemyInstance) {
            // 玩家受到伤害
            const damage = enemyInstance.getDamage();
            playerInstance.takeDamage(damage);
            
            // 更新UI
            if (this.healthUI) {
                this.healthUI.updateHealth(playerInstance.getHealth());
            }
            
            // 敌人也受到伤害（接触伤害）
            enemyInstance.takeDamage(1);
            

        }
    }
    
    private handleBulletEnemyCollision(bullet: any, enemy: any): void {
        const bulletInstance = bullet as OptimizedBullet;
        const enemyInstance = enemy as BattleEnemy;
        
        if (bulletInstance && enemyInstance) {
            // 记录敌人击杀前的血量，用于判断是否被杀死
            const enemyHealthBefore = enemyInstance.getHealth();
            
            // 敌人受到伤害
            enemyInstance.takeDamage(1);
            
            // 子弹命中目标并销毁
            bulletInstance.hitTarget();
            
            // 检查敌人是否被杀死
            if (enemyHealthBefore > 0 && enemyInstance.getHealth() <= 0) {
                this.addKillScore(enemyInstance.getEnemyType());
            }
            

        }
    }

    update() {
        if (this.player) {
            this.player.update();
            
            // Update weapon info display
            if (this.weaponInfoText && this.player.getWeapon()) {
                const weapon = this.player.getWeapon();
                const weaponIndex = weapon.getWeaponIndex() + 1; // 显示从1开始的编号
                const weaponName = weapon.getWeaponName();
                this.weaponInfoText.setText(`Weapon: #${weaponIndex} (${weaponName})`);
            }
        }
        
        // Check restart key
        if (this.restartKey && Phaser.Input.Keyboard.JustDown(this.restartKey)) {
            this.restartGame();
        }
    }
    
    restartGame() {
        // Stop timer
        if (this.timerEvent) {
            this.timerEvent.remove();
        }
        
        // 停止敌人生成器
        if (this.enemySpawner) {
            this.enemySpawner.stop();
        }
        
        // Pause physics world
        this.physics.world.pause();
        
        // Fade out effect using configuration
        const cameraConfig = this.configManager.getCameraConfig();
        this.cameras.main.fadeOut(cameraConfig.fadeOutDuration, 0, 0, 0);
        
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            // Start Victory scene with game data
            const summaryData = this.collectedItemsManager.getSummaryData();
            // Add time information
            summaryData.gameTime = this.gameElapsedTime;
            summaryData.timeScore = this.timeScore;
            summaryData.killScore = this.killScore;
            summaryData.killCount = this.killCount;
            summaryData.totalScore = summaryData.totalScore + this.timeScore + this.killScore;
            this.scene.start('Victory', summaryData);
            // Completely remove and destroy Game scene
            this.scene.remove('Game');
        });
    }
    
    victory() {
        // Stop timer
        if (this.timerEvent) {
            this.timerEvent.remove();
        }
        
        // Pause physics world
        this.physics.world.pause();
        
        // Fade out effect using configuration
        const cameraConfig = this.configManager.getCameraConfig();
        this.cameras.main.fadeOut(cameraConfig.fadeInDuration, 255, 255, 255);
        
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            // Start Victory scene with collected items data
            const summaryData = this.collectedItemsManager.getSummaryData();
            // Add time and kill information
            summaryData.gameTime = this.gameElapsedTime;
            summaryData.timeScore = this.timeScore;
            summaryData.killScore = this.killScore;
            summaryData.killCount = this.killCount;
            summaryData.totalScore = summaryData.totalScore + this.timeScore + this.killScore;
            this.scene.start('Victory', summaryData);
            // Completely remove and destroy Game scene
            this.scene.remove('Game');
        });
    }
    
    private setupCustomCursor(): void {
        // 通过Canvas的style属性直接使用crosshair图像作为CSS光标
        const canvas = this.sys.game.canvas;
        
        // 先将图像转换为Data URL用作CSS光标
        const crosshairTexture = this.textures.get('crosshair');
        const crosshairFrame = crosshairTexture.getSourceImage() as HTMLImageElement;
        
        // 创建一个临时canvas来处理图像
        const tempCanvas = document.createElement('canvas');
        const tempContext = tempCanvas.getContext('2d');
        tempCanvas.width = crosshairFrame.width || 16;
        tempCanvas.height = crosshairFrame.height || 16;
        
        // 绘制图像到临时canvas
        if (tempContext) {
            tempContext.drawImage(crosshairFrame, 0, 0);
        }
        
        // 获取Data URL
        const dataURL = tempCanvas.toDataURL();
        
        // 设置CSS光标，hotspot设置在图像中心
        const centerX = Math.floor(tempCanvas.width / 2);
        const centerY = Math.floor(tempCanvas.height / 2);
        canvas.style.cursor = `url('${dataURL}') ${centerX} ${centerY}, crosshair`;
        
        // 自定义光标设置完成
        
        // 可选：为点击添加额外的视觉效果
        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            // 在点击位置创建临时闪烁效果
            const clickEffect = this.add.circle(pointer.x, pointer.y, 8, 0xff6666, 0.8);
            clickEffect.setDepth(10000);
            clickEffect.setScrollFactor(0);
            
            this.tweens.add({
                targets: clickEffect,
                scale: 2,
                alpha: 0,
                duration: 200,
                ease: 'Power2',
                onComplete: () => {
                    clickEffect.destroy();
                }
            });
        });
    }
    
    /**
     * 清理场景资源，优化内存管理
     */
    destroy(): void {
        // 清理对象池
        if (this.objectPoolManager) {
            this.objectPoolManager.clearAllPools();
        }
        
        // 重置敌人生成器
        if (this.enemySpawner) {
            this.enemySpawner.reset();
        }
        
        // 清理玩家资源
        if (this.player) {
            this.player.destroy();
        }
        
        // 清理UI资源
        if (this.healthUI) {
            this.healthUI.destroy();
        }
        
        // 清理组中的所有对象
        if (this.bullets) {
            this.bullets.clear(true, true);
        }
        // 已移除：旧敌人系统清理
        if (this.battleEnemies) {
            this.battleEnemies.clear(true, true);
        }
        if (this.collectibles) {
            this.collectibles.clear(true, true);
        }
        // 已移除：Goal组清理
        // Goal对象不再需要
        if (this.hazards) {
            this.hazards.clear(true, true);
        }

        
        // 停用所有补间动画
        this.tweens.killAll();
        
        // 移除所有事件监听器
        this.input.removeAllListeners();
        this.cameras.main.removeAllListeners();
        
        // 重置收集管理器
        if (this.collectedItemsManager) {
            this.collectedItemsManager.reset();
        }
        

        
        // Scene类的清理由Phaser自动处理
        // super.destroy(); // Scene没有destroy方法
    }

}
