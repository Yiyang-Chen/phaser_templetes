/**
 * 音频加载工具类
 * 提供多格式音频加载功能，支持URL级别缓存避免重复加载
 */
export class AudioLoader {
    private static urlToKeyMap = new Map<string, string>(); // URL -> 第一个加载的key
    private static keyAliases = new Map<string, string>();  // alias key -> original key
    private static pendingAliases = new Map<string, Array<{ aliasKey: string, scene: Phaser.Scene }>>(); // original key -> pending aliases

    /**
     * 加载多格式音频，让Phaser自动选择支持的格式
     * 支持URL缓存，避免重复加载相同URL的音频
     * @param loader Phaser加载器实例
     * @param key 音频键名
     * @param actualPath 实际音频路径
     */
    static loadMultiFormat(loader: Phaser.Loader.LoaderPlugin, key: string, actualPath: string): void {
        const audioUrls = [
            `${actualPath}&format=.mp3`,
            `${actualPath}&format=.ogg`,
            `${actualPath}&format=.wav`
        ];

        const urlKey = actualPath; // 用实际路径作为缓存key

        // 检查是否已经加载过这个URL
        if (this.urlToKeyMap.has(urlKey)) {
            const originalKey = this.urlToKeyMap.get(urlKey)!;

            // 如果是同一个key，检查是否已在Phaser缓存中
            if (originalKey === key) {
                const scene = loader.scene;
                if (scene.cache.audio.exists(key)) {
                    console.log(`🔄 AudioLoader: 音频已存在于缓存中，跳过 - ${key}`);
                    return;
                } else {
                    console.log(`⚠️ AudioLoader: 音频未在缓存中找到，重新加载 - ${key}`);
                    // 清除之前的记录，重新加载
                    this.urlToKeyMap.delete(urlKey);
                    // 继续执行后面的加载逻辑
                }
            } else {
                // 不同的key，创建别名
                console.log(`🔄 AudioLoader: 复用已加载的音频 ${originalKey} -> ${key}`);

                // 记录别名关系
                this.keyAliases.set(key, originalKey);

                // 在Phaser缓存中也创建别名（如果原始音频已经在缓存中）
                const scene = loader.scene;
                if (scene.cache.audio.exists(originalKey)) {
                    // 获取原始音频数据并用新key存储
                    const audioData = scene.cache.audio.get(originalKey);
                    if (audioData) {
                        scene.cache.audio.add(key, audioData);
                        console.log(`📋 AudioLoader: 在Phaser缓存中创建别名 ${key} -> ${originalKey}`);
                    }
                } else {
                    // 原始音频还在加载中，添加到待处理列表
                    if (!this.pendingAliases.has(originalKey)) {
                        this.pendingAliases.set(originalKey, []);
                    }
                    this.pendingAliases.get(originalKey)!.push({ aliasKey: key, scene });
                    console.log(`⏳ AudioLoader: 等待原始音频加载完成后创建别名 ${key} -> ${originalKey}`);
                }

                return; // 不重复加载
            }
        }

        // 记录这个URL正在被加载
        this.urlToKeyMap.set(urlKey, key);
        console.log(`🎵 AudioLoader: 加载音频 ${key} (${urlKey})`);
        loader.audio(key, audioUrls);
    }

    /**
     * 获取实际的音频key（处理别名）
     * @param key 音频键名（可能是别名）
     * @returns 实际的音频键名
     */
    static getActualKey(key: string): string {
        return this.keyAliases.get(key) || key;
    }

    /**
     * 处理加载完成后的待处理别名
     * @param originalKey 原始音频的key
     * @param scene 场景对象
     */
    static processPendingAliases(originalKey: string, scene: Phaser.Scene): void {
        const pendingList = this.pendingAliases.get(originalKey);
        if (pendingList && scene.cache.audio.exists(originalKey)) {
            const audioData = scene.cache.audio.get(originalKey);
            if (audioData) {
                pendingList.forEach(({ aliasKey }) => {
                    scene.cache.audio.add(aliasKey, audioData);
                    console.log(`✅ AudioLoader: 延迟创建别名 ${aliasKey} -> ${originalKey}`);
                });
                this.pendingAliases.delete(originalKey);
            }
        }
    }

    /**
     * 清理缓存（可选，用于测试或重置）
     */
    static clearCache(): void {
        this.urlToKeyMap.clear();
        this.keyAliases.clear();
        this.pendingAliases.clear();
        console.log('🧹 AudioLoader: 缓存已清理');
    }
}