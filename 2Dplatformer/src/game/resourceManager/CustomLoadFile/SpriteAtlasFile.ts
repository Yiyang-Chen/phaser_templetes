/**
 * 精灵图集文件类型
 * 继承自Phaser.Loader.File，实现自定义的精灵图集加载逻辑
 */
export class SpriteAtlasFile extends Phaser.Loader.File {
    private imageUrl: string;

    constructor(loader: Phaser.Loader.LoaderPlugin, key: string, imageUrl: string) {
        // 这个文件类型主要用于触发加载流程，实际不下载文件
        const fileConfig = {
            type: 'spriteAtlas',
            cache: loader.scene.cache.json,
            extension: 'json',
            responseType: 'text' as XMLHttpRequestResponseType,
            key: key,
            url: imageUrl // 使用图片URL作为标识
        };

        super(loader, fileConfig);
        this.imageUrl = imageUrl;
    }

    /**
     * 处理精灵图集加载
     * 自动加载图片、图集配置和动画配置文件
     */
    onProcess(): void {
        console.log(`🎭 SpriteAtlas: 开始处理精灵图集 ${this.key}`);
        
        try {
            // 生成相关文件路径
            const atlasJsonUrl = this.imageUrl.replace(/(\.[^/.]+)$/, '.json');
            const animationConfigUrl = this.imageUrl.replace(/(\.[^/.]+)$/, '_animators.json');
            
            console.log(`🖼️ SpriteAtlas: 加载图片 - ${this.imageUrl}`);
            console.log(`📋 SpriteAtlas: 加载图集配置 - ${atlasJsonUrl}`);
            console.log(`🎬 SpriteAtlas: 加载动画配置 - ${animationConfigUrl}`);
            
            // 加载图集（图片 + JSON配置）
            this.loader.atlas(this.key, this.imageUrl, atlasJsonUrl);
            
            // 加载动画配置
            this.loader.json(`${this.key}_animators`, animationConfigUrl);
            
            // 存储配置信息
            this.data = {
                key: this.key,
                imageUrl: this.imageUrl,
                atlasUrl: atlasJsonUrl,
                animationUrl: animationConfigUrl,
                timestamp: Date.now()
            };
            
            console.log(`✅ SpriteAtlas: 精灵图集处理完成 ${this.key}`);
            // 标记为完成 - 这会自动触发 filecomplete-spriteAtlas-{key} 事件！
            this.onProcessComplete();
            
        } catch (error) {
            console.error(`❌ SpriteAtlas: 精灵图集处理失败 ${this.key}`, error);
            this.onProcessError();
        }
    }

    /**
     * 重写load方法，因为我们不需要实际下载文件
     * 这个文件类型主要用于组织和触发其他资源的加载
     */
    load(): void {
        // 直接进入处理阶段
        this.onProcess();
    }
}
