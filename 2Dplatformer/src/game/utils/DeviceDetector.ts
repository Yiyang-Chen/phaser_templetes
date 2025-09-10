/**
 * Utility class for detecting device type and capabilities
 */
export class DeviceDetector {
    /**
     * Check if the current device is mobile
     */
    static isMobile(): boolean {
        // Check for touch capability
        const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        
        // Check user agent for mobile devices
        const userAgent = navigator.userAgent.toLowerCase();
        const mobileKeywords = [
            'android',
            'webos',
            'iphone',
            'ipad',
            'ipod',
            'blackberry',
            'windows phone',
            'mobile',
            'tablet'
        ];
        
        const isMobileUserAgent = mobileKeywords.some(keyword => userAgent.includes(keyword));
        
        // Check screen size (mobile devices typically have smaller screens)
        const isSmallScreen = window.innerWidth <= 768 || window.innerHeight <= 768;
        
        return hasTouch && (isMobileUserAgent || isSmallScreen);
    }
    
    /**
     * Check if the current device is a tablet
     */
    static isTablet(): boolean {
        const userAgent = navigator.userAgent.toLowerCase();
        const isIPad = userAgent.includes('ipad') || 
                      (userAgent.includes('macintosh') && 'ontouchend' in document);
        const isAndroidTablet = userAgent.includes('android') && !userAgent.includes('mobile');
        
        return isIPad || isAndroidTablet;
    }
    
    /**
     * Check if device is iOS
     */
    static isIOS(): boolean {
        const userAgent = navigator.userAgent.toLowerCase();
        return /iphone|ipad|ipod/.test(userAgent) || 
               (userAgent.includes('macintosh') && 'ontouchend' in document);
    }
    
    /**
     * Check if device is Android
     */
    static isAndroid(): boolean {
        return navigator.userAgent.toLowerCase().includes('android');
    }
    
    /**
     * Check if fullscreen is supported
     */
    static isFullscreenSupported(): boolean {
        return !!(document.fullscreenEnabled || 
                 (document as any).webkitFullscreenEnabled || 
                 (document as any).mozFullScreenEnabled || 
                 (document as any).msFullscreenEnabled);
    }
    
    /**
     * Get device orientation
     */
    static getOrientation(): 'portrait' | 'landscape' {
        if (window.innerHeight > window.innerWidth) {
            return 'portrait';
        }
        return 'landscape';
    }
    
    /**
     * Check if device is in standalone mode (installed as PWA)
     */
    static isStandalone(): boolean {
        // iOS
        if ('standalone' in window.navigator) {
            return (window.navigator as any).standalone;
        }
        // Android
        if (window.matchMedia('(display-mode: standalone)').matches) {
            return true;
        }
        return false;
    }
}