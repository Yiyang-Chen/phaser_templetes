import { Scene, GameObjects } from 'phaser';

export interface UIPosition {
    x?: number | string;
    y?: number | string;
    anchorX?: number;
    anchorY?: number;
}

export interface UIElementConfig {
    type: 'text' | 'image' | 'button' | 'container';
    position: UIPosition;
    scale?: number | { x: number; y: number };
    origin?: { x: number; y: number };
    depth?: number;
    visible?: boolean;
    interactive?: boolean;
    alpha?: number;
}

export interface TextElementConfig extends UIElementConfig {
    type: 'text';
    text: string;
    style?: Phaser.Types.GameObjects.Text.TextStyle;
}

export interface ImageElementConfig extends UIElementConfig {
    type: 'image';
    texture: string;
    frame?: string | number;
    tint?: number;
}

export interface ButtonElementConfig extends UIElementConfig {
    type: 'button';
    texture?: string;
    text?: string;
    textStyle?: Phaser.Types.GameObjects.Text.TextStyle;
    onClick?: () => void;
    onHover?: () => void;
    onOut?: () => void;
    hoverScale?: number;
    clickScale?: number;
}

export interface ContainerElementConfig extends UIElementConfig {
    type: 'container';
    children?: (TextElementConfig | ImageElementConfig | ButtonElementConfig)[];
}

export type UIElement = TextElementConfig | ImageElementConfig | ButtonElementConfig | ContainerElementConfig;

export interface UILayoutConfig {
    elements: { [key: string]: UIElement };
    responsive?: boolean;
    baseWidth?: number;
    baseHeight?: number;
    minAspectRatio?: number;
    maxAspectRatio?: number;
    scalingMode?: 'fit' | 'fill' | 'stretch' | 'none';
}

export class UIManager {
    private scene: Scene;
    private elements: Map<string, GameObjects.GameObject>;
    private config: UILayoutConfig;
    private baseWidth: number;
    private baseHeight: number;
    private currentScale: number = 1;
    private currentWidth: number;
    private currentHeight: number;

    constructor(scene: Scene, config: UILayoutConfig) {
        this.scene = scene;
        this.config = config;
        this.elements = new Map();
        
        this.baseWidth = config.baseWidth || 1920;
        this.baseHeight = config.baseHeight || 1080;
        
        this.currentWidth = this.scene.cameras.main.width;
        this.currentHeight = this.scene.cameras.main.height;
        
        this.setupResizeHandlers();
        this.calculateScale();
    }

    private setupResizeHandlers(): void {
        if (this.config.responsive !== false) {
            this.scene.scale.on('resize', this.onResize, this);
        }
    }

    private onResize(gameSize: Phaser.Structs.Size): void {
        this.currentWidth = gameSize.width;
        this.currentHeight = gameSize.height;
        this.calculateScale();
        this.updateLayout();
    }

    private calculateScale(): void {
        const scalingMode = this.config.scalingMode || 'fit';
        const aspectRatio = this.currentWidth / this.currentHeight;
        const baseAspectRatio = this.baseWidth / this.baseHeight;
        
        switch (scalingMode) {
            case 'fit':
                this.currentScale = Math.min(
                    this.currentWidth / this.baseWidth,
                    this.currentHeight / this.baseHeight
                );
                break;
            case 'fill':
                this.currentScale = Math.max(
                    this.currentWidth / this.baseWidth,
                    this.currentHeight / this.baseHeight
                );
                break;
            case 'stretch':
                this.currentScale = 1;
                break;
            case 'none':
            default:
                this.currentScale = 1;
                break;
        }
        
        if (this.config.minAspectRatio && aspectRatio < this.config.minAspectRatio) {
            this.currentScale *= aspectRatio / this.config.minAspectRatio;
        }
        if (this.config.maxAspectRatio && aspectRatio > this.config.maxAspectRatio) {
            this.currentScale *= this.config.maxAspectRatio / aspectRatio;
        }
    }

    public createUI(): void {
        Object.entries(this.config.elements).forEach(([key, elementConfig]) => {
            const element = this.createElement(elementConfig);
            if (element) {
                this.elements.set(key, element);
            }
        });
        
        this.updateLayout();
    }

    private createElement(config: UIElement): GameObjects.GameObject | null {
        switch (config.type) {
            case 'text':
                return this.createText(config as TextElementConfig);
            case 'image':
                return this.createImage(config as ImageElementConfig);
            case 'button':
                return this.createButton(config as ButtonElementConfig);
            case 'container':
                return this.createContainer(config as ContainerElementConfig);
            default:
                console.warn(`Unknown UI element type: ${(config as any).type}`);
                return null;
        }
    }

    private createText(config: TextElementConfig): GameObjects.Text {
        const { x, y } = this.calculatePosition(config.position);
        
        const text = this.scene.add.text(x, y, config.text, {
            fontSize: '32px',
            color: '#ffffff',
            ...config.style
        });
        
        if (config.origin) {
            text.setOrigin(config.origin.x, config.origin.y);
        }
        
        this.applyCommonProperties(text, config);
        
        return text;
    }

    private createImage(config: ImageElementConfig): GameObjects.Image {
        const { x, y } = this.calculatePosition(config.position);
        
        const image = this.scene.add.image(x, y, config.texture, config.frame);
        
        if (config.origin) {
            image.setOrigin(config.origin.x, config.origin.y);
        }
        
        if (config.tint !== undefined) {
            image.setTint(config.tint);
        }
        
        this.applyCommonProperties(image, config);
        
        return image;
    }

    private createButton(config: ButtonElementConfig): GameObjects.Container {
        const { x, y } = this.calculatePosition(config.position);
        
        const container = this.scene.add.container(x, y);
        
        let background: GameObjects.Image | GameObjects.Rectangle | null = null;
        let label: GameObjects.Text | null = null;
        
        if (config.texture) {
            background = this.scene.add.image(0, 0, config.texture);
            container.add(background);
        }
        
        if (config.text) {
            label = this.scene.add.text(0, 0, config.text, {
                fontSize: '24px',
                color: '#ffffff',
                ...config.textStyle
            });
            label.setOrigin(0.5);
            container.add(label);
        }
        
        // If no background texture provided, create a semi-transparent background for the button
        if (!background && label) {
            const padding = 30;
            const bgRect = this.scene.add.rectangle(
                0, 0, 
                label.width + padding * 2, 
                label.height + padding,
                0x000000, 0.5
            );
            bgRect.setStrokeStyle(2, 0xffffff, 0.8);
            // Add background first so it's behind the text
            container.addAt(bgRect, 0);
            background = bgRect;
        }
        
        // Make the entire container interactive
        if (background) {
            // Use the background's bounds for interaction
            container.setSize(background.width, background.height);
        } else if (label) {
            // Use label bounds with padding if no background
            container.setSize(label.width + 40, label.height + 20);
        } else {
            // Fallback size
            container.setSize(150, 60);
        }
        
        // Make container interactive - the hit area will be the container's size
        container.setInteractive();
        
        // Debug: Visualize hit area (set to true to debug)
        const debugMode = false;
        if (debugMode) {
            const bounds = container.getBounds();
            const debugRect = this.scene.add.rectangle(
                0, 0,
                container.width,
                container.height,
                0x00ff00, 0.3
            );
            debugRect.setStrokeStyle(2, 0x00ff00, 1);
            container.add(debugRect);
        }
        
        const originalScale = config.scale || 1;
        const hoverScale = config.hoverScale || 1.1;
        const clickScale = config.clickScale || 0.95;
        
        container.on('pointerover', () => {
            this.scene.tweens.add({
                targets: container,
                scale: this.getScaleValue(originalScale) * hoverScale,
                duration: 100
            });
            if (config.onHover) config.onHover();
        });
        
        container.on('pointerout', () => {
            this.scene.tweens.add({
                targets: container,
                scale: this.getScaleValue(originalScale),
                duration: 100
            });
            if (config.onOut) config.onOut();
        });
        
        container.on('pointerdown', () => {
            this.scene.tweens.add({
                targets: container,
                scale: this.getScaleValue(originalScale) * clickScale,
                duration: 50
            });
        });
        
        container.on('pointerup', () => {
            this.scene.tweens.add({
                targets: container,
                scale: this.getScaleValue(originalScale) * hoverScale,
                duration: 50
            });
            if (config.onClick) config.onClick();
        });
        
        this.applyCommonProperties(container, config);
        
        return container;
    }

    private createContainer(config: ContainerElementConfig): GameObjects.Container {
        const { x, y } = this.calculatePosition(config.position);
        
        const container = this.scene.add.container(x, y);
        
        if (config.children) {
            config.children.forEach((childConfig) => {
                const child = this.createElement(childConfig);
                if (child) {
                    container.add(child);
                }
            });
        }
        
        this.applyCommonProperties(container, config);
        
        return container;
    }

    private calculatePosition(position: UIPosition): { x: number; y: number } {
        const x = this.parsePosition(position.x || '50%', this.currentWidth);
        const y = this.parsePosition(position.y || '50%', this.currentHeight);
        
        return { x, y };
    }

    private parsePosition(value: string | number, reference: number): number {
        if (typeof value === 'number') {
            return value * this.currentScale;
        }
        
        if (typeof value === 'string') {
            if (value.endsWith('%')) {
                const percentage = parseFloat(value.slice(0, -1)) / 100;
                return reference * percentage;
            }
            
            if (value.endsWith('px')) {
                return parseFloat(value.slice(0, -2)) * this.currentScale;
            }
            
            return parseFloat(value) * this.currentScale;
        }
        
        return reference / 2;
    }

    private getScaleValue(scale: number | { x: number; y: number }): number {
        if (typeof scale === 'number') {
            return scale * this.currentScale;
        }
        return Math.max(scale.x, scale.y) * this.currentScale;
    }

    private applyCommonProperties(obj: GameObjects.GameObject, config: UIElementConfig): void {
        if (config.scale !== undefined) {
            if (typeof config.scale === 'number') {
                obj.setScale(config.scale * this.currentScale);
            } else {
                obj.setScale(config.scale.x * this.currentScale, config.scale.y * this.currentScale);
            }
            
            // Update interactive area for containers after scaling
            if (obj instanceof Phaser.GameObjects.Container && config.type === 'button') {
                const scale = typeof config.scale === 'number' ? config.scale : Math.max(config.scale.x, config.scale.y);
                const scaledBounds = obj.input?.hitArea as Phaser.Geom.Rectangle;
                if (scaledBounds) {
                    // Don't modify the hit area directly, it scales with the container
                    // The hit area is relative to the container, so it automatically scales
                }
            }
        }
        
        if (config.depth !== undefined) {
            obj.setDepth(config.depth);
        }
        
        if (config.visible !== undefined) {
            obj.setVisible(config.visible);
        }
        
        if (config.alpha !== undefined) {
            obj.setAlpha(config.alpha);
        }
        
        if (config.interactive && 'setInteractive' in obj) {
            (obj as any).setInteractive();
        }
    }

    private updateLayout(): void {
        this.calculateScale();
        
        this.elements.forEach((element, key) => {
            const config = this.config.elements[key];
            if (config) {
                const { x, y } = this.calculatePosition(config.position);
                element.setPosition(x, y);
                
                if (config.scale !== undefined) {
                    if (typeof config.scale === 'number') {
                        element.setScale(config.scale * this.currentScale);
                    } else {
                        element.setScale(config.scale.x * this.currentScale, config.scale.y * this.currentScale);
                    }
                }
                
                if (element instanceof Phaser.GameObjects.Text && config.type === 'text') {
                    const textConfig = config as TextElementConfig;
                    if (textConfig.style?.fontSize) {
                        const baseFontSize = parseInt(textConfig.style.fontSize.toString());
                        element.setFontSize(baseFontSize * this.currentScale);
                    }
                }
            }
        });
    }

    public getElement(key: string): GameObjects.GameObject | undefined {
        return this.elements.get(key);
    }

    public updateElement(key: string, updates: Partial<UIElement>): void {
        const element = this.elements.get(key);
        const config = this.config.elements[key];
        
        if (!element || !config) return;
        
        Object.assign(config, updates);
        
        if (updates.position) {
            const { x, y } = this.calculatePosition(updates.position);
            element.setPosition(x, y);
        }
        
        if (updates.visible !== undefined) {
            element.setVisible(updates.visible);
        }
        
        if (updates.alpha !== undefined) {
            element.setAlpha(updates.alpha);
        }
        
        if (element instanceof Phaser.GameObjects.Text && updates.type === 'text') {
            const textUpdates = updates as Partial<TextElementConfig>;
            if (textUpdates.text) {
                element.setText(textUpdates.text);
            }
        }
    }

    public animateElement(key: string, tweenConfig: Phaser.Types.Tweens.TweenBuilderConfig): void {
        const element = this.elements.get(key);
        const config = this.config.elements[key];
        if (element && config) {
            // Process position-based animations
            const processedConfig = { ...tweenConfig };
            
            // Handle x animation with percentage values
            if (processedConfig.x) {
                if (typeof processedConfig.x === 'object') {
                    const xConfig = processedConfig.x as any;
                    if (xConfig.from && typeof xConfig.from === 'string') {
                        xConfig.from = this.parsePosition(xConfig.from, this.currentWidth);
                    }
                    if (xConfig.to && typeof xConfig.to === 'string') {
                        xConfig.to = this.parsePosition(xConfig.to, this.currentWidth);
                    }
                } else if (typeof processedConfig.x === 'string') {
                    processedConfig.x = this.parsePosition(processedConfig.x as string, this.currentWidth);
                }
            }
            
            // Handle y animation with percentage values
            if (processedConfig.y) {
                if (typeof processedConfig.y === 'object') {
                    const yConfig = processedConfig.y as any;
                    if (yConfig.from && typeof yConfig.from === 'string') {
                        yConfig.from = this.parsePosition(yConfig.from, this.currentHeight);
                    }
                    if (yConfig.to && typeof yConfig.to === 'string') {
                        yConfig.to = this.parsePosition(yConfig.to, this.currentHeight);
                    }
                } else if (typeof processedConfig.y === 'string') {
                    processedConfig.y = this.parsePosition(processedConfig.y as string, this.currentHeight);
                }
            }
            
            this.scene.tweens.add({
                ...processedConfig,
                targets: element
            });
        }
    }

    public destroy(): void {
        this.scene.scale.off('resize', this.onResize, this);
        
        this.elements.forEach((element) => {
            element.destroy();
        });
        
        this.elements.clear();
    }

    public getScale(): number {
        return this.currentScale;
    }

    public getScreenSize(): { width: number; height: number } {
        return {
            width: this.currentWidth,
            height: this.currentHeight
        };
    }

    public getAspectRatio(): number {
        return this.currentWidth / this.currentHeight;
    }
}