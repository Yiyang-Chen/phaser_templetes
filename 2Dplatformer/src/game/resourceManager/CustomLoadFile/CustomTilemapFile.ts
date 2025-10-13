import { GlobalResourceManager } from '../GlobalResourceManager';

/**
 * 自定义Tilemap文件类型
 * 继承自Phaser.Loader.File，实现自定义的tilemap加载逻辑
 */
export class CustomTilemapFile extends Phaser.Loader.File {
    constructor(loader: Phaser.Loader.LoaderPlugin, key: string, url: string) {
        const fileConfig = {
            type: 'customTilemap',
            cache: loader.scene.cache.tilemap,  // 存储解析后的配置到JSON cache
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
            // 自动修复大模型生成的错误格式
            this.fixTilesetFormat(tileset);
            
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
     * 自动修复大模型生成的错误tileset格式
     * 将错误放置在tileset.properties中的属性移动到正确的tiles[0].properties中
     */
    private fixTilesetFormat(tileset: any): void {
        if (!tileset.properties || !Array.isArray(tileset.properties)) {
            return;
        }

        // 需要移动到tiles[0].properties的属性列表
        const propertiesToMove = ['atlas', 'collides'];
        const foundProperties: any[] = [];

        // 查找需要移动的属性
        propertiesToMove.forEach(propName => {
            const property = tileset.properties.find((prop: any) => prop.name === propName);
            if (property) {
                foundProperties.push(property);
            }
        });

        if (foundProperties.length === 0) {
            return;
        }

        console.log(`🔧 CustomTilemap: 检测到错误的属性位置，正在自动修复 - ${tileset.name}`, 
                   foundProperties.map(p => p.name));

        // 确保tiles数组结构存在
        this.ensureTilesStructure(tileset);

        // 移动每个找到的属性
        foundProperties.forEach(property => {
            // 检查是否已经存在正确位置的属性
            const existingProperty = tileset.tiles[0].properties.find((prop: any) => 
                prop.name === property.name
            );

            if (!existingProperty) {
                // 将属性移动到正确位置
                tileset.tiles[0].properties.push({
                    name: property.name,
                    type: property.type,
                    value: property.value
                });
                
                console.log(`✅ CustomTilemap: ${property.name}属性已移动到正确位置 - ${tileset.name}`);
            }
        });

        // 从tileset.properties中移除已移动的属性
        tileset.properties = tileset.properties.filter((prop: any) => 
            !propertiesToMove.includes(prop.name)
        );

        // 如果properties数组为空，删除它
        if (tileset.properties.length === 0) {
            delete tileset.properties;
        }
    }

    /**
     * 确保tileset具有正确的tiles结构
     */
    private ensureTilesStructure(tileset: any): void {
        // 确保tiles数组存在
        if (!tileset.tiles) {
            tileset.tiles = [];
        }
        
        // 确保第一个tile存在
        if (tileset.tiles.length === 0) {
            tileset.tiles.push({ id: 0, properties: [] });
        }
        
        // 确保第一个tile的properties数组存在
        if (!tileset.tiles[0].properties) {
            tileset.tiles[0].properties = [];
        }
    }

    /**
     * 检查tileset是否为图集类型
     * 支持两种格式：
     * 1. 标准格式：tileset.tiles[0].properties 中的 atlas 属性
     * 2. 兼容格式：tileset.properties 中的 atlas 属性（大模型可能生成的错误格式）
     */
    private checkIfAtlas(tileset: any): boolean {
        return this.getTilesetProperty(tileset, 'atlas', false) === true;
    }

    /**
     * 通用方法：获取tileset属性值
     * 支持两种格式：
     * 1. 标准格式：tileset.tiles[0].properties 中的属性
     * 2. 兼容格式：tileset.properties 中的属性（大模型可能生成的错误格式）
     */
    private getTilesetProperty(tileset: any, propertyName: string, defaultValue: any = undefined): any {
        // 方法1：检查 tileset.properties 中的属性（兼容大模型生成的格式）
        if (tileset.properties && Array.isArray(tileset.properties)) {
            const tilesetProperty = tileset.properties.find((prop: any) => 
                prop.name === propertyName
            );
            if (tilesetProperty !== undefined) {
                console.log(`🔧 CustomTilemap: 检测到tileset级别的${propertyName}属性 (兼容模式) - ${tileset.name}: ${tilesetProperty.value}`);
                return tilesetProperty.value;
            }
        }

        // 方法2：检查标准的 tiles[0].properties 中的属性
        const tiles = tileset.tiles;
        if (!tiles || !Array.isArray(tiles) || tiles.length === 0) {
            return defaultValue;
        }

        const properties = tiles[0].properties;
        if (!properties || !Array.isArray(properties)) {
            return defaultValue;
        }

        const tileProperty = properties.find((prop: any) => prop.name === propertyName);
        if (tileProperty !== undefined) {
            console.log(`✅ CustomTilemap: 检测到标准的tiles级别${propertyName}属性 - ${tileset.name}: ${tileProperty.value}`);
            return tileProperty.value;
        }

        return defaultValue;
    }
}
