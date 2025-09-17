import { Scene } from 'phaser';
import { OptimizedBullet } from './OptimizedBullet';
import { ConfigManager } from '../config/ConfigManager';
import { IWeapon } from '../types/GameTypes';

export class Weapon extends Phaser.GameObjects.Sprite implements IWeapon {
    private weaponName: string; // 武器名称 (如: pistol_01, rifle_05, shotgun_12)
    private weaponType: string; // 武器类型 (pistol, rifle, shotgun)
    private isShooting: boolean = false;
    private shootCooldown: number = 0;
    private shootCooldownTime: number;
    private configManager: ConfigManager;
    
    // 所有可用武器列表
    private static readonly ALL_WEAPONS: string[] = [
        // 手枪 (25种)
        ...Array.from({length: 25}, (_, i) => `pistol_${(i + 1).toString().padStart(2, '0')}`),
        // 步枪 (11种)
        ...Array.from({length: 11}, (_, i) => `rifle_${(i + 1).toString().padStart(2, '0')}`),
        // 霰弹枪 (12种)
        ...Array.from({length: 12}, (_, i) => `shotgun_${(i + 1).toString().padStart(2, '0')}`)
    ];
    
    // 武器-子弹映射配置：为不同武器类型分配不同的子弹类型
    private static readonly WEAPON_BULLET_MAPPING: { [key: string]: string } = {
        'pistol': 'bullets1',   // 手枪使用bullets1
        'rifle': 'bullets2',    // 步枪使用bullets2  
        'shotgun': 'bullets3'   // 霰弹枪使用bullets3
    };
    
    constructor(scene: Scene, x: number, y: number, weaponName: string = 'random') {
        // 选择武器
        let selectedWeapon: string;
        if (weaponName === 'random') {
            // 随机选择一个武器
            const randomIndex = Math.floor(Math.random() * Weapon.ALL_WEAPONS.length);
            selectedWeapon = Weapon.ALL_WEAPONS[randomIndex];
        } else {
            selectedWeapon = weaponName;
        }
        
        super(scene, x, y, selectedWeapon, 'idle/frame0000'); // 使用atlas格式，默认待机帧
        
        this.weaponName = selectedWeapon;
        // 解析武器类型 (如: pistol_01 -> type: pistol)
        const parts = selectedWeapon.split('_');
        this.weaponType = parts[0];
        
        // 初始化配置
        this.configManager = ConfigManager.getInstance();
        this.shootCooldownTime = 500; // 默认值，可以从配置中获取
        
        scene.add.existing(this);
        
        // 使用统一标准配置设置武器属性
        const weaponStandardConfig = this.configManager.getWeaponStandardConfig();
        this.setScale(weaponStandardConfig.scale);
        this.setOrigin(0.25, 0.5); // 设置原点在武器手柄位置（左侧1/4处），让武器围绕手柄旋转
        this.setDepth(weaponStandardConfig.zDepth);
        this.setAlpha(1.0); // 完全不透明
        this.setVisible(true); // 确保可见
        
        // 播放待机动画
        this.play(`${this.weaponName}_idle`);
        
        // 武器创建完成
    }
    
    update(x: number, y: number, direction: string, _isMoving: boolean, mouseX?: number, mouseY?: number): void {
        // 武器位置：由于武器原点现在在手柄位置，需要调整偏移让手柄贴近玩家手部
        const offsetY = 8; // 武器手柄在人物胸前偏下位置
        const offsetX = 10; // 武器手柄稍微偏右（玩家右手位置）
        
        // 武器手柄与人物手部位置对齐
        this.setPosition(x + offsetX, y + offsetY);
        
        // 如果提供了鼠标位置，计算武器应该指向的角度
        if (mouseX !== undefined && mouseY !== undefined) {
            // 计算从武器位置到鼠标位置的角度
            const deltaX = mouseX - this.x;
            const deltaY = mouseY - this.y;
            const angleToMouse = Math.atan2(deltaY, deltaX);
            
            // 设置武器旋转角度，让枪口朝向鼠标
            this.setRotation(angleToMouse);
            
            // 根据角度决定是否需要翻转武器
            // 当角度在左半边时，上下翻转武器让它看起来朝向正确
            const angleDegrees = angleToMouse * (180 / Math.PI);
            if (Math.abs(angleDegrees) > 90) {
                this.setFlipY(true); // 朝向左侧时上下翻转
            } else {
                this.setFlipY(false); // 朝向右侧时正常显示
            }
        } else {
            // 如果没有鼠标位置，使用传统的方向控制
            let targetRotation = 0;
            if (direction === 'left') {
                targetRotation = Math.PI; // 180度，朝左
                this.setFlipY(true);
            } else if (direction === 'right') {
                targetRotation = 0; // 0度，朝右
                this.setFlipY(false);
            } else if (direction === 'up') {
                targetRotation = -Math.PI / 2; // -90度，朝上
                this.setFlipY(false);
            } else if (direction === 'down') {
                targetRotation = Math.PI / 2; // 90度，朝下
                this.setFlipY(false);
            }
            this.setRotation(targetRotation);
        }
        
        // 更新射击冷却
        if (this.shootCooldown > 0) {
            this.shootCooldown -= this.scene.game.loop.delta;
        }
        
        // 如果射击动画结束，回到待机状态
        if (this.isShooting && !this.anims.isPlaying) {
            this.isShooting = false;
            this.play(`${this.weaponName}_idle`);
        }
        
        // 详细调试信息已移除以减少日志输出
    }
    

    
    shoot(targetX?: number, targetY?: number): boolean {
        // 检查射击冷却
        if (this.shootCooldown > 0 || this.isShooting) {
            return false;
        }
        
        // 开始射击
        this.isShooting = true;
        this.shootCooldown = this.shootCooldownTime;
        
        // 播放射击动画
        this.play(`${this.weaponName}_active`);
        
        // 创建子弹
        this.createBullet(targetX, targetY);
        
        // 射击完成后回到待机状态
        this.once('animationcomplete', () => {
            this.isShooting = false;
            this.play(`${this.weaponName}_idle`);
        });
        
        // 武器射击完成
        return true;
    }
    
    private createBullet(targetX?: number, targetY?: number): void {
        // 计算射击方向
        let direction: Phaser.Math.Vector2;
        
        if (targetX !== undefined && targetY !== undefined) {
            // 朝向鼠标位置射击
            const deltaX = targetX - this.x;
            const deltaY = targetY - this.y;
            direction = new Phaser.Math.Vector2(deltaX, deltaY).normalize();
            
            // 计算子弹发射参数
        } else {
            // 朝向当前武器朝向射击
            if (this.flipX) {
                direction = new Phaser.Math.Vector2(-1, 0); // 朝左
            } else {
                direction = new Phaser.Math.Vector2(1, 0);  // 朝右
            }
            
            // 方向性射击
        }
        
        // 计算子弹起始位置（武器枪口位置）
        // 由于武器原点在手柄位置（左侧1/4处），枪口在右侧，需要计算枪口的世界坐标
        const weaponLength = 48; // 武器缩放后长度的3/4（从手柄到枪口的距离）
        const muzzleOffsetX = Math.cos(this.rotation) * weaponLength;
        const muzzleOffsetY = Math.sin(this.rotation) * weaponLength;
        
        const bulletStartX = this.x + muzzleOffsetX;
        const bulletStartY = this.y + muzzleOffsetY;
        
        // 创建子弹实例
        
        // 获取当前武器对应的子弹类型
        const bulletType = this.getBulletType();
        // 子弹创建调试信息已移除
        
        // 使用对象池获取优化的子弹
        const bullet = OptimizedBullet.fire(this.scene, bulletStartX, bulletStartY, direction, bulletType);
        
        // 如果场景有bullets组，添加到组中
        const gameScene = this.scene as any;
        if (gameScene.bullets) {
            gameScene.bullets.add(bullet);
            
            // 只在调试模式下输出日志
            const debugConfig = this.configManager.getDebugConfig();
            if (debugConfig.enableLogging) {
                // 子弹已添加到池中
            }
        } else {
            console.warn('No bullets group found in game scene!');
        }
    }
    
    getWeaponType(): string {
        return this.weaponType;
    }
    
    isWeaponReady(): boolean {
        return this.shootCooldown <= 0 && !this.isShooting;
    }
    
    setWeaponName(weaponName: string): void {
        // 如果是随机武器，重新随机选择
        if (weaponName === 'random') {
            const randomIndex = Math.floor(Math.random() * Weapon.ALL_WEAPONS.length);
            this.weaponName = Weapon.ALL_WEAPONS[randomIndex];
        } else {
            this.weaponName = weaponName;
        }
        
        // 解析武器类型
        const parts = this.weaponName.split('_');
        this.weaponType = parts[0];
        
        // 切换到新的纹理和帧
        this.setTexture(this.weaponName, 'idle/frame0000');
        
        // 播放新武器的待机动画
        this.play(`${this.weaponName}_idle`);
        
        // 武器切换完成
    }
    
    getWeaponName(): string {
        return this.weaponName;
    }
    
    getWeaponIndex(): number {
        return Weapon.ALL_WEAPONS.indexOf(this.weaponName);
    }
    
    switchToPreviousWeapon(): void {
        const currentIndex = this.getWeaponIndex();
        const totalWeapons = Weapon.ALL_WEAPONS.length;
        const newIndex = (currentIndex - 1 + totalWeapons) % totalWeapons;
        this.switchToWeaponByIndex(newIndex);
    }
    
    switchToNextWeapon(): void {
        const currentIndex = this.getWeaponIndex();
        const totalWeapons = Weapon.ALL_WEAPONS.length;
        const newIndex = (currentIndex + 1) % totalWeapons;
        this.switchToWeaponByIndex(newIndex);
    }
    
    private switchToWeaponByIndex(index: number): void {
        const newWeaponName = Weapon.ALL_WEAPONS[index];
        this.setWeaponName(newWeaponName);
        
        // 创建武器切换的视觉效果
        this.createSwitchEffect();
        
        // 武器索引切换完成
    }
    
    private createSwitchEffect(): void {
        // 创建武器切换时的闪烁效果
        this.scene.tweens.add({
            targets: this,
            alpha: { from: 1, to: 0.3 },
            scale: { from: this.scaleX, to: this.scaleX * 1.2 },
            duration: 100,
            yoyo: true,
            repeat: 1,
            ease: 'Power2'
        });
    }
    
    // 获取当前武器对应的子弹类型
    getBulletType(): string {
        return Weapon.WEAPON_BULLET_MAPPING[this.weaponType] || 'bullets1'; // 默认使用bullets1
    }
    
    // 获取武器子弹映射信息（用于调试）
    static getWeaponBulletMapping(): { [key: number]: string } {
        return { ...Weapon.WEAPON_BULLET_MAPPING };
    }
}
