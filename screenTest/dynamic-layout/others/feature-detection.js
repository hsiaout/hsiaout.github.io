/**
 * 特性檢測與後備方案
 * 避免因為不支援的語法導致網頁掛掉
 */

// 1. 基本特性檢測
const BrowserSupport = {
    // 檢測可選鏈支援
    hasOptionalChaining: () => {
        try {
            const obj = {};
            return obj?.test === undefined;
        } catch {
            return false;
        }
    },

    // 檢測空值合併支援
    hasNullishCoalescing: () => {
        try {
            return (null ?? 'default') === 'default';
        } catch {
            return false;
        }
    },

    // 檢測私有字段支援
    hasPrivateFields: () => {
        try {
            new Function('class Test { #private = 1; }')();
            return true;
        } catch {
            return false;
        }
    },

    // 檢測模組支援
    hasModules: () => {
        const script = document.createElement('script');
        return 'noModule' in script;
    },

    // 檢測 ES6 基本支援
    hasES6: () => {
        try {
            new Function('const a = () => {}; let b = `template`; class C {}')();
            return true;
        } catch {
            return false;
        }
    }
};

// 2. 安全的現代語法包裝器
const SafeModern = {
    // 安全的可選鏈
    optionalAccess: (obj, path) => {
        if (BrowserSupport.hasOptionalChaining()) {
            // 現代瀏覽器直接使用
            return eval(`obj?.${path}`);
        } else {
            // 老舊瀏覽器使用後備方案
            try {
                return path.split('.').reduce((current, prop) => 
                    current && current[prop], obj);
            } catch {
                return undefined;
            }
        }
    },

    // 安全的空值合併
    nullishCoalesce: (value, fallback) => {
        if (BrowserSupport.hasNullishCoalescing()) {
            return eval('value ?? fallback');
        } else {
            return value !== null && value !== undefined ? value : fallback;
        }
    },

    // 安全的模板字面量
    template: (strings, ...values) => {
        if (typeof strings === 'string') {
            // 簡單字串插值後備
            return strings.replace(/\$\{(\w+)\}/g, (match, key) => {
                const index = parseInt(key) || 0;
                return values[index] || match;
            });
        }
        // 原生模板字面量
        return String.raw(strings, ...values);
    }
};

// 3. 瀏覽器兼容性報告
const generateCompatibilityReport = () => {
    const support = {
        ES6基礎: BrowserSupport.hasES6(),
        可選鏈: BrowserSupport.hasOptionalChaining(),
        空值合併: BrowserSupport.hasNullishCoalescing(),
        私有字段: BrowserSupport.hasPrivateFields(),
        模組支援: BrowserSupport.hasModules(),
        瀏覽器: navigator.userAgent
    };

    console.group('🔍 瀏覽器兼容性報告');
    Object.entries(support).forEach(([feature, supported]) => {
        const icon = supported ? '✅' : '❌';
        console.log(`${icon} ${feature}:`, supported);
    });
    console.groupEnd();

    return support;
};

// 4. 優雅降級策略
const GracefulDegradation = {
    // 動態載入 polyfill
    loadPolyfillIfNeeded: async () => {
        const needsPolyfill = !BrowserSupport.hasES6();
        
        if (needsPolyfill) {
            console.warn('⚠️ 檢測到老舊瀏覽器，載入 polyfill...');
            
            // 動態載入 core-js 或其他 polyfill
            const script = document.createElement('script');
            script.src = 'https://polyfill.io/v3/polyfill.min.js';
            document.head.appendChild(script);
            
            return new Promise(resolve => {
                script.onload = resolve;
            });
        }
    },

    // 特性檢測後執行
    withFeatureCheck: (feature, modernCode, fallbackCode) => {
        const hasFeature = BrowserSupport[`has${feature}`];
        
        if (hasFeature && hasFeature()) {
            modernCode();
        } else {
            console.warn(`⚠️ ${feature} 不支援，使用後備方案`);
            fallbackCode();
        }
    }
};

// 5. 使用示例
export const compatibilityDemo = () => {
    // 生成報告
    const report = generateCompatibilityReport();

    // 安全使用現代語法
    const user = { profile: { name: 'John' } };
    
    // 使用安全包裝器而非直接語法
    const name = SafeModern.optionalAccess(user, 'profile.name');
    const displayName = SafeModern.nullishCoalesce(name, 'Anonymous');
    
    console.log('用戶名稱:', displayName);

    // 條件性使用新特性
    GracefulDegradation.withFeatureCheck(
        'OptionalChaining',
        () => {
            // 現代瀏覽器代碼
            console.log('使用原生可選鏈:', user?.profile?.name);
        },
        () => {
            // 老舊瀏覽器代碼
            console.log('使用後備方案:', user && user.profile && user.profile.name);
        }
    );
};

// 自動初始化
if (typeof window !== 'undefined') {
    // 頁面載入時檢查兼容性
    document.addEventListener('DOMContentLoaded', () => {
        compatibilityDemo();
    });
}
