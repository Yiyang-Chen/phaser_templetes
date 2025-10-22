/**
 * URL缓存破坏工具
 * 用于在资源URL后添加时间戳参数，防止浏览器缓存
 */

/**
 * 在URL后添加时间戳参数来破坏缓存
 * 
 * @param url - 原始资源URL
 * @returns 添加了时间戳参数的URL
 * 
 * @example
 * addCacheBuster('assets/tilemap.json') 
 * // => 'assets/tilemap.json?t=1698012345678'
 * 
 * addCacheBuster('assets/tilemap.json?param=value')
 * // => 'assets/tilemap.json?param=value&t=1698012345678'
 */
export function addCacheBuster(url: string): string {
    const timestamp = Date.now();
    const separator = url.includes('?') ? '&' : '?';
    console.log(`📋 CacheBusting: ${url} 添加时间戳 ${timestamp}`);
    return `${url}${separator}t=${timestamp}`;
}

