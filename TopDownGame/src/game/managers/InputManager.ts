/**
 * 输入管理器 - 统一管理游戏输入
 * Input Manager for centralized input handling
 */

import { Scene } from 'phaser';

export interface InputState {
    movement: {
        up: boolean;
        down: boolean;
        left: boolean;
        right: boolean;
        isMoving: boolean;
        direction: { x: number; y: number };
    };
    actions: {
        shoot: boolean;
        shootJustPressed: boolean;
        restart: boolean;
        restartJustPressed: boolean;
        weaponSwitchPrev: boolean;
        weaponSwitchNext: boolean;
    };
    mouse: {
        isDown: boolean;
        worldX: number;
        worldY: number;
        justPressed: boolean;
    };
}

export class InputManager {
    private scene: Scene;
    private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    private wasdKeys: {
        W: Phaser.Input.Keyboard.Key;
        A: Phaser.Input.Keyboard.Key;
        S: Phaser.Input.Keyboard.Key;
        D: Phaser.Input.Keyboard.Key;
    };
    private actionKeys: {
        shoot: Phaser.Input.Keyboard.Key;
        restart: Phaser.Input.Keyboard.Key;
        weaponPrev: Phaser.Input.Keyboard.Key;
        weaponNext: Phaser.Input.Keyboard.Key;
    };
    
    private inputState: InputState;
    private previousMouseDown: boolean = false;
    
    constructor(scene: Scene) {
        this.scene = scene;
        this.setupKeys();
        this.initializeInputState();
    }
    
    private setupKeys(): void {
        const keyboard = this.scene.input.keyboard;
        if (!keyboard) {
            throw new Error('Keyboard input not available');
        }
        
        // 方向键
        this.cursors = keyboard.createCursorKeys();
        
        // WASD键
        this.wasdKeys = {
            W: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            A: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            S: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            D: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
        };
        
        // 动作键
        this.actionKeys = {
            shoot: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
            restart: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R),
            weaponPrev: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q),
            weaponNext: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E)
        };
    }
    
    private initializeInputState(): void {
        this.inputState = {
            movement: {
                up: false,
                down: false,
                left: false,
                right: false,
                isMoving: false,
                direction: { x: 0, y: 0 }
            },
            actions: {
                shoot: false,
                shootJustPressed: false,
                restart: false,
                restartJustPressed: false,
                weaponSwitchPrev: false,
                weaponSwitchNext: false
            },
            mouse: {
                isDown: false,
                worldX: 0,
                worldY: 0,
                justPressed: false
            }
        };
    }
    
    update(): void {
        this.updateMovementInput();
        this.updateActionInput();
        this.updateMouseInput();
    }
    
    private updateMovementInput(): void {
        const movement = this.inputState.movement;
        
        // 更新移动状态
        movement.up = this.cursors.up.isDown || this.wasdKeys.W.isDown;
        movement.down = this.cursors.down.isDown || this.wasdKeys.S.isDown;
        movement.left = this.cursors.left.isDown || this.wasdKeys.A.isDown;
        movement.right = this.cursors.right.isDown || this.wasdKeys.D.isDown;
        
        // 计算移动方向
        let moveX = 0;
        let moveY = 0;
        
        if (movement.up) moveY -= 1;
        if (movement.down) moveY += 1;
        if (movement.left) moveX -= 1;
        if (movement.right) moveX += 1;
        
        // 对角线移动时标准化速度
        if (moveX !== 0 && moveY !== 0) {
            moveX *= 0.707; // 1/√2
            moveY *= 0.707;
        }
        
        movement.direction.x = moveX;
        movement.direction.y = moveY;
        movement.isMoving = moveX !== 0 || moveY !== 0;
    }
    
    private updateActionInput(): void {
        const actions = this.inputState.actions;
        
        // 射击
        actions.shoot = this.actionKeys.shoot.isDown;
        actions.shootJustPressed = Phaser.Input.Keyboard.JustDown(this.actionKeys.shoot);
        
        // 重启
        actions.restart = this.actionKeys.restart.isDown;
        actions.restartJustPressed = Phaser.Input.Keyboard.JustDown(this.actionKeys.restart);
        
        // 武器切换
        actions.weaponSwitchPrev = Phaser.Input.Keyboard.JustDown(this.actionKeys.weaponPrev);
        actions.weaponSwitchNext = Phaser.Input.Keyboard.JustDown(this.actionKeys.weaponNext);
    }
    
    private updateMouseInput(): void {
        const mouse = this.inputState.mouse;
        const pointer = this.scene.input.activePointer;
        
        // 更新鼠标状态
        const currentMouseDown = pointer.isDown && pointer.primaryDown;
        mouse.justPressed = currentMouseDown && !this.previousMouseDown;
        mouse.isDown = currentMouseDown;
        this.previousMouseDown = currentMouseDown;
        
        // 更新世界坐标
        const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
        mouse.worldX = worldPoint.x;
        mouse.worldY = worldPoint.y;
    }
    
    getInputState(): InputState {
        return this.inputState;
    }
    
    // 便捷方法
    isMoving(): boolean {
        return this.inputState.movement.isMoving;
    }
    
    getMovementDirection(): { x: number; y: number } {
        return this.inputState.movement.direction;
    }
    
    isShootingKeyboard(): boolean {
        return this.inputState.actions.shootJustPressed;
    }
    
    isShootingMouse(): boolean {
        return this.inputState.mouse.justPressed || 
               (this.inputState.mouse.isDown && this.scene.input.activePointer.downTime > this.scene.input.activePointer.upTime);
    }
    
    getMouseWorldPosition(): { x: number; y: number } {
        return { x: this.inputState.mouse.worldX, y: this.inputState.mouse.worldY };
    }
    
    isRestartPressed(): boolean {
        return this.inputState.actions.restartJustPressed;
    }
    
    isWeaponSwitchPrevPressed(): boolean {
        return this.inputState.actions.weaponSwitchPrev;
    }
    
    isWeaponSwitchNextPressed(): boolean {
        return this.inputState.actions.weaponSwitchNext;
    }
    
    // 获取玩家主要移动方向（用于动画）
    getPrimaryDirection(): string {
        const movement = this.inputState.movement;
        if (!movement.isMoving) return 'idle';
        
        const absX = Math.abs(movement.direction.x);
        const absY = Math.abs(movement.direction.y);
        
        if (absY > absX) {
            return movement.direction.y > 0 ? 'down' : 'up';
        } else {
            return movement.direction.x > 0 ? 'right' : 'left';
        }
    }
    
    // 清理资源
    destroy(): void {
        // Phaser会自动清理键盘输入，这里主要是重置状态
        this.initializeInputState();
    }
}
