/**
 * 全局资源管理器
 * 管理游戏配置中的资源字典，提供统一的资源访问接口
 */

// 资源配置接口
interface ResourceConfig {
    local?: {
        key: string;
        resource_type: string;
        path?: string;
        public_path?: string;
    };
    remote?: {
        key: string;
        resource_type: string;
        url: string;
    };
}

interface AssetConfig {
    type: string;
    id: number;
    name: string;
    resources: ResourceConfig[];
}

interface SceneConfig {
    key: number;
    name: string;
    description: string;
    resources: ResourceConfig[];
}

interface GameConfig {
    assets: AssetConfig[];
    scenes: SceneConfig[];
}

/**
 * 全局资源管理器
 * 提供统一的资源访问接口
 */
export class GlobalResourceManager {
    private static instance: GlobalResourceManager;
    private assetsDict: Map<number, AssetConfig> = new Map();
    private scenesDict: Map<number, SceneConfig> = new Map();
    private resourceKeyMap: Map<string, ResourceConfig> = new Map();

    static getInstance(): GlobalResourceManager {
        if (!GlobalResourceManager.instance) {
            GlobalResourceManager.instance = new GlobalResourceManager();
        }
        return GlobalResourceManager.instance;
    }

    /**
     * 初始化资源字典
     */
    initializeFromConfig(config: GameConfig): void {
        console.log('[GlobalResourceManager] 初始化资源字典...');
        
        // 清空现有字典
        this.assetsDict.clear();
        this.scenesDict.clear();
        this.resourceKeyMap.clear();

        // 构建assets字典 (id作为key)
        config.assets.forEach(asset => {
            this.assetsDict.set(asset.id, asset);
            
            // 同时构建资源key映射表，方便快速查找
            asset.resources.forEach(resource => {
                if (resource.local) {
                    this.resourceKeyMap.set(resource.local.key, resource);
                }
                if (resource.remote) {
                    this.resourceKeyMap.set(resource.remote.key, resource);
                }
            });
        });

        // 构建scenes字典 (key作为key)
        config.scenes.forEach(scene => {
            this.scenesDict.set(scene.key, scene);
            
            // 同时构建资源key映射表
            scene.resources.forEach(resource => {
                if (resource.local) {
                    this.resourceKeyMap.set(resource.local.key, resource);
                }
                if (resource.remote) {
                    this.resourceKeyMap.set(resource.remote.key, resource);
                }
            });
        });

        console.log(`[GlobalResourceManager] 资源字典初始化完成: ${this.assetsDict.size} assets, ${this.scenesDict.size} scenes`);
    }

    /**
     * 根据资源key获取实际的加载路径
     * 优先返回远程资源路径
     */
    getResourcePath(key: string): string | null {
        const resource = this.resourceKeyMap.get(key);
        if (!resource) {
            console.warn(`[GlobalResourceManager] 未找到资源key: ${key}`);
            return null;
        }

        // 优先使用远程资源
        if (resource.remote) {
            console.log(`[GlobalResourceManager] 优先使用远程资源: ${key} -> ${resource.remote.url}`);
            return resource.remote.url;
        }

        // 备用本地资源
        if (resource.local) {
            console.log(`[GlobalResourceManager] 使用本地资源: ${key} -> ${resource.local.public_path || resource.local.path}`);
            return resource.local.public_path || resource.local.path || '';
        }

        return null;
    }

    /**
     * 获取资源配置
     */
    getResource(key: string): ResourceConfig | null {
        return this.resourceKeyMap.get(key) || null;
    }

    /**
     * 根据ID获取asset配置
     */
    getAsset(id: number): AssetConfig | null {
        return this.assetsDict.get(id) || null;
    }

    /**
     * 根据key获取scene配置
     */
    getScene(key: number): SceneConfig | null {
        return this.scenesDict.get(key) || null;
    }

    /**
     * 获取所有assets
     */
    getAllAssets(): AssetConfig[] {
        return Array.from(this.assetsDict.values());
    }

    /**
     * 获取所有scenes
     */
    getAllScenes(): SceneConfig[] {
        return Array.from(this.scenesDict.values());
    }
}

// 导出类型定义供其他模块使用
export type { ResourceConfig, AssetConfig, SceneConfig, GameConfig };
