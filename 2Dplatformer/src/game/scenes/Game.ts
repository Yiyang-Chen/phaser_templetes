import { Scene } from 'phaser';
import { Player } from '../sprites/Player';
import { StaticHazard } from '../sprites/StaticHazard';
import { Goal } from '../sprites/Goal';
import { Collectible } from '../sprites/Collectible';
import { Enemy } from '../sprites/Enemy';
import { Bullet } from '../sprites/Bullet';
import { Trigger } from '../sprites/Trigger';
import { Obstacle } from '../sprites/Obstacle';
import { HealthUI } from '../ui/HealthUI';
import { CollectedItemsManager } from '../managers/CollectedItemsManager';
import { GameObjectManager } from '../managers/GameObjectManager';
import { UUIDGenerator } from '../utils/UUIDGenerator';
import { eventBus, GameEvent } from '../events/EventBus';
import { DeviceDetector } from '../utils/DeviceDetector';
import { FullscreenManager } from '../managers/FullscreenManager';
import { MobileControls } from '../ui/MobileControls';

export class Game extends Scene
{
    camera: Phaser.Cameras.Scene2D.Camera;
    background: Phaser.GameObjects.Image;
    msg_text : Phaser.GameObjects.Text;
    map: Phaser.Tilemaps.Tilemap;
    tilesets: Phaser.Tilemaps.Tileset[];
    layers: Phaser.Tilemaps.TilemapLayer[];
    player: Player;
    hazards: Phaser.Physics.Arcade.StaticGroup;
    goals: Phaser.Physics.Arcade.StaticGroup;
    collectibles: Phaser.Physics.Arcade.StaticGroup;
    enemies: Phaser.Physics.Arcade.Group;
    bullets: Phaser.Physics.Arcade.Group;
    triggers: Trigger[];
    obstacles: Phaser.Physics.Arcade.StaticGroup;
    movableObstacles: Phaser.Physics.Arcade.Group;
    restartKey: Phaser.Input.Keyboard.Key;
    isVictory: boolean = false;
    healthUI: HealthUI;
    scoreText: Phaser.GameObjects.Text;
    collectedItemsManager: CollectedItemsManager;
    gameObjectManager: GameObjectManager;
    mobileControls: MobileControls | null = null;

    constructor ()
    {
        super('Game');
        this.collectedItemsManager = new CollectedItemsManager();
        this.gameObjectManager = GameObjectManager.getInstance();
    }

    create ()
    {
        console.log('🎮 Game场景: create() 方法开始执行');
        
        // 获取选定的关卡
        const selectedLevel = this.registry.get('selectedLevel') || 1;
        console.log('🎮 Game场景: 当前关卡:', selectedLevel);
        
        // Enable EventBus debugger in development mode
        // Disabled to reduce console noise
        // if (import.meta.env.DEV) {
        //     eventBusDebugger.enable();
        // }
        
        // Emit scene start event
        eventBus.emit(GameEvent.SCENE_START, {
            scene: 'Game',
            level: selectedLevel
        });
        
        // Emit game start event
        eventBus.emit(GameEvent.GAME_START);
        
        // Create unified bullets group for all entities
        this.bullets = this.physics.add.group({
            classType: Bullet,
            runChildUpdate: true,
            maxSize: 20
        });
        
        // Listen for bullet creation events
        eventBus.on(GameEvent.BULLET_CREATED, (data) => {
            if (data.bullet && this.bullets) {
                this.bullets.add(data.bullet);
            }
        });
        
        // Reset collected items manager for new game
        this.collectedItemsManager.reset();
        
        // Clear game object manager for new game
        this.gameObjectManager.clear();
        
        this.camera = this.cameras.main;
        this.camera.setBackgroundColor(0x87CEEB);

        // Create the tilemap
        this.map = this.make.tilemap({ key: 'tilemap' });

        // Load tilesets from tilemap config.
        this.tilesets = [];
        this.map.tilesets.forEach((tileset: Phaser.Tilemaps.Tileset) => {
            let addedTileset = this.map.addTilesetImage(tileset.name, tileset.name);
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
            }
        })

        this.createObjectsFromTilemap()

        // Create collides events
        this.createOverleapEvents();
        
        // Setup restart key (R key)
        this.restartKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.R);
        
        // Create health UI
        if (this.player) {
            this.healthUI = new HealthUI(this, 50, 50, this.player.getMaxHealth());
            this.healthUI.updateHealth(this.player.getHealth());
        } else {
            // Fallback if player is not created yet
            this.healthUI = new HealthUI(this, 50, 50);
        }
        
        // Create score UI
        this.scoreText = this.add.text(50, 100, 'Score: 0', {
            fontSize: '24px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        });
        this.scoreText.setScrollFactor(0);
        this.scoreText.setDepth(1000);
        
        // Add fullscreen button for mobile devices
        if (DeviceDetector.isMobile() && DeviceDetector.isFullscreenSupported()) {
            FullscreenManager.getInstance().createFullscreenButton(this);
        }
        
        // Create mobile controls for mobile devices
        if (DeviceDetector.isMobile()) {
            this.mobileControls = new MobileControls(this);
            
            // Pass mobile controls to player
            if (this.player) {
                this.player.setMobileControls(this.mobileControls);
            }
        }
        
        // Create debug mode indicator
        this.createDebugIndicator();
    }

    private createDebugIndicator() {
        // Check if debug mode is enabled
        const debugMode = this.registry.get('debugMode');
        
        if (debugMode) {
            // Create debug mode indicator in top-right corner
            const debugText = this.add.text(this.cameras.main.width - 10, 10, 'DEBUG MODE', {
                fontSize: '16px',
                color: '#00ff00',
                fontFamily: 'Arial',
                stroke: '#000000',
                strokeThickness: 2
            });
            debugText.setOrigin(1, 0); // Right-align
            debugText.setScrollFactor(0); // Don't scroll with camera
            debugText.setDepth(2000); // High depth to appear on top
            
            // Add pulsing animation to make it more noticeable
            this.tweens.add({
                targets: debugText,
                alpha: { from: 1, to: 0.5 },
                duration: 1000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
            
            // Add a subtle background rectangle
            const debugBg = this.add.rectangle(
                this.cameras.main.width - 5, 
                5, 
                debugText.width + 10, 
                debugText.height + 10, 
                0x000000, 
                0.3
            );
            debugBg.setOrigin(1, 0);
            debugBg.setScrollFactor(0);
            debugBg.setDepth(1999);
            
            console.log('🐛 Debug模式视觉指示器已创建');
        }
    }

    private createObjectsFromTilemap() {
        // Create triggers last to ensure all target objects exist
        const triggers: Phaser.Types.Tilemaps.TiledObject[] = [];
        
        this.map.getObjectLayerNames().forEach(((objectLayerName: string) => {
            let objectLayer = this.map.getObjectLayer(objectLayerName);
            objectLayer?.objects.forEach((obj: Phaser.Types.Tilemaps.TiledObject) => {
                if (obj.type === 'trigger') {
                    triggers.push(obj);
                } else {
                    this.createObject(obj);
                }
            })
        }))
        
        // Create triggers after all other objects
        triggers.forEach(obj => {
            this.createObject(obj);
        });
    }

    private createObject(obj: Phaser.Types.Tilemaps.TiledObject) {
        console.log("create object", obj)
        // Extract UUID from properties array, or generate one if not present
        let uuid = UUIDGenerator.generate();
        const properties = obj.properties as any[];
        if (properties) {
            const uuidProp = properties.find(prop => prop.name === 'uuid');
            if (uuidProp) {
                uuid = uuidProp.value;
            }
        }
        
        switch (obj.type) {
            case "player":
                this.createPlayerFromTilemap(obj, uuid);
                return
            case "hazard":
                this.createHazardFromTilemap(obj, uuid);
                return
            case "goal":
                this.createGoalFromTilemap(obj, uuid);
                return
            case "collectible":
                this.createCollectibleFromTilemap(obj, uuid);
                return
            case "enemy":
                this.createEnemyFromTilemap(obj, uuid);
                return
            case "trigger":
                this.createTriggerFromTilemap(obj, uuid);
                return
            case "obstacle":
                this.createObstacleFromTilemap(obj, uuid);
                return
            default:
                console.log("unknown object type", obj.type);
        }
    }

    private createPlayerFromTilemap(playerObject: Phaser.Types.Tilemaps.TiledObject, uuid: string) {
        // if player is already created, then skip.
        if (this.player) {
            return;
        }
        // Create player
        this.player = new Player(this, playerObject);
        
        // Register player with UUID
        this.gameObjectManager.registerObject(uuid, this.player, 'player', playerObject.name);

        // Set up collides between player and tilemap layers
        this.layers.forEach(layer => {
            this.physics.add.collider(this.player, layer);
        });

        // Set camera bounds to match the tilemap
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        
        // Make camera follow the player
        this.cameras.main.startFollow(this.player);
        this.cameras.main.setLerp(0.1, 0.1);

        // Set world bounds for physics
        this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        
        // Update health UI if it already exists
        if (this.healthUI) {
            this.healthUI.setMaxHealth(this.player.getMaxHealth());
            this.healthUI.updateHealth(this.player.getHealth());
        }
    }

    private createHazardFromTilemap(hazardObject: Phaser.Types.Tilemaps.TiledObject, uuid: string) {
        if (!this.hazards) {
            this.hazards = this.physics.add.staticGroup();
        }
        
        const hazard = new StaticHazard(this, hazardObject);
        this.hazards.add(hazard);
        
        // Register hazard with UUID
        this.gameObjectManager.registerObject(uuid, hazard, 'hazard', hazardObject.name);
    }
    
    private createGoalFromTilemap(goalObject: Phaser.Types.Tilemaps.TiledObject, uuid: string) {
        if (!this.goals) {
            this.goals = this.physics.add.staticGroup();
        }
        
        const goal = new Goal(this, goalObject);
        this.goals.add(goal);
        
        // Register goal with UUID
        this.gameObjectManager.registerObject(uuid, goal, 'goal', goalObject.name);
    }
    
    private createCollectibleFromTilemap(collectibleObject: Phaser.Types.Tilemaps.TiledObject, uuid: string) {
        if (!this.collectibles) {
            this.collectibles = this.physics.add.staticGroup();
        }
        
        const collectible = new Collectible(this, collectibleObject);
        this.collectibles.add(collectible);
        
        // Register collectible with UUID
        this.gameObjectManager.registerObject(uuid, collectible, 'collectible', collectibleObject.name);
        
        // Track must-collect items
        if (collectible.isMustCollect()) {
            this.collectedItemsManager.addMustCollectItem(collectible.getName());
        }
    }
    
    private createEnemyFromTilemap(enemyObject: Phaser.Types.Tilemaps.TiledObject, uuid: string) {
        if (!this.enemies) {
            this.enemies = this.physics.add.group({
                classType: Enemy,
                runChildUpdate: true
            });
        }
        
        const enemy = new Enemy(this, enemyObject);
        this.enemies.add(enemy);
        
        // Register enemy with UUID
        this.gameObjectManager.registerObject(uuid, enemy, 'enemy', enemyObject.name);
        
        // Set up collides with tilemap layers
        this.layers.forEach(layer => {
            this.physics.add.collider(enemy, layer);
        });
    }
    
    private createTriggerFromTilemap(triggerObject: Phaser.Types.Tilemaps.TiledObject, uuid: string) {
        if (!this.triggers) {
            this.triggers = [];
        }
        
        const trigger = new Trigger(this, triggerObject);
        this.triggers.push(trigger);
        
        // Register trigger with UUID
        this.gameObjectManager.registerObject(uuid, trigger, 'trigger', triggerObject.name);
    }
    
    private createObstacleFromTilemap(obstacleObject: Phaser.Types.Tilemaps.TiledObject, uuid: string) {
        const obstacle = new Obstacle(this, obstacleObject);
        
        // Add to appropriate group based on movable property
        if (obstacle.getIsMovable()) {
            if (!this.movableObstacles) {
                this.movableObstacles = this.physics.add.group({
                    collideWorldBounds: true
                });
            }
            this.movableObstacles.add(obstacle);
            
            // Setup collisions with tilemap layers for movable obstacles
            this.layers.forEach(layer => {
                this.physics.add.collider(obstacle, layer);
            });
        } else {
            if (!this.obstacles) {
                this.obstacles = this.physics.add.staticGroup();
            }
            this.obstacles.add(obstacle);
        }
        
        // Register obstacle with UUID
        this.gameObjectManager.registerObject(uuid, obstacle, 'obstacle', obstacleObject.name);
    }

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
        
        // Setup player vs goals overlap detection
        if (this.player && this.goals) {
            this.physics.add.overlap(
                this.player,
                this.goals,
                this.handlePlayerGoalCollision,
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
        
        // Setup player vs enemies overlap detection
        if (this.player && this.enemies) {
            this.physics.add.overlap(
                this.player,
                this.enemies,
                this.handlePlayerEnemyCollision,
                undefined,
                this
            );
        }
        
        // Setup player vs triggers overlap detection
        if (this.player && this.triggers) {
            this.triggers.forEach(trigger => {
                this.physics.add.overlap(
                    this.player,
                    trigger,
                    this.handlePlayerTriggerCollision,
                    undefined,
                    this
                );
            });
        }
        
        // Setup player vs static obstacles collision
        if (this.player && this.obstacles) {
            this.physics.add.collider(this.player, this.obstacles);
        }
        
        // Setup player vs movable obstacles collision with custom handling
        if (this.player && this.movableObstacles) {
            this.physics.add.collider(this.player, this.movableObstacles, 
                this.handlePlayerBoxCollision, 
                undefined, 
                this
            );
        }
        
        // Setup bullets vs enemies collision (unified bullet management)
        if (this.bullets && this.enemies) {
            this.physics.add.overlap(
                this.bullets,
                this.enemies,
                this.handleBulletEnemyCollision,
                undefined,
                this
            );
        }
        
        // Setup bullets vs tilemap collision (unified bullet management)
        if (this.bullets) {
            this.layers.forEach(layer => {
                this.physics.add.collider(
                    this.bullets,
                    layer
                );
            });
            
            // Setup bullets vs static obstacles collision with damage handling
            if (this.obstacles) {
                this.physics.add.collider(
                    this.bullets,
                    this.obstacles,
                    this.handleBulletObstacleCollision,
                    undefined,
                    this
                );
            }
            
            // Setup bullets vs movable obstacles collision with damage handling
            if (this.movableObstacles) {
                this.physics.add.collider(
                    this.bullets,
                    this.movableObstacles,
                    this.handleBulletObstacleCollision,
                    undefined,
                    this
                );
            }
        }
        
        // Setup enemies vs static obstacles collision
        if (this.enemies && this.obstacles) {
            this.physics.add.collider(this.enemies, this.obstacles);
        }
        
        // Setup enemies vs movable obstacles collision
        if (this.enemies && this.movableObstacles) {
            this.physics.add.collider(this.enemies, this.movableObstacles);
        }
        
        // Setup movable obstacles vs movable obstacles collision with custom handling
        if (this.movableObstacles) {
            this.physics.add.collider(this.movableObstacles, this.movableObstacles,
                this.handleBoxBoxCollision,
                undefined,
                this
            );
        }
    }

    private handlePlayerHazardCollision(player: any, hazard: any) {
        const hazardInstance = hazard as StaticHazard;
        const playerInstance = player as Player;
        
        playerInstance.takeDamage(hazardInstance.getDamage());
        
        // Update health UI
        if (this.healthUI) {
            this.healthUI.updateHealth(playerInstance.getHealth());
        }
    }
    
    private handlePlayerGoalCollision(_player: any, goal: any) {
        if (this.isVictory) return;
        
        const goalInstance = goal as Goal;
        if (goalInstance.isCollected()) return;
        
        // Check if all must-collect items have been collected
        if (!this.collectedItemsManager.hasCollectedAllRequired()) {
            const missingItems = this.collectedItemsManager.getMissingRequiredItems();
            if (missingItems.length > 0) {
                // Show missing items with images
                this.showMissingItemsVisual(missingItems);
                return;
            }
        }
        
        goalInstance.collect();
        this.isVictory = true;
        
        // Pass collected items data to Victory scene
        this.time.delayedCall(1000, () => {
            const summaryData = this.collectedItemsManager.getSummaryData();
            this.scene.start('Victory', summaryData);
            this.scene.remove('Game');
        });
    }
    
    private showMissingItemsVisual(missingItems: string[]) {
        const centerX = this.cameras.main.centerX;
        const centerY = this.cameras.main.centerY;
        
        // Display missing item images
        const itemSpacing = 100;
        const startX = centerX - (missingItems.length - 1) * itemSpacing / 2;
        
        missingItems.forEach((item, index) => {
            const itemX = startX + index * itemSpacing;
            const itemY = centerY - 80;
            
            // Create glow effect behind item
            const glowCircle = this.add.circle(itemX, itemY, 45, 0xffff00, 0.3);
            glowCircle.setScrollFactor(0);
            glowCircle.setDepth(999);
            
            // Animate glow pulsing
            this.tweens.add({
                targets: glowCircle,
                scale: { from: 1, to: 1.5 },
                alpha: { from: 0.3, to: 0.1 },
                duration: 800,
                yoyo: true,
                repeat: 3,
                ease: 'Sine.easeInOut'
            });
            
            // Create item silhouette/shadow first
            const itemShadow = this.add.image(itemX, itemY, item);
            itemShadow.setScale(1.8);
            itemShadow.setScrollFactor(0);
            itemShadow.setDepth(1000);
            itemShadow.setTint(0x000000);
            itemShadow.setAlpha(0.3);
            
            // Create the actual item image
            const itemImage = this.add.image(itemX, itemY, item);
            itemImage.setScale(0);
            itemImage.setScrollFactor(0);
            itemImage.setDepth(1001);
            
            // Add red tint to indicate it's missing
            itemImage.setTint(0xff6666);
            
            // Create "!" exclamation mark above item
            const exclamation = this.add.text(itemX, itemY - 60, '!', {
                fontSize: '48px',
                color: '#ff0000',
                fontFamily: 'Arial Black',
                stroke: '#ffffff',
                strokeThickness: 4
            });
            exclamation.setOrigin(0.5);
            exclamation.setScrollFactor(0);
            exclamation.setDepth(1002);
            exclamation.setScale(0);
            
            // Animate item appearance with bounce
            this.tweens.add({
                targets: itemImage,
                scale: 1.5,
                duration: 400,
                ease: 'Back.easeOut',
                delay: index * 100
            });
            
            // Animate exclamation mark
            this.tweens.add({
                targets: exclamation,
                scale: 1,
                duration: 300,
                ease: 'Back.easeOut',
                delay: index * 100 + 200
            });
            
            // Add shake animation to item
            this.tweens.add({
                targets: itemImage,
                x: itemX + 5,
                duration: 100,
                yoyo: true,
                repeat: 10,
                ease: 'Linear',
                delay: index * 100 + 400
            });
            
            // Create particle effects around the item
            for (let j = 0; j < 8; j++) {
                this.time.delayedCall(index * 100 + j * 50, () => {
                    const angle = (j / 8) * Math.PI * 2;
                    const particleX = itemX + Math.cos(angle) * 30;
                    const particleY = itemY + Math.sin(angle) * 30;
                    
                    const particle = this.add.circle(particleX, particleY, 3, 0xff0000);
                    particle.setScrollFactor(0);
                    particle.setDepth(998);
                    
                    this.tweens.add({
                        targets: particle,
                        x: itemX + Math.cos(angle) * 60,
                        y: itemY + Math.sin(angle) * 60,
                        alpha: { from: 1, to: 0 },
                        scale: { from: 1, to: 0 },
                        duration: 600,
                        ease: 'Power2',
                        onComplete: () => {
                            particle.destroy();
                        }
                    });
                });
            }
            
            // Fade out and destroy after delay
            this.time.delayedCall(2800, () => {
                this.tweens.add({
                    targets: [itemImage, itemShadow, exclamation, glowCircle],
                    alpha: 0,
                    scale: 0,
                    duration: 400,
                    ease: 'Back.easeIn',
                    onComplete: () => {
                        itemImage.destroy();
                        itemShadow.destroy();
                        exclamation.destroy();
                        glowCircle.destroy();
                    }
                });
            });
        });
        
        // Screen flash effect
        const flash = this.add.rectangle(centerX, centerY, this.cameras.main.width, this.cameras.main.height, 0xff0000, 0);
        flash.setScrollFactor(0);
        flash.setDepth(990);
        
        this.tweens.add({
            targets: flash,
            alpha: 0.2,
            duration: 150,
            ease: 'Power2',
            yoyo: true,
            onComplete: () => {
                flash.destroy();
            }
        });
    }
    
    private handlePlayerCollectibleCollision(_player: any, collectible: any) {
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
    
    private handlePlayerEnemyCollision(player: any, enemy: any) {
        const enemyInstance = enemy as Enemy;
        const playerInstance = player as Player;
        
        // Check if player is jumping on enemy (player above enemy)
        if (playerInstance.body?.velocity.y && 
            playerInstance.body.velocity.y > 0 && 
            playerInstance.y < enemyInstance.y - 20) {
            // Player defeats enemy by jumping on it
            enemyInstance.takeDamage(1);
            // Bounce player up
            playerInstance.setVelocityY(-300);
        } else {
            // Enemy damages player
            playerInstance.takeDamage(enemyInstance.getDamage());
            
            // Update health UI
            if (this.healthUI) {
                this.healthUI.updateHealth(playerInstance.getHealth());
            }
        }
    }
    
    private handleBulletEnemyCollision(bullet: any, enemy: any) {
        const bulletInstance = bullet as Bullet;
        const enemyInstance = enemy as Enemy;
        
        bulletInstance.hitEnemy();
        enemyInstance.takeDamage(1);
        
        this.cameras.main.shake(50, 0.003);
    }
    
    private handleBulletObstacleCollision(bullet: any, obstacle: any) {
        const bulletInstance = bullet as Bullet;
        const obstacleInstance = obstacle as Obstacle;
        
        console.log(`[Game] Bullet hit obstacle at (${obstacleInstance.x}, ${obstacleInstance.y}), destructible: ${obstacleInstance.getIsDestructible()}`);
        
        bulletInstance.hitEnemy();
        
        if (obstacleInstance.getIsDestructible()) {
            obstacleInstance.takeDamage(1);
        }
    }
    
    private handlePlayerTriggerCollision(player: any, trigger: any) {
        const playerInstance = player as Player;
        const triggerInstance = trigger as Trigger;
        
        triggerInstance.activate(playerInstance);
    }
    
    private handlePlayerBoxCollision(player: any, box: any) {
        const playerInstance = player as Player;
        const boxInstance = box as Obstacle;
        
        // Ensure proper separation to prevent overlap
        const playerBody = playerInstance.body as Phaser.Physics.Arcade.Body;
        const boxBody = boxInstance.body as Phaser.Physics.Arcade.Body;
        
        // Check if player is overlapping with box (shouldn't happen but safety check)
        if (this.physics.world.overlap(playerInstance, boxInstance)) {
            // Calculate separation direction
            const dx = playerInstance.x - boxInstance.x;
            const dy = playerInstance.y - boxInstance.y;
            
            // Push player away from box center
            if (Math.abs(dx) > Math.abs(dy)) {
                // Horizontal separation
                if (dx > 0) {
                    playerInstance.x = boxInstance.x + 32 + playerBody.width / 2;
                } else {
                    playerInstance.x = boxInstance.x - 32 - playerBody.width / 2;
                }
            } else {
                // Vertical separation
                if (dy > 0) {
                    playerInstance.y = boxInstance.y + 32 + playerBody.height / 2;
                } else {
                    playerInstance.y = boxInstance.y - 32 - playerBody.height / 2;
                }
            }
        }
        
        // Implement gradual acceleration when pushing
        const playerVx = playerBody.velocity.x;
        const boxVx = boxBody.velocity.x;
        
        // Only apply push force if player is actually moving into the box
        if (Math.abs(playerVx) > 10) {
            // Calculate the target velocity (player's velocity)
            const targetVx = playerVx * 0.95; // Slightly slower than player
            
            // Gradually accelerate box towards target velocity
            const acceleration = 0.15; // How quickly box matches player speed (0-1)
            const newBoxVx = boxVx + (targetVx - boxVx) * acceleration;
            
            boxBody.setVelocityX(newBoxVx);
        }
    }
    
    private handleBoxBoxCollision(box1: any, box2: any) {
        const box1Instance = box1 as Obstacle;
        const box2Instance = box2 as Obstacle;
        
        const box1Body = box1Instance.body as Phaser.Physics.Arcade.Body;
        const box2Body = box2Instance.body as Phaser.Physics.Arcade.Body;
        
        // Check if boxes are overlapping (shouldn't happen but safety check)
        if (this.physics.world.overlap(box1Instance, box2Instance)) {
            // Calculate separation direction
            const dx = box1Instance.x - box2Instance.x;
            const dy = box1Instance.y - box2Instance.y;
            
            // Determine separation distance
            const separationDist = 30; // Half box size + small gap
            
            // Push boxes apart
            if (Math.abs(dx) > Math.abs(dy)) {
                // Horizontal separation
                if (dx > 0) {
                    box1Instance.x = box2Instance.x + separationDist;
                    box2Instance.x = box1Instance.x - separationDist;
                } else {
                    box1Instance.x = box2Instance.x - separationDist;
                    box2Instance.x = box1Instance.x + separationDist;
                }
            } else {
                // Vertical separation
                if (dy > 0) {
                    box1Instance.y = box2Instance.y + separationDist;
                    box2Instance.y = box1Instance.y - separationDist;
                } else {
                    box1Instance.y = box2Instance.y - separationDist;
                    box2Instance.y = box1Instance.y + separationDist;
                }
            }
            
            // Update physics bodies after position change
            box1Body.updateFromGameObject();
            box2Body.updateFromGameObject();
        }
        
        // Transfer momentum between boxes when pushing
        const avgVx = (box1Body.velocity.x + box2Body.velocity.x) * 0.5;
        const avgVy = (box1Body.velocity.y + box2Body.velocity.y) * 0.5;
        
        // Apply averaged velocity with damping
        box1Body.setVelocity(avgVx * 0.9, avgVy);
        box2Body.setVelocity(avgVx * 0.9, avgVy);
    }
    
    private updateScoreDisplay() {
        if (this.scoreText) {
            const score = this.collectedItemsManager.getTotalScore();
            this.scoreText.setText(`Score: ${score}`);
            
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

    update() {
        if (this.player) {
            this.player.update();
        }
        
        // Check for bullets that need immediate collision check (unified bullet management)
        if (this.bullets && (this.obstacles || this.movableObstacles)) {
            this.bullets.children.entries.forEach((bullet: any) => {
                const bulletInstance = bullet as Bullet;
                if (bulletInstance.getNeedsImmediateCheck && bulletInstance.getNeedsImmediateCheck()) {
                    // Check collision with static obstacles
                    if (this.obstacles) {
                        this.physics.world.overlap(bulletInstance, this.obstacles, 
                            (b: any, o: any) => {
                                this.handleBulletObstacleCollision(b, o);
                            }, 
                            undefined, 
                            this
                        );
                    }
                    
                    // Check collision with movable obstacles
                    if (this.movableObstacles) {
                        this.physics.world.overlap(bulletInstance, this.movableObstacles, 
                            (b: any, o: any) => {
                                this.handleBulletObstacleCollision(b, o);
                            }, 
                            undefined, 
                            this
                        );
                    }
                    
                    bulletInstance.setImmediateCollisionCheck(false);
                }
            });
        }
        
        // Check restart key
        if (this.restartKey && Phaser.Input.Keyboard.JustDown(this.restartKey)) {
            this.restartGame();
        }
    }
    restartGame() {
        // Pause physics world
        this.physics.world.pause();
        
        // Fade out effect
        this.cameras.main.fadeOut(250, 0, 0, 0);
        
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            // Start GameOver scene
            this.scene.start('GameOver');
            // Completely remove and destroy Game scene
            this.scene.remove('Game');
        });
    }
    
    victory() {
        // Pause physics world
        this.physics.world.pause();
        
        // Fade out effect
        this.cameras.main.fadeOut(500, 255, 255, 255);
        
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            // Start Victory scene with collected items data
            const summaryData = this.collectedItemsManager.getSummaryData();
            this.scene.start('Victory', summaryData);
            // Completely remove and destroy Game scene
            this.scene.remove('Game');
        });
    }
}
