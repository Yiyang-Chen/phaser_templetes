import { Scene } from 'phaser';

/**
 * 资源验证和管理器
 * 用于验证资源完整性，避免运行时错误
 */
export class ResourceValidator {
    private scene: Scene;
    private static instance: ResourceValidator;
    
    // 资源类型定义
    public static readonly RESOURCE_TYPES = {
        IMAGE: 'image',
        ATLAS: 'atlas',
        SPRITESHEET: 'spritesheet',
        AUDIO: 'audio',
        JSON: 'json'
    } as const;
    
    // 预期的资源配置
    private expectedResources: Map<string, ResourceConfig> = new Map();
    
    constructor(scene: Scene) {
        this.scene = scene;
    }
    
    public static getInstance(scene?: Scene): ResourceValidator {
        if (!ResourceValidator.instance && scene) {
            ResourceValidator.instance = new ResourceValidator(scene);
        }
        return ResourceValidator.instance;
    }
    
    /**
     * 注册预期的资源配置
     */
    public registerExpectedResource(name: string, config: ResourceConfig): void {
        this.expectedResources.set(name, config);
    }
    
    /**
     * 批量注册游戏资源
     */
    public registerGameResources(): void {
        // 玩家资源
        this.registerExpectedResource('knight', {
            type: ResourceValidator.RESOURCE_TYPES.ATLAS,
            paths: ['assets/player/knight.png', 'assets/player/knight.json'],
            required: true,
            fallback: null
        });
        
        // 危险物体资源
        this.registerExpectedResource('spikes', {
            type: ResourceValidator.RESOURCE_TYPES.IMAGE,
            paths: ['assets/hazards/spikes.png'],
            required: true,
            fallback: null
        });
        
        // UI资源
        this.registerExpectedResource('logo', {
            type: ResourceValidator.RESOURCE_TYPES.IMAGE,
            paths: ['assets/logo.png'],
            required: false,
            fallback: 'background'
        });
        
        this.registerExpectedResource('crosshair', {
            type: ResourceValidator.RESOURCE_TYPES.IMAGE,
            paths: ['assets/crosshair_1.png'],
            required: true,
            fallback: null
        });
        
        // 敌人资源
        this.registerExpectedResource('flying_creature', {
            type: ResourceValidator.RESOURCE_TYPES.ATLAS,
            paths: ['assets/enemy/fly.png', 'assets/enemy/fly.json'],
            required: true,
            fallback: null
        });
        
        this.registerExpectedResource('goblin', {
            type: ResourceValidator.RESOURCE_TYPES.ATLAS,
            paths: ['assets/enemy/goblin.png', 'assets/enemy/goblin.json'],
            required: true,
            fallback: null
        });
        
        this.registerExpectedResource('slime', {
            type: ResourceValidator.RESOURCE_TYPES.ATLAS,
            paths: ['assets/enemy/slime.png', 'assets/enemy/slime.json'],
            required: true,
            fallback: null
        });
    }
    
    /**
     * 验证单个资源是否正确加载
     */
    public validateResource(name: string): ResourceValidationResult {
        const config = this.expectedResources.get(name);
        if (!config) {
            return {
                name,
                valid: true,
                message: `Resource '${name}' not registered for validation`,
                severity: 'info'
            };
        }
        
        // 检查资源是否存在于缓存中
        const exists = this.checkResourceExists(name, config.type);
        
        if (!exists) {
            if (config.required) {
                return {
                    name,
                    valid: false,
                    message: `Required resource '${name}' not found`,
                    severity: 'error',
                    config
                };
            } else {
                return {
                    name,
                    valid: true,
                    message: `Optional resource '${name}' not found, will use fallback`,
                    severity: 'warning',
                    config
                };
            }
        }
        
        return {
            name,
            valid: true,
            message: `Resource '${name}' loaded successfully`,
            severity: 'info',
            config
        };
    }
    
    /**
     * 验证所有注册的资源
     */
    public validateAllResources(): ResourceValidationReport {
        const results: ResourceValidationResult[] = [];
        const errors: string[] = [];
        const warnings: string[] = [];
        
        for (const [name] of this.expectedResources) {
            const result = this.validateResource(name);
            results.push(result);
            
            if (result.severity === 'error') {
                errors.push(result.message);
            } else if (result.severity === 'warning') {
                warnings.push(result.message);
            }
        }
        
        return {
            results,
            errors,
            warnings,
            hasErrors: errors.length > 0,
            hasWarnings: warnings.length > 0
        };
    }
    
    /**
     * 检查资源是否存在
     */
    private checkResourceExists(name: string, type: string): boolean {
        switch (type) {
            case ResourceValidator.RESOURCE_TYPES.IMAGE:
            case ResourceValidator.RESOURCE_TYPES.ATLAS:
                return this.scene.textures.exists(name);
            case ResourceValidator.RESOURCE_TYPES.AUDIO:
                return this.scene.cache.audio.exists(name);
            case ResourceValidator.RESOURCE_TYPES.JSON:
                return this.scene.cache.json.exists(name);
            default:
                return false;
        }
    }
    
    /**
     * 应用fallback资源
     */
    public applyFallbacks(): void {
        for (const [name, config] of this.expectedResources) {
            if (!this.checkResourceExists(name, config.type) && config.fallback) {
                console.log(`[ResourceValidator] Applying fallback for '${name}' -> '${config.fallback}'`);
                // 这里可以实现具体的fallback逻辑
                // 例如：复制纹理、设置别名等
            }
        }
    }
    
    /**
     * 安全的资源加载方法
     */
    public safeLoadResource(loader: Phaser.Loader.LoaderPlugin, name: string): boolean {
        const config = this.expectedResources.get(name);
        if (!config) {
            console.warn(`[ResourceValidator] No config found for resource: ${name}`);
            return false;
        }
        
        try {
            switch (config.type) {
                case ResourceValidator.RESOURCE_TYPES.IMAGE:
                    loader.image(name, config.paths[0]);
                    break;
                case ResourceValidator.RESOURCE_TYPES.ATLAS:
                    if (config.paths.length >= 2) {
                        loader.atlas(name, config.paths[0], config.paths[1]);
                    } else {
                        console.error(`[ResourceValidator] Atlas '${name}' requires 2 paths`);
                        return false;
                    }
                    break;
                case ResourceValidator.RESOURCE_TYPES.SPRITESHEET:
                    // 需要额外的frameConfig
                    console.warn(`[ResourceValidator] Spritesheet loading needs frameConfig`);
                    return false;
                default:
                    console.error(`[ResourceValidator] Unsupported resource type: ${config.type}`);
                    return false;
            }
            
            console.log(`[ResourceValidator] Safely loaded: ${name} (${config.type})`);
            return true;
        } catch (error) {
            console.error(`[ResourceValidator] Failed to load ${name}:`, error);
            return false;
        }
    }
}

// 类型定义
export interface ResourceConfig {
    type: string;
    paths: string[];
    required: boolean;
    fallback: string | null;
    frameConfig?: any; // for spritesheets
}

export interface ResourceValidationResult {
    name: string;
    valid: boolean;
    message: string;
    severity: 'info' | 'warning' | 'error';
    config?: ResourceConfig;
}

export interface ResourceValidationReport {
    results: ResourceValidationResult[];
    errors: string[];
    warnings: string[];
    hasErrors: boolean;
    hasWarnings: boolean;
}
