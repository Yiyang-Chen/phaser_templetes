import { Scene } from 'phaser';

/**
 * Virtual joystick for mobile controls
 */
class VirtualJoystick {
    private scene: Scene;
    private base: Phaser.GameObjects.Arc;
    private stick: Phaser.GameObjects.Arc;
    private container: Phaser.GameObjects.Container;
    private isDragging: boolean = false;
    private distance: number = 0;
    private angle: number = 0;
    private maxDistance: number;
    private isHidden: boolean;
    private startX: number = 0;
    private startY: number = 0;
    private touchId: number | null = null;
    
    public forceX: number = 0;
    public forceY: number = 0;
    
    constructor(scene: Scene, x: number, y: number, hidden: boolean = true, size?: number) {
        this.scene = scene;
        this.isHidden = hidden;
        
        // Calculate joystick size based on screen or use provided size
        const screenSize = Math.min(scene.cameras.main.width, scene.cameras.main.height);
        const baseSize = size || screenSize * 0.08;
        this.maxDistance = baseSize;
        
        // Create container
        this.container = scene.add.container(x, y);
        this.container.setDepth(1001);
        this.container.setScrollFactor(0);
        
        // Create joystick base
        this.base = scene.add.circle(0, 0, this.maxDistance, 0x000000, 0.3);
        this.base.setStrokeStyle(3, 0xffffff, 0.5);
        
        // Create joystick stick (proportional to base size)
        const stickSize = this.maxDistance * 0.4;
        this.stick = scene.add.circle(0, 0, stickSize, 0xffffff, 0.5);
        this.stick.setStrokeStyle(2, 0xffffff, 0.8);
        
        // Add to container
        this.container.add([this.base, this.stick]);
        
        // Set initial visibility
        if (hidden) {
            this.container.setAlpha(0);
        } else {
            // Visible mode - show with reduced opacity when not in use
            this.container.setAlpha(0.6);
        }
        
        // Setup touch events
        this.setupTouchEvents();
    }
    
    private setupTouchEvents(): void {
        const hitArea = this.isHidden ? 
            new Phaser.Geom.Rectangle(-200, -300, 400, 600) :
            new Phaser.Geom.Circle(0, 0, this.maxDistance);
        
        if (this.isHidden) {
            // For hidden joystick, create a larger touch area
            this.container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
        } else {
            // For visible joystick, use circular hit area
            this.container.setInteractive(hitArea, Phaser.Geom.Circle.Contains);
        }
        
        this.container.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            // Only respond if not already being controlled by another touch
            if (this.touchId !== null && this.touchId !== pointer.id) return;
            
            this.touchId = pointer.id;
            this.isDragging = true;
            
            if (this.isHidden) {
                // Move joystick to touch position
                const localX = pointer.x - this.container.x;
                const localY = pointer.y - this.container.y;
                this.startX = localX;
                this.startY = localY;
                this.base.setPosition(localX, localY);
                this.stick.setPosition(localX, localY);
                
                // Fade in
                this.scene.tweens.add({
                    targets: this.container,
                    alpha: 1,
                    duration: 200
                });
            } else {
                this.startX = 0;
                this.startY = 0;
                
                // Make visible joystick more prominent when in use
                this.scene.tweens.add({
                    targets: this.container,
                    alpha: 1,
                    duration: 100
                });
            }
        });
        
        this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            if (!this.isDragging || pointer.id !== this.touchId) return;
            
            const localX = pointer.x - this.container.x - this.startX;
            const localY = pointer.y - this.container.y - this.startY;
            
            this.distance = Math.sqrt(localX * localX + localY * localY);
            this.angle = Math.atan2(localY, localX);
            
            if (this.distance > this.maxDistance) {
                this.distance = this.maxDistance;
            }
            
            const stickX = Math.cos(this.angle) * this.distance;
            const stickY = Math.sin(this.angle) * this.distance;
            
            this.stick.setPosition(this.startX + stickX, this.startY + stickY);
            
            // Calculate force (0 to 1)
            this.forceX = stickX / this.maxDistance;
            this.forceY = stickY / this.maxDistance;
        });
        
        const resetJoystick = (pointer: Phaser.Input.Pointer) => {
            // Only reset if this pointer was controlling the joystick
            if (this.touchId === null || pointer.id !== this.touchId) return;
            
            this.isDragging = false;
            this.touchId = null;
            this.distance = 0;
            this.angle = 0;
            this.forceX = 0;
            this.forceY = 0;
            
            if (this.isHidden) {
                // Fade out and reset position
                this.scene.tweens.add({
                    targets: this.container,
                    alpha: 0,
                    duration: 200,
                    onComplete: () => {
                        this.base.setPosition(0, 0);
                        this.stick.setPosition(0, 0);
                    }
                });
            } else {
                // Reset stick position and reduce opacity
                this.scene.tweens.add({
                    targets: this.stick,
                    x: 0,
                    y: 0,
                    duration: 100
                });
                
                // Reduce opacity when not in use
                this.scene.tweens.add({
                    targets: this.container,
                    alpha: 0.6,
                    duration: 200
                });
            }
        };
        
        this.scene.input.on('pointerup', resetJoystick);
        this.scene.input.on('pointercancel', resetJoystick);
    }
    
    destroy(): void {
        this.container.destroy();
    }
}

/**
 * Mobile control button
 */
class MobileButton {
    private scene: Scene;
    private button: Phaser.GameObjects.Container;
    private background: Phaser.GameObjects.Arc;
    private icon: Phaser.GameObjects.Text;
    private isPressed: boolean = false;
    private touchId: number | null = null;
    private pressStartTime: number = 0;
    private progressRing: Phaser.GameObjects.Arc | null = null;
    private pulseEffect: Phaser.Tweens.Tween | null = null;
    
    public onPress: (() => void) | null = null;
    public onRelease: ((duration: number) => void) | null = null;
    public onHold: ((duration: number) => void) | null = null;
    
    constructor(scene: Scene, x: number, y: number, icon: string, size: number = 60) {
        this.scene = scene;
        
        // Create button container
        this.button = scene.add.container(x, y);
        this.button.setDepth(1001);
        this.button.setScrollFactor(0);
        
        // Create button background
        this.background = scene.add.circle(0, 0, size / 2, 0x000000, 0.3);
        this.background.setStrokeStyle(3, 0xffffff, 0.5);
        
        // Create icon
        this.icon = scene.add.text(0, 0, icon, {
            fontSize: `${size * 0.5}px`,
            color: '#ffffff'
        });
        this.icon.setOrigin(0.5);
        
        // Create progress ring (for visual feedback)
        this.progressRing = scene.add.circle(0, 0, size / 2 + 5, 0x00ff00, 0);
        this.progressRing.setStrokeStyle(4, 0x00ff00, 0);
        
        // Add to container
        this.button.add([this.progressRing, this.background, this.icon]);
        
        // Setup interaction
        this.setupInteraction(size);
    }
    
    private setupInteraction(size: number): void {
        const hitArea = new Phaser.Geom.Circle(0, 0, size / 2);
        this.button.setInteractive(hitArea, Phaser.Geom.Circle.Contains);
        
        this.button.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            // Only respond if not already being controlled by another touch
            if (this.touchId !== null && this.touchId !== pointer.id) return;
            
            this.touchId = pointer.id;
            this.isPressed = true;
            this.pressStartTime = this.scene.time.now;
            
            // Visual feedback
            this.background.setAlpha(0.5);
            this.button.setScale(0.9);
            
            // Start pulse effect for hold
            this.startPulseEffect();
            
            if (this.onPress) {
                this.onPress();
            }
            
            // Start hold check
            if (this.onHold) {
                this.startHoldCheck();
            }
        });
        
        const handleRelease = (pointer: Phaser.Input.Pointer) => {
            // Only handle release if this pointer was controlling the button
            if (this.touchId === null || pointer.id !== this.touchId) return;
            
            if (this.isPressed) {
                const duration = this.scene.time.now - this.pressStartTime;
                
                // Visual feedback
                this.background.setAlpha(0.3);
                this.button.setScale(1);
                
                // Stop effects
                this.stopPulseEffect();
                this.resetProgressRing();
                
                if (this.onRelease) {
                    this.onRelease(duration);
                }
            }
            
            this.isPressed = false;
            this.touchId = null;
            this.pressStartTime = 0;
        };
        
        this.scene.input.on('pointerup', handleRelease);
        this.scene.input.on('pointercancel', handleRelease);
    }
    
    private startHoldCheck(): void {
        const checkHold = () => {
            if (this.isPressed && this.onHold) {
                const duration = this.scene.time.now - this.pressStartTime;
                this.onHold(duration);
                
                // Continue checking while pressed
                this.scene.time.delayedCall(50, checkHold);
            }
        };
        
        this.scene.time.delayedCall(50, checkHold);
    }
    
    private startPulseEffect(): void {
        // Stop any existing pulse
        if (this.pulseEffect) {
            this.pulseEffect.stop();
        }
        
        // Create pulse effect on the icon
        this.pulseEffect = this.scene.tweens.add({
            targets: this.icon,
            scale: { from: 1, to: 1.2 },
            duration: 500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // Animate progress ring
        if (this.progressRing) {
            this.scene.tweens.add({
                targets: this.progressRing,
                alpha: { from: 0, to: 0.8 },
                duration: 200
            });
        }
    }
    
    private stopPulseEffect(): void {
        if (this.pulseEffect) {
            this.pulseEffect.stop();
            this.pulseEffect = null;
            
            // Reset icon scale
            this.icon.setScale(1);
        }
    }
    
    private resetProgressRing(): void {
        if (this.progressRing) {
            this.scene.tweens.add({
                targets: this.progressRing,
                alpha: 0,
                duration: 200
            });
        }
    }
    
    updateProgressLevel(level: number): void {
        if (!this.progressRing || !this.isPressed) return;
        
        // level is 0 to 1 (or higher for max)
        const clampedLevel = Math.min(level, 1);
        
        // Change color based on level
        let color = 0x00ff00; // Green
        if (level > 0.3) color = 0xffff00; // Yellow
        if (level > 0.6) color = 0xff8800; // Orange
        if (level > 0.9) color = 0xff0000; // Red
        
        this.progressRing.setStrokeStyle(4, color, 0.8);
        
        // Scale the ring based on progress
        const scale = 1 + (clampedLevel * 0.3);
        this.progressRing.setScale(scale);
    }
    
    isButtonPressed(): boolean {
        return this.isPressed;
    }
    
    getPressDuration(): number {
        if (!this.isPressed) return 0;
        return this.scene.time.now - this.pressStartTime;
    }
    
    destroy(): void {
        this.stopPulseEffect();
        this.button.destroy();
    }
}

/**
 * Mobile controls manager
 */
export class MobileControls {
    private scene: Scene;
    private joystick: VirtualJoystick | null = null;
    private jumpButton: MobileButton | null = null;
    private shootButton: MobileButton | null = null;
    private container: Phaser.GameObjects.Container;
    
    constructor(scene: Scene) {
        this.scene = scene;
        
        // Enable multi-touch support (support up to 4 simultaneous touches)
        if (scene.input) {
            scene.input.addPointer(3); // Default + 3 more = 4 total
        }
        
        // Create main container
        this.container = scene.add.container(0, 0);
        this.container.setDepth(1000);
        
        this.createControls();
    }
    
    private createControls(): void {
        const { width, height } = this.scene.cameras.main;
        
        // Mixed strategy: percentage as base, with pixel adjustments for safety margins
        const edgeMargin = 80;  // Safety margin from edges
        const bottomMargin = 120;  // Safety margin from bottom
        
        // Calculate positions - percentage based with safety margins
        // Joystick: 15% from left + ensure safety margin
        const joystickX = Math.max(width * 0.15, edgeMargin);
        const joystickY = height - Math.max(height * 0.2, bottomMargin);
        
        // Jump button: 85% position - ensure safety margin from right
        const jumpButtonX = width - Math.max(width * 0.15, edgeMargin);
        const jumpButtonY = height - Math.max(height * 0.2, bottomMargin);
        
        // Shoot button: 25% from right, slightly below jump
        const shootButtonX = width - Math.max(width * 0.25, edgeMargin + 80);
        const shootButtonY = height - Math.max(height * 0.15, bottomMargin - 30);
        
        // Calculate sizes - percentage based with min/max constraints
        const screenMin = Math.min(width, height);
        const baseButtonSize = Math.max(
            screenMin * 0.08,  // 8% of smaller dimension
            60  // Minimum 60px
        );
        const jumpButtonSize = Math.min(baseButtonSize * 1.2, 90);  // Jump button larger, max 90px
        const shootButtonSize = Math.min(baseButtonSize, 75);  // Regular size, max 75px
        const joystickSize = Math.min(baseButtonSize * 0.9, 70);  // Joystick size, max 70px
        
        // Create joystick on the left side (visible by default for better discovery)
        this.joystick = new VirtualJoystick(
            this.scene,
            joystickX,
            joystickY,
            false, // visible mode - change to true for hidden mode
            joystickSize
        );
        
        // Create jump button on the right
        this.jumpButton = new MobileButton(
            this.scene,
            jumpButtonX,
            jumpButtonY,
            '⬆',
            jumpButtonSize
        );
        
        // Create shoot button on the right
        this.shootButton = new MobileButton(
            this.scene,
            shootButtonX,
            shootButtonY,
            '🔫',
            shootButtonSize
        );
    }
    
    getJoystickForce(): { x: number, y: number } {
        if (!this.joystick) return { x: 0, y: 0 };
        return {
            x: this.joystick.forceX,
            y: this.joystick.forceY
        };
    }
    
    isJumpPressed(): boolean {
        return this.jumpButton?.isButtonPressed() || false;
    }
    
    getJumpDuration(): number {
        return this.jumpButton?.getPressDuration() || 0;
    }
    
    isShootPressed(): boolean {
        return this.shootButton?.isButtonPressed() || false;
    }
    
    setJumpCallbacks(onPress: () => void, onRelease: (duration: number) => void, onHold?: (duration: number) => void): void {
        if (this.jumpButton) {
            this.jumpButton.onPress = onPress;
            this.jumpButton.onRelease = onRelease;
            this.jumpButton.onHold = onHold || null;
        }
    }
    
    setShootCallbacks(onPress: () => void, onRelease?: (duration: number) => void): void {
        if (this.shootButton) {
            this.shootButton.onPress = onPress;
            this.shootButton.onRelease = onRelease || null;
        }
    }
    
    destroy(): void {
        this.joystick?.destroy();
        this.jumpButton?.destroy();
        this.shootButton?.destroy();
        this.container.destroy();
    }
}