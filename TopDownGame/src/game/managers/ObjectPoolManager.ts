/**
 * 对象池管理器 - 用于管理可重用对象以提高性能
 * Object Pool Manager for performance optimization
 */

interface PoolableObject {
    active: boolean;
    setActive(value: boolean): this;
    setVisible(value: boolean): this;
    reset?(x: number, y: number, ...args: any[]): void;
    destroy?(): void;
}

export class ObjectPoolManager {
    private static instance: ObjectPoolManager;
    private pools: Map<string, PoolableObject[]> = new Map();
    private maxPoolSizes: Map<string, number> = new Map();
    
    private constructor() {}
    
    static getInstance(): ObjectPoolManager {
        if (!ObjectPoolManager.instance) {
            ObjectPoolManager.instance = new ObjectPoolManager();
        }
        return ObjectPoolManager.instance;
    }
    
    /**
     * 设置池的最大尺寸
     */
    setMaxPoolSize(poolKey: string, maxSize: number): void {
        this.maxPoolSizes.set(poolKey, maxSize);
    }
    
    /**
     * 从池中获取对象
     */
    getFromPool<T extends PoolableObject>(
        poolKey: string, 
        factory: () => T
    ): T {
        if (!this.pools.has(poolKey)) {
            this.pools.set(poolKey, []);
        }
        
        const pool = this.pools.get(poolKey)!;
        
        // 尝试从池中获取非活跃对象
        for (const obj of pool) {
            if (!obj.active) {
                obj.setActive(true).setVisible(true);
                return obj as T;
            }
        }
        
        // 如果池中没有可用对象，创建新的
        const newObj = factory();
        pool.push(newObj);
        return newObj;
    }
    
    /**
     * 将对象返回到池中
     */
    returnToPool(poolKey: string, obj: PoolableObject): void {
        if (!this.pools.has(poolKey)) {
            return;
        }
        
        const pool = this.pools.get(poolKey)!;
        const maxSize = this.maxPoolSizes.get(poolKey) || 50;
        
        // 如果池已满，真正销毁对象
        if (pool.length >= maxSize) {
            const index = pool.indexOf(obj);
            if (index !== -1) {
                pool.splice(index, 1);
                if (obj.destroy) {
                    obj.destroy();
                }
            }
            return;
        }
        
        // 重置对象状态
        obj.setActive(false).setVisible(false);
        
        // 如果对象不在池中，添加到池中
        if (!pool.includes(obj)) {
            pool.push(obj);
        }
    }
    
    /**
     * 清空指定池
     */
    clearPool(poolKey: string): void {
        const pool = this.pools.get(poolKey);
        if (pool) {
            pool.forEach(obj => {
                if (obj.destroy) {
                    obj.destroy();
                }
            });
            pool.length = 0;
        }
    }
    
    /**
     * 清空所有池
     */
    clearAllPools(): void {
        for (const [key] of this.pools) {
            this.clearPool(key);
        }
        this.pools.clear();
        this.maxPoolSizes.clear();
    }
    
    /**
     * 获取池的状态信息
     */
    getPoolInfo(poolKey: string): { total: number; active: number; inactive: number } {
        const pool = this.pools.get(poolKey);
        if (!pool) {
            return { total: 0, active: 0, inactive: 0 };
        }
        
        const active = pool.filter(obj => obj.active).length;
        const inactive = pool.length - active;
        
        return {
            total: pool.length,
            active,
            inactive
        };
    }
    
    /**
     * 获取所有池的状态信息
     */
    getAllPoolInfo(): Record<string, { total: number; active: number; inactive: number }> {
        const info: Record<string, { total: number; active: number; inactive: number }> = {};
        
        for (const [key] of this.pools) {
            info[key] = this.getPoolInfo(key);
        }
        
        return info;
    }
}
