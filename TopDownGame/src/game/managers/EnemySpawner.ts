import { BattleEnemy, EnemyType } from '../sprites/BattleEnemy';
import { SingletonManager } from '../core/BaseManager';
import { eventBus, GameEvent } from '../events/EventBus';

export class EnemySpawner extends SingletonManager {
    private enemies: Phaser.Physics.Arcade.Group;
    private player: Phaser.Physics.Arcade.Sprite;
    private spawnTimer: Phaser.Time.TimerEvent | null = null;
    
    // 生成配置
    private spawnInterval: number = 1500; // 1.5秒生成一个敌人（更快）
    private maxEnemies: number = 15; // 最大敌人数量（更多）
    private spawnDistance: number = 400; // 生成距离玩家的最小距离
    
    // 敌人类型权重
    private enemyWeights: { type: EnemyType; weight: number }[] = [
        { type: 'slime', weight: 50 },           // 50% 史莱姆（最常见）
        { type: 'flying_creature', weight: 30 }, // 30% 飞行生物
        { type: 'goblin', weight: 20 }           // 20% 哥布林（最强）
    ];
    
    protected onInitialize(): void {
        // EnemySpawner specific initialization
        // 每次初始化都重新创建敌人组（解决场景重启问题）
        if (this.enemies) {
            try {
                // 检查group是否仍然有效
                if (this.enemies.children && typeof this.enemies.clear === 'function') {
                    this.enemies.clear(true, true);
                } else {
                    console.warn('[EnemySpawner] Existing enemies group is corrupted, will recreate');
                }
            } catch (error) {
                console.warn('[EnemySpawner] Error clearing existing enemies during init:', error);
            }
        }
        
        // 总是创建新的敌人组
        this.enemies = this.getScene().physics.add.group({
            classType: BattleEnemy,
            runChildUpdate: true,
            maxSize: this.maxEnemies
        });
        
        console.log('[EnemySpawner] Enemies group created with', this.maxEnemies, 'max size');
    }
    
    protected onCleanup(): void {
        console.log('[EnemySpawner] Cleaning up...');
        this.stop();
        this.clearAllEnemies();
        this.player = null as any;
    }
    
    public setPlayer(player: Phaser.Physics.Arcade.Sprite): void {
        this.player = player;
    }
    
    private ensurePlayerSet(): void {
        if (!this.player) {
            throw new Error('EnemySpawner requires player reference. Call setPlayer() before using spawner.');
        }
    }
    
    start(): void {
        this.ensurePlayerSet();
        
        console.log('[EnemySpawner] Starting enemy spawning...');
        
        // 立即生成一些初始敌人
        for (let i = 0; i < 3; i++) {
            this.getScene().time.delayedCall(i * 200, () => {
                this.spawnEnemy();
            });
        }
        
        // 开始定时生成敌人
        this.spawnTimer = this.getScene().time.addEvent({
            delay: this.spawnInterval,
            callback: this.spawnEnemy,
            callbackScope: this,
            loop: true
        });
        

    }
    
    stop(): void {
        if (this.spawnTimer) {
            this.spawnTimer.remove();
            this.spawnTimer = null;
        }

    }
    
    private spawnEnemy(): void {
        this.ensurePlayerSet();
        
        // 确保敌人组已初始化
        if (!this.enemies) {
            console.warn('[EnemySpawner] Cannot spawn enemy: enemies group not initialized');
            return;
        }
        
        // 检查敌人数量限制
        if (this.enemies.children.size >= this.maxEnemies) {
            return;
        }
        
        // 随机选择敌人类型
        const enemyType = this.getRandomEnemyType();
        
        // 获取随机生成位置
        const spawnPos = this.getRandomSpawnPosition();
        
        // 创建敌人
        const enemy = new BattleEnemy(this.getScene(), spawnPos.x, spawnPos.y, enemyType);
        enemy.setPlayer(this.player);
        
        // 添加到敌人组
        this.enemies.add(enemy);
        
        // 发射敌人生成事件
        eventBus.emit(GameEvent.ENEMY_SPAWN, {
            enemy,
            type: enemyType,
            position: { x: spawnPos.x, y: spawnPos.y }
        });

    }
    
    private getRandomEnemyType(): EnemyType {
        const totalWeight = this.enemyWeights.reduce((sum, item) => sum + item.weight, 0);
        let random = Math.random() * totalWeight;
        
        for (const item of this.enemyWeights) {
            random -= item.weight;
            if (random <= 0) {
                return item.type;
            }
        }
        
        return 'slime'; // 默认返回史莱姆
    }
    
    private getRandomSpawnPosition(): { x: number; y: number } {
        this.ensurePlayerSet();
        
        const camera = this.getScene().cameras.main;
        const playerX = this.player.x;
        const playerY = this.player.y;
        
        // 获取屏幕边界
        const worldView = camera.worldView;
        const margin = 50; // 边界边距
        
        // 生成候选位置（屏幕四边）
        const candidates = [
            // 上边
            {
                x: Phaser.Math.Between(worldView.left - margin, worldView.right + margin),
                y: worldView.top - margin
            },
            // 下边
            {
                x: Phaser.Math.Between(worldView.left - margin, worldView.right + margin),
                y: worldView.bottom + margin
            },
            // 左边
            {
                x: worldView.left - margin,
                y: Phaser.Math.Between(worldView.top - margin, worldView.bottom + margin)
            },
            // 右边
            {
                x: worldView.right + margin,
                y: Phaser.Math.Between(worldView.top - margin, worldView.bottom + margin)
            }
        ];
        
        // 过滤掉距离玩家太近的位置
        const validCandidates = candidates.filter(pos => {
            const distance = Phaser.Math.Distance.Between(pos.x, pos.y, playerX, playerY);
            return distance >= this.spawnDistance;
        });
        
        // 如果没有有效位置，随机选择一个候选位置
        const finalCandidates = validCandidates.length > 0 ? validCandidates : candidates;
        
        return Phaser.Utils.Array.GetRandom(finalCandidates);
    }
    
    getEnemies(): Phaser.Physics.Arcade.Group {
        if (!this.enemies) {
            throw new Error('EnemySpawner not properly initialized. Call initialize() first.');
        }
        return this.enemies;
    }
    
    // 清除所有敌人
    clearAllEnemies(): void {
        if (this.enemies && this.enemies.children) {
            try {
                this.enemies.clear(true, true);
            } catch (error) {
                console.warn('[EnemySpawner] Error clearing enemies, recreating group:', error);
                // 如果清理失败，强制重新创建
                this.enemies = null as any;
            }
        }
    }
    
    // 重置敌人生成器（用于游戏重启）
    reset(): void {
        console.log('[EnemySpawner] Resetting...');
        this.onCleanup();
        // 重置初始化状态，允许重新初始化
        this.initialized = false;
    }
    
    // 更新生成配置
    updateSpawnConfig(config: {
        spawnInterval?: number;
        maxEnemies?: number;
        spawnDistance?: number;
    }): void {
        if (config.spawnInterval !== undefined) {
            this.spawnInterval = config.spawnInterval;
            
            // 重新启动定时器
            if (this.spawnTimer) {
                this.stop();
                this.start();
            }
        }
        
        if (config.maxEnemies !== undefined) {
            this.maxEnemies = config.maxEnemies;
        }
        
        if (config.spawnDistance !== undefined) {
            this.spawnDistance = config.spawnDistance;
        }
        

    }
    
    // 获取当前敌人数量
    getEnemyCount(): number {
        return this.enemies ? this.enemies.children.size : 0;
    }
}
