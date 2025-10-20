import { Scene } from 'phaser';

/**
 * Manager for handling fullscreen functionality
 */
export class FullscreenManager {
    private static instance: FullscreenManager;
    private isFullscreen: boolean = false;
    private fullscreenButton: Phaser.GameObjects.Container | null = null;
    private scene: Scene | null = null;
    
    private constructor() {}
    
    static getInstance(): FullscreenManager {
        if (!FullscreenManager.instance) {
            FullscreenManager.instance = new FullscreenManager();
        }
        return FullscreenManager.instance;
    }
    
    /**
     * Create fullscreen button for mobile devices
     */
    createFullscreenButton(scene: Scene): Phaser.GameObjects.Container | null {
        this.scene = scene;
        
        // Clean up existing button if any
        if (this.fullscreenButton) {
            this.fullscreenButton.destroy();
            this.fullscreenButton = null;
        }
        
        // Create button container
        const buttonSize = 50;
        const padding = 20;
        const container = scene.add.container(
            scene.cameras.main.width - buttonSize - padding,
            padding + buttonSize / 2
        );
        
        // Create button background
        const bg = scene.add.circle(0, 0, buttonSize / 2, 0x000000, 0.5);
        bg.setStrokeStyle(2, 0xffffff, 0.8);
        container.add(bg);
        
        // Create fullscreen icon (simple rectangles)
        const iconSize = 20;
        const iconColor = 0xffffff;
        
        // Create expand/collapse icon based on current state
        if (!this.isFullscreen) {
            // Expand icon (four corners)
            const corner1 = scene.add.rectangle(-iconSize/3, -iconSize/3, 6, 6, iconColor);
            const corner2 = scene.add.rectangle(iconSize/3, -iconSize/3, 6, 6, iconColor);
            const corner3 = scene.add.rectangle(-iconSize/3, iconSize/3, 6, 6, iconColor);
            const corner4 = scene.add.rectangle(iconSize/3, iconSize/3, 6, 6, iconColor);
            
            // Add arrows pointing outward
            const arrow1 = scene.add.polygon(0, 0, [-8, -8, -8, -4, -4, -8], iconColor);
            const arrow2 = scene.add.polygon(0, 0, [8, -8, 8, -4, 4, -8], iconColor);
            const arrow3 = scene.add.polygon(0, 0, [-8, 8, -8, 4, -4, 8], iconColor);
            const arrow4 = scene.add.polygon(0, 0, [8, 8, 8, 4, 4, 8], iconColor);
            
            container.add([corner1, corner2, corner3, corner4, arrow1, arrow2, arrow3, arrow4]);
        } else {
            // Collapse icon (four corners pointing inward)
            const corner1 = scene.add.rectangle(-iconSize/3, -iconSize/3, 6, 6, iconColor);
            const corner2 = scene.add.rectangle(iconSize/3, -iconSize/3, 6, 6, iconColor);
            const corner3 = scene.add.rectangle(-iconSize/3, iconSize/3, 6, 6, iconColor);
            const corner4 = scene.add.rectangle(iconSize/3, iconSize/3, 6, 6, iconColor);
            
            // Add arrows pointing inward
            const arrow1 = scene.add.polygon(0, 0, [-4, -4, -4, -8, -8, -4], iconColor);
            const arrow2 = scene.add.polygon(0, 0, [4, -4, 4, -8, 8, -4], iconColor);
            const arrow3 = scene.add.polygon(0, 0, [-4, 4, -4, 8, -8, 4], iconColor);
            const arrow4 = scene.add.polygon(0, 0, [4, 4, 4, 8, 8, 4], iconColor);
            
            container.add([corner1, corner2, corner3, corner4, arrow1, arrow2, arrow3, arrow4]);
        }
        
        // Make button interactive
        container.setSize(buttonSize, buttonSize);
        container.setInteractive();
        
        // Set fixed depth to stay on top
        container.setDepth(10000);
        container.setScrollFactor(0);
        
        // Add hover effects
        container.on('pointerover', () => {
            bg.setAlpha(0.7);
            container.setScale(1.1);
        });
        
        container.on('pointerout', () => {
            bg.setAlpha(0.5);
            container.setScale(1);
        });
        
        // Add click handler
        container.on('pointerdown', () => {
            container.setScale(0.95);
        });
        
        container.on('pointerup', () => {
            container.setScale(1.1);
            this.toggleFullscreen();
        });
        
        this.fullscreenButton = container;
        return container;
    }
    
    /**
     * Toggle fullscreen mode
     */
    toggleFullscreen(): void {
        if (!this.scene) return;
        
        if (!this.isFullscreen) {
            this.enterFullscreen();
        } else {
            this.exitFullscreen();
        }
    }
    
    /**
     * Enter fullscreen mode
     */
    private enterFullscreen(): void {
        if (!this.scene) return;
        
        const element = document.documentElement;
        
        if (element.requestFullscreen) {
            element.requestFullscreen();
        } else if ((element as any).webkitRequestFullscreen) {
            (element as any).webkitRequestFullscreen();
        } else if ((element as any).mozRequestFullScreen) {
            (element as any).mozRequestFullScreen();
        } else if ((element as any).msRequestFullscreen) {
            (element as any).msRequestFullscreen();
        }
        
        this.isFullscreen = true;
        this.updateButtonIcon();
        
        // For iOS devices that don't support fullscreen API, at least hide UI elements
        if (this.isIOSDevice()) {
            this.hideIOSUI();
        }
    }
    
    /**
     * Exit fullscreen mode
     */
    private exitFullscreen(): void {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
            (document as any).webkitExitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
            (document as any).mozCancelFullScreen();
        } else if ((document as any).msExitFullscreen) {
            (document as any).msExitFullscreen();
        }
        
        this.isFullscreen = false;
        this.updateButtonIcon();
    }
    
    /**
     * Update button icon based on fullscreen state
     */
    private updateButtonIcon(): void {
        if (this.fullscreenButton && this.scene) {
            // Recreate button with new icon
            const x = this.fullscreenButton.x;
            const y = this.fullscreenButton.y;
            this.fullscreenButton.destroy();
            
            // Recreate with updated icon
            this.createFullscreenButton(this.scene);
            if (this.fullscreenButton) {
                this.fullscreenButton.x = x;
                this.fullscreenButton.y = y;
            }
        }
    }
    
    /**
     * Check if device is iOS
     */
    private isIOSDevice(): boolean {
        return /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase()) ||
               (navigator.userAgent.includes('Macintosh') && 'ontouchend' in document);
    }
    
    /**
     * Hide iOS UI elements (address bar, etc.)
     */
    private hideIOSUI(): void {
        // Scroll to hide address bar
        window.scrollTo(0, 1);
        
        // Set viewport meta tag for better fullscreen experience
        let viewport = document.querySelector('meta[name="viewport"]');
        if (!viewport) {
            viewport = document.createElement('meta');
            viewport.setAttribute('name', 'viewport');
            document.head.appendChild(viewport);
        }
        viewport.setAttribute('content', 
            'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
    }
    
    /**
     * Check if currently in fullscreen
     */
    isInFullscreen(): boolean {
        return this.isFullscreen || !!(document.fullscreenElement || 
               (document as any).webkitFullscreenElement || 
               (document as any).mozFullScreenElement || 
               (document as any).msFullscreenElement);
    }
    
    /**
     * Clean up fullscreen button
     */
    destroy(): void {
        if (this.fullscreenButton) {
            this.fullscreenButton.destroy();
            this.fullscreenButton = null;
        }
        this.scene = null;
        this.isFullscreen = false;
    }
}