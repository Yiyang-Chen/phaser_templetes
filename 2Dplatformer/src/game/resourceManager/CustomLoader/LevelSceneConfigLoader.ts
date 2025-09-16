import { Loader } from 'phaser';
import { GlobalResourceManager, SceneConfig } from '../GlobalResourceManager';

/**
 * 关卡场景配置加载器
 * 根据关卡编号从 game_config.json 中的 scenes 配置加载对应的关卡资源
 */

// 默认关卡配置
const DEFAULT_LEVEL_NUMBER = 1;

/**
 * 获取默认关卡编号
 */
export function getDefaultLevelNumber(): number {
    return DEFAULT_LEVEL_NUMBER;
}

/**
 * 注册关卡场景配置加载器到Phaser
 */
export function registerLevelSceneConfigLoader(): void {
    // 扩展Loader类型定义
    Loader.LoaderPlugin.prototype.levelSceneConfig = function(key: string, levelNumber: number) {
        console.log(`[LevelSceneConfigLoader] 开始加载关卡 ${levelNumber} 的场景配置...`);
        
        // 获取全局资源管理器
        const resourceManager = GlobalResourceManager.getInstance();
        
        // 根据关卡编号获取场景配置
        const sceneConfig = resourceManager.getScene(levelNumber);
        
        if (!sceneConfig) {
            console.error(`[LevelSceneConfigLoader] 未找到关卡 ${levelNumber} 的场景配置`);
            // 如果没有找到指定关卡，尝试加载默认关卡
            const defaultLevelNumber = getDefaultLevelNumber();
            const defaultSceneConfig = resourceManager.getScene(defaultLevelNumber);
            if (defaultSceneConfig) {
                console.log(`[LevelSceneConfigLoader] 使用默认关卡配置 (关卡${defaultLevelNumber})`);
                this.loadSceneResources(key, defaultSceneConfig);
            } else {
                console.error(`[LevelSceneConfigLoader] 连默认关卡配置都未找到 (关卡${defaultLevelNumber})`);
            }
            return this;
        }
        
        console.log(`[LevelSceneConfigLoader] 找到关卡 ${levelNumber} 配置: ${sceneConfig.name}`);
        this.loadSceneResources(key, sceneConfig);
        
        return this;
    };
    
    // 添加加载场景资源的辅助方法
    Loader.LoaderPlugin.prototype.loadSceneResources = function(_key: string, sceneConfig: SceneConfig) {
        console.log(`[LevelSceneConfigLoader] 加载场景 "${sceneConfig.name}" 的资源...`);
        
        // 分离远程资源和本地资源，优先加载远程资源
        const remoteResources = sceneConfig.resources.filter(resource => resource.remote);
        const localResources = sceneConfig.resources.filter(resource => resource.local);
        
        console.log(`[LevelSceneConfigLoader] 发现 ${remoteResources.length} 个远程资源，${localResources.length} 个本地资源`);
        
        // 优先加载所有远程资源
        remoteResources.forEach((resource) => {
            if (resource.remote) {
                const resourceKey = resource.remote.key;
                const resourceUrl = resource.remote.url;
                const resourceType = resource.remote.resource_type;
                
                console.log(`[LevelSceneConfigLoader] [优先] 加载远程资源: ${resourceKey} (${resourceType}) -> ${resourceUrl}`);
                
                this.loadResourceByType(resourceKey, resourceUrl, resourceType, true);
            }
        });
        
        // 然后加载本地资源
        localResources.forEach((resource) => {
            if (!resource.remote && resource.local) {
                const resourceKey = resource.local.key;
                const resourcePath = resource.local.full_path || resource.local.path || '';
                const resourceType = resource.local.resource_type;
                
                console.log(`[LevelSceneConfigLoader] [备用] 加载本地资源: ${resourceKey} (${resourceType}) -> ${resourcePath}`);
                
                this.loadResourceByType(resourceKey, resourcePath, resourceType, false);
            }
        });
        
        // 监听所有资源加载完成
        this.once('complete', () => {
            console.log(`[LevelSceneConfigLoader] 场景 "${sceneConfig.name}" 的所有资源加载完成`);
        });
    };
    
    // 添加根据资源类型加载资源的辅助方法
    Loader.LoaderPlugin.prototype.loadResourceByType = function(resourceKey: string, resourcePath: string, resourceType: string, isRemote: boolean) {
        const sourceType = isRemote ? '远程' : '本地';
        
        // 根据资源类型调用相应的加载方法
        switch (resourceType) {
            case 'tilemap':
                // 对于 tilemap 资源，统一使用 'tilemap' 作为 key，确保与 Game.ts 中的使用一致
                console.log(`[LevelSceneConfigLoader] 加载${sourceType}tilemap资源: ${resourceKey} -> 'tilemap' (统一key)`);
                this.customTilemap('tilemap', resourcePath);
                break;
            case 'image':
                this.image(resourceKey, resourcePath);
                break;
            case 'json':
                this.json(resourceKey, resourcePath);
                break;
            case 'audio':
                this.audio(resourceKey, resourcePath);
                break;
            default:
                console.warn(`[LevelSceneConfigLoader] 未知的${sourceType}资源类型: ${resourceType}`);
                break;
        }
    };

    console.log('✅ LevelSceneConfigLoader 注册完成');
}

// 扩展Phaser类型定义
declare module 'phaser' {
    namespace Loader {
        interface LoaderPlugin {
            levelSceneConfig(key: string, levelNumber: number): LoaderPlugin;
            loadSceneResources(key: string, sceneConfig: any): void;
            loadResourceByType(resourceKey: string, resourcePath: string, resourceType: string, isRemote: boolean): void;
        }
    }
}
