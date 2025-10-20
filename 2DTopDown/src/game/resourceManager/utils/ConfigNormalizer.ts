/**
 * 配置标准化工具
 * 用于处理远程JSON配置中的数据类型转换问题
 * 将所有符合条件的字符串数字转换为实际的数字类型
 */

/**
 * 检查字符串是否为有效的数字
 */
function isValidNumericString(value: string): boolean {
    // 检查是否为纯数字字符串（包括负数和小数）
    const numericPattern = /^-?\d+(\.\d+)?$/;
    return numericPattern.test(value.trim());
}

/**
 * 安全地将字符串转换为数字
 */
function safeStringToNumber(value: string): number {
    const trimmed = value.trim();
    
    // 检查是否包含小数点
    if (trimmed.includes('.')) {
        return parseFloat(trimmed);
    } else {
        return parseInt(trimmed, 10);
    }
}

/**
 * 递归地标准化对象中的所有字符串数字
 */
function normalizeAllNumbers(obj: any, path: string = ''): any {
    if (obj === null || obj === undefined) {
        return obj;
    }
    
    // 处理数组
    if (Array.isArray(obj)) {
        return obj.map((item, index) => 
            normalizeAllNumbers(item, `${path}[${index}]`)
        );
    }
    
    // 处理对象
    if (typeof obj === 'object') {
        const normalized: any = {};
        
        for (const [key, value] of Object.entries(obj)) {
            const currentPath = path ? `${path}.${key}` : key;
            
            // 检查是否为字符串且应该转换为数字
            if (typeof value === 'string' && isValidNumericString(value)) {
                const numericValue = safeStringToNumber(value);
                console.log(`[ConfigNormalizer] 转换 ${currentPath}: "${value}" (string) -> ${numericValue} (${typeof numericValue})`);
                normalized[key] = numericValue;
            } else {
                // 递归处理嵌套对象
                normalized[key] = normalizeAllNumbers(value, currentPath);
            }
        }
        
        return normalized;
    }
    
    // 其他类型直接返回
    return obj;
}

/**
 * 标准化配置
 * 将配置中所有符合条件的字符串数字转换为实际数字
 */
export function normalizeConfig(config: any): any {
    console.log('[ConfigNormalizer] 开始标准化配置，转换所有字符串数字...');
    
    const normalized = normalizeAllNumbers(config);
    
    console.log('[ConfigNormalizer] 配置标准化完成');
    return normalized;
}
