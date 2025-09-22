import { GlobalResourceManager } from '../GlobalResourceManager';

/**
 * 自定义Tilemap文件类型
 * 继承自Phaser.Loader.File，实现自定义的tilemap加载逻辑
 */
export class CustomTilemapFile extends Phaser.Loader.File {
    constructor(loader: Phaser.Loader.LoaderPlugin, key: string, url: string) {
        const fileConfig = {
            type: 'customTilemap',
            cache: loader.scene.cache.json,  // 存储解析后的配置到JSON cache
            extension: 'json',
            responseType: 'text' as XMLHttpRequestResponseType,
            key: key,
            url: url
        };

        super(loader, fileConfig);
    }

    /**
     * 处理加载完成的数据
     * 这个方法会在文件下载完成后被Phaser自动调用
     */
    onProcess(): void {
        console.log(`🗺️ CustomTilemap: 开始处理 ${this.key}`);
        
        try {
            // 解析tilemap JSON
            const tilemapData = JSON.parse(this.xhrLoader?.responseText || '{}');
            
            // 首先加载tilemap本身到Phaser的tilemap cache
            this.loader.scene.cache.tilemap.add(this.key, { 
                format: Phaser.Tilemaps.Formats.TILED_JSON, 
                data: tilemapData 
            });
            
            // 处理tileset资源
            this.processTilesets(tilemapData);
            
            // 存储原始数据供后续使用
            this.data = tilemapData;
            
            console.log(`✅ CustomTilemap: 处理完成 ${this.key}`);
            // 标记为完成 - 这会自动触发 filecomplete-customTilemap-{key} 事件！
            this.onProcessComplete();
            
        } catch (error) {
            console.error(`❌ CustomTilemap: 处理失败 ${this.key}`, error);
            this.onProcessError();
        }
    }

    /**
     * 处理tilemap中的tilesets，自动加载相关资源
     */
    private processTilesets(tilemapData: any): void {
        const tilesets = tilemapData.tilesets;
        if (!tilesets || !Array.isArray(tilesets)) {
            console.log(`📋 CustomTilemap: ${this.key} 没有找到tilesets`);
            return;
        }

        console.log(`📋 CustomTilemap: 处理 ${tilesets.length} 个tilesets`);
        const resourceManager = GlobalResourceManager.getInstance();

        tilesets.forEach((tileset: any) => {
            const isAtlas = this.checkIfAtlas(tileset);
            const imageKey = tileset.image; // 现在这是一个key而不是路径
            const name = tileset.name;

            if (!imageKey || !name) {
                console.warn(`⚠️ CustomTilemap: tileset缺少必要信息`, tileset);
                return;
            }

            // 从全局资源管理器获取实际路径
            const actualImagePath = resourceManager.getResourcePath(imageKey);
            if (!actualImagePath) {
                console.error(`❌ CustomTilemap: 无法找到资源key对应的路径: ${imageKey}`);
                return;
            }

            if (isAtlas) {
                console.log(`🎭 CustomTilemap: 加载图集 ${name} (${imageKey} -> ${actualImagePath})`);
                // 加载图集和相关文件
                const atlasJsonKey = imageKey.replace('_image', '_json');
                const animationConfigKey = imageKey.replace('_image', '_animators');
                
                const atlasJsonPath = resourceManager.getResourcePath(atlasJsonKey);
                const animationConfigPath = resourceManager.getResourcePath(animationConfigKey);
                
                if (atlasJsonPath) {
                    this.loader.atlas(name, actualImagePath, atlasJsonPath);
                }
                if (animationConfigPath) {
                    this.loader.json(`${name}_animators`, animationConfigPath);
                }
            } else {
                console.log(`🖼️ CustomTilemap: 加载图片 ${name} (${imageKey} -> ${actualImagePath})`);
                this.loader.image(name, actualImagePath);
            }
        });
    }

    /**
     * 检查tileset是否为图集类型
     */
    private checkIfAtlas(tileset: any): boolean {
        const tiles = tileset.tiles;
        if (!tiles || !Array.isArray(tiles) || tiles.length === 0) return false;

        const properties = tiles[0].properties;
        if (!properties || !Array.isArray(properties)) return false;

        return properties.some((prop: any) => 
            prop.name === "atlas" && prop.value === true
        );
    }
}
