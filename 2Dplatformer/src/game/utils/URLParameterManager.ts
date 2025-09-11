/**
 * URL参数管理器
 * 用于处理游戏启动时的URL参数
 */
export class URLParameterManager {
    private static instance: URLParameterManager;
    private parameters: Map<string, string> = new Map();

    private constructor() {
        this.parseURLParameters();
    }

    public static getInstance(): URLParameterManager {
        if (!URLParameterManager.instance) {
            URLParameterManager.instance = new URLParameterManager();
        }
        return URLParameterManager.instance;
    }

    /**
     * 解析URL参数
     */
    private parseURLParameters(): void {
        const urlParams = new URLSearchParams(window.location.search);
        
        // 解析所有URL参数
        for (const [key, value] of urlParams.entries()) {
            this.parameters.set(key.toLowerCase(), value);
        }

        // 输出解析到的参数（开发调试用）
        if (this.parameters.size > 0) {
            console.log('🎮 检测到URL参数:', Object.fromEntries(this.parameters));
        }
    }

    /**
     * 获取字符串参数
     */
    public getString(key: string, defaultValue: string = ''): string {
        return this.parameters.get(key.toLowerCase()) || defaultValue;
    }

    /**
     * 获取数字参数
     */
    public getNumber(key: string, defaultValue: number = 0): number {
        const value = this.parameters.get(key.toLowerCase());
        const parsed = parseFloat(value || '');
        return isNaN(parsed) ? defaultValue : parsed;
    }

    /**
     * 获取布尔参数
     */
    public getBoolean(key: string, defaultValue: boolean = false): boolean {
        const value = this.parameters.get(key.toLowerCase());
        if (!value) return defaultValue;
        
        return value.toLowerCase() === 'true' || value === '1' || value.toLowerCase() === 'yes';
    }

    /**
     * 检查参数是否存在
     */
    public has(key: string): boolean {
        return this.parameters.has(key.toLowerCase());
    }

    /**
     * 获取所有参数
     */
    public getAll(): Record<string, string> {
        return Object.fromEntries(this.parameters);
    }

    /**
     * 设置参数（用于动态修改）
     */
    public set(key: string, value: string): void {
        this.parameters.set(key.toLowerCase(), value);
    }

    /**
     * 更新URL（不刷新页面）
     */
    public updateURL(): void {
        const url = new URL(window.location.href);
        url.search = '';
        
        for (const [key, value] of this.parameters.entries()) {
            url.searchParams.set(key, value);
        }
        
        window.history.replaceState({}, '', url.toString());
    }
}

// 预定义的常用参数键
export const URL_PARAMS = {
    // 游戏设置
    DEBUG: 'debug',
    FULLSCREEN: 'fullscreen',
    SOUND: 'sound',
    MUSIC: 'music',
    
    // 游戏状态
    LEVEL: 'level',
    DIFFICULTY: 'difficulty',
    PLAYER_NAME: 'player',
    
    // 显示设置
    SCALE: 'scale',
    QUALITY: 'quality',
    
    // 开发工具
    SKIP_INTRO: 'skip_intro',
    GOD_MODE: 'god_mode',
    UNLIMITED_LIVES: 'unlimited_lives'
} as const;
