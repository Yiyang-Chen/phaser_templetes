import { Scene } from 'phaser';

/**
 * 安全工具类 - 提供各种防御性编程工具
 */
export class SafetyUtils {
    
    /**
     * 安全的动画播放
     */
    public static safePlayAnimation(
        sprite: Phaser.GameObjects.Sprite, 
        animKey: string, 
        scene: Scene,
        fallbackKey?: string
    ): boolean {
        // 检查基础条件
        if (!sprite || !scene || !scene.anims) {
            console.warn('[SafetyUtils] Invalid sprite or scene for animation');
            return false;
        }
        
        // 检查动画是否存在
        if (!scene.anims.exists(animKey)) {
            console.warn(`[SafetyUtils] Animation '${animKey}' not found`);
            
            // 尝试fallback动画
            if (fallbackKey && scene.anims.exists(fallbackKey)) {
                console.log(`[SafetyUtils] Using fallback animation: ${fallbackKey}`);
                try {
                    sprite.play(fallbackKey);
                    return true;
                } catch (error) {
                    console.error(`[SafetyUtils] Error playing fallback animation:`, error);
                    return false;
                }
            }
            return false;
        }
        
        // 播放动画
        try {
            sprite.play(animKey);
            return true;
        } catch (error) {
            console.error(`[SafetyUtils] Error playing animation '${animKey}':`, error);
            return false;
        }
    }
    
    /**
     * 安全的纹理检查和设置
     */
    public static safeSetTexture(
        sprite: Phaser.GameObjects.Sprite,
        textureKey: string,
        scene: Scene,
        fallbackKey?: string
    ): boolean {
        if (!sprite || !scene || !scene.textures) {
            console.warn('[SafetyUtils] Invalid sprite or scene for texture');
            return false;
        }
        
        // 检查纹理是否存在
        if (!scene.textures.exists(textureKey)) {
            console.warn(`[SafetyUtils] Texture '${textureKey}' not found`);
            
            // 尝试fallback纹理
            if (fallbackKey && scene.textures.exists(fallbackKey)) {
                console.log(`[SafetyUtils] Using fallback texture: ${fallbackKey}`);
                try {
                    sprite.setTexture(fallbackKey);
                    return true;
                } catch (error) {
                    console.error(`[SafetyUtils] Error setting fallback texture:`, error);
                    return false;
                }
            }
            return false;
        }
        
        // 设置纹理
        try {
            sprite.setTexture(textureKey);
            return true;
        } catch (error) {
            console.error(`[SafetyUtils] Error setting texture '${textureKey}':`, error);
            return false;
        }
    }
    
    /**
     * 安全的tileset添加
     */
    public static safeAddTileset(
        map: Phaser.Tilemaps.Tilemap,
        name: string,
        textureKey: string,
        scene: Scene
    ): Phaser.Tilemaps.Tileset | null {
        if (!map || !scene || !scene.textures) {
            console.warn('[SafetyUtils] Invalid map or scene for tileset');
            return null;
        }
        
        // 检查纹理是否存在
        if (!scene.textures.exists(textureKey)) {
            console.warn(`[SafetyUtils] Tileset texture '${textureKey}' not found, skipping`);
            return null;
        }
        
        try {
            const tileset = map.addTilesetImage(name, textureKey);
            if (tileset) {
                console.log(`[SafetyUtils] Successfully added tileset: ${name}`);
                return tileset;
            } else {
                console.warn(`[SafetyUtils] Failed to add tileset: ${name}`);
                return null;
            }
        } catch (error) {
            console.error(`[SafetyUtils] Error adding tileset '${name}':`, error);
            return null;
        }
    }
    
    /**
     * 延迟执行，确保条件满足后再执行
     */
    public static delayedExecution(
        scene: Scene,
        condition: () => boolean,
        action: () => void,
        maxAttempts: number = 10,
        interval: number = 100
    ): void {
        let attempts = 0;
        
        const checkAndExecute = () => {
            attempts++;
            
            if (condition()) {
                action();
                return;
            }
            
            if (attempts >= maxAttempts) {
                console.warn(`[SafetyUtils] Max attempts (${maxAttempts}) reached for delayed execution`);
                return;
            }
            
            // 继续等待
            scene.time.delayedCall(interval, checkAndExecute);
        };
        
        checkAndExecute();
    }
    
    /**
     * 安全的对象池获取
     */
    public static safeGetFromPool<T>(
        pool: any,
        creator: () => T,
        validator?: (item: T) => boolean
    ): T | null {
        try {
            const item = pool ? pool.get() : creator();
            
            if (validator && !validator(item)) {
                console.warn('[SafetyUtils] Pool item failed validation');
                return creator();
            }
            
            return item;
        } catch (error) {
            console.error('[SafetyUtils] Error getting from pool:', error);
            return creator();
        }
    }
    
    /**
     * 安全的配置访问
     */
    public static safeGetConfig<T>(
        configObject: any,
        path: string,
        defaultValue: T
    ): T {
        try {
            const keys = path.split('.');
            let current = configObject;
            
            for (const key of keys) {
                if (current && typeof current === 'object' && key in current) {
                    current = current[key];
                } else {
                    console.warn(`[SafetyUtils] Config path '${path}' not found, using default`);
                    return defaultValue;
                }
            }
            
            return current ?? defaultValue;
        } catch (error) {
            console.error(`[SafetyUtils] Error accessing config path '${path}':`, error);
            return defaultValue;
        }
    }
    
    /**
     * 包装函数，添加错误处理
     */
    public static wrapWithErrorHandling<T extends any[], R>(
        fn: (...args: T) => R,
        context: string,
        fallback?: R
    ): (...args: T) => R {
        return (...args: T): R => {
            try {
                return fn(...args);
            } catch (error) {
                console.error(`[SafetyUtils] Error in ${context}:`, error);
                if (fallback !== undefined) {
                    return fallback;
                }
                throw error;
            }
        };
    }
    
    /**
     * 资源状态监控
     */
    public static monitorResourceStatus(scene: Scene, resources: string[]): void {
        console.log('\n[SafetyUtils] ===== 资源状态监控 =====');
        
        resources.forEach(resource => {
            const exists = scene.textures ? scene.textures.exists(resource) : false;
            const status = exists ? '✅' : '❌';
            console.log(`${status} ${resource}: ${exists ? 'LOADED' : 'MISSING'}`);
        });
        
        console.log('[SafetyUtils] ===== 监控结束 =====\n');
    }
}

/**
 * 错误恢复策略
 */
export class ErrorRecoveryStrategies {
    
    /**
     * 纹理缺失恢复策略
     */
    public static handleMissingTexture(
        scene: Scene,
        missingKey: string,
        fallbackKeys: string[] = ['background']
    ): string | null {
        for (const fallbackKey of fallbackKeys) {
            if (scene.textures && scene.textures.exists(fallbackKey)) {
                console.log(`[ErrorRecovery] Using '${fallbackKey}' as fallback for '${missingKey}'`);
                return fallbackKey;
            }
        }
        
        console.error(`[ErrorRecovery] No fallback found for missing texture: ${missingKey}`);
        return null;
    }
    
    /**
     * 动画缺失恢复策略
     */
    public static handleMissingAnimation(
        scene: Scene,
        missingKey: string,
        fallbackKeys: string[] = ['default_idle']
    ): string | null {
        for (const fallbackKey of fallbackKeys) {
            if (scene.anims && scene.anims.exists(fallbackKey)) {
                console.log(`[ErrorRecovery] Using '${fallbackKey}' as fallback for '${missingKey}'`);
                return fallbackKey;
            }
        }
        
        console.error(`[ErrorRecovery] No fallback found for missing animation: ${missingKey}`);
        return null;
    }
}

/**
 * 开发调试工具
 */
export class DebugUtils {
    
    /**
     * 输出场景资源统计
     */
    public static logSceneResourceStats(scene: Scene): void {
        if (!scene) return;
        
        console.log('\n[DebugUtils] ===== 场景资源统计 =====');
        
        // 纹理统计
        if (scene.textures) {
            const textureKeys = scene.textures.getTextureKeys();
            console.log(`📸 纹理总数: ${textureKeys.length}`);
            console.log('纹理列表:', textureKeys);
        }
        
        // 动画统计
        if (scene.anims) {
            // 使用公共方法获取动画信息
            const animManager = scene.anims as any;
            if (animManager.anims && animManager.anims.entries) {
                const animKeys = Object.keys(animManager.anims.entries);
                console.log(`🎬 动画总数: ${animKeys.length}`);
                console.log('动画列表:', animKeys);
            } else {
                console.log('🎬 动画系统未初始化');
            }
        }
        
        // 音频统计
        if (scene.cache && scene.cache.audio) {
            const audioKeys = scene.cache.audio.getKeys();
            console.log(`🔊 音频总数: ${audioKeys.length}`);
            console.log('音频列表:', audioKeys);
        }
        
        console.log('[DebugUtils] ===== 统计结束 =====\n');
    }
}
