/**
 * JavaScript 高級技巧學習示例
 * 從簡單到複雜的實戰練習
 */

// ========== 第一階段：基礎進階 ==========

// 1. Getter/Setter 練習
class User {
    constructor(name) {
        this._name = name;
        this._loginCount = 0;
    }
    
    get name() {
        return this._name.toUpperCase();
    }
    
    set name(value) {
        if (typeof value !== 'string') {
            throw new Error('Name must be a string');
        }
        this._name = value;
    }
    
    get loginCount() {
        return this._loginCount;
    }
    
    login() {
        this._loginCount++;
        console.log(`${this.name} logged in. Total: ${this.loginCount}`);
    }
}

// 使用示例
const user = new User('john');
console.log(user.name); // JOHN
user.login(); // JOHN logged in. Total: 1

// 2. 可選鏈操作符練習
const userData = {
    profile: {
        social: {
            twitter: '@john'
        }
    }
};

// 安全存取深層屬性
console.log(userData?.profile?.social?.twitter); // @john
console.log(userData?.profile?.social?.facebook); // undefined（不會報錯）

// 3. 解構賦值進階
const config = {
    api: {
        baseUrl: 'https://api.example.com',
        version: 'v1',
        endpoints: {
            users: '/users',
            posts: '/posts'
        }
    },
    ui: {
        theme: 'dark',
        language: 'zh-TW'
    }
};

// 深層解構
const {
    api: {
        baseUrl,
        endpoints: { users: usersEndpoint }
    },
    ui: { theme = 'light' } // 預設值
} = config;

console.log(baseUrl, usersEndpoint, theme);

// ========== 第二階段：函數式編程 ==========

// 4. 高階函數實戰
const createValidator = (rules) => {
    return (data) => {
        const errors = [];
        
        Object.entries(rules).forEach(([field, rule]) => {
            const value = data[field];
            if (rule.required && !value) {
                errors.push(`${field} is required`);
            }
            if (rule.minLength && value?.length < rule.minLength) {
                errors.push(`${field} must be at least ${rule.minLength} characters`);
            }
        });
        
        return {
            isValid: errors.length === 0,
            errors
        };
    };
};

// 使用驗證器
const userValidator = createValidator({
    username: { required: true, minLength: 3 },
    email: { required: true }
});

const result = userValidator({ username: 'jo', email: '' });
console.log(result); // { isValid: false, errors: [...] }

// 5. 柯里化 (Currying)
const multiply = (a) => (b) => a * b;
const double = multiply(2);
const triple = multiply(3);

console.log(double(5)); // 10
console.log(triple(5)); // 15

// 6. 函數組合
const compose = (...fns) => (value) => fns.reduceRight((acc, fn) => fn(acc), value);

const addOne = x => x + 1;
const square = x => x * x;
const toString = x => x.toString();

const transform = compose(toString, square, addOne);
console.log(transform(3)); // "16" (3 -> 4 -> 16 -> "16")

// ========== 第三階段：設計模式 ==========

// 7. 觀察者模式
class EventEmitter {
    constructor() {
        this.events = {};
    }
    
    on(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
        
        // 返回取消訂閱函數
        return () => {
            this.events[event] = this.events[event].filter(cb => cb !== callback);
        };
    }
    
    emit(event, data) {
        if (this.events[event]) {
            this.events[event].forEach(callback => callback(data));
        }
    }
}

// 使用示例
const emitter = new EventEmitter();
const unsubscribe = emitter.on('user-login', (user) => {
    console.log(`User ${user.name} logged in`);
});

emitter.emit('user-login', { name: 'John' });
unsubscribe(); // 取消訂閱

// 8. 工廠模式
const createApiClient = (config) => {
    const baseConfig = {
        timeout: 5000,
        retries: 3,
        ...config
    };
    
    return {
        get: (url) => fetch(`${baseConfig.baseUrl}${url}`),
        post: (url, data) => fetch(`${baseConfig.baseUrl}${url}`, {
            method: 'POST',
            body: JSON.stringify(data)
        }),
        // 鏈式調用
        withAuth: (token) => {
            return createApiClient({
                ...baseConfig,
                headers: {
                    ...baseConfig.headers,
                    'Authorization': `Bearer ${token}`
                }
            });
        }
    };
};

// 使用示例
const api = createApiClient({ baseUrl: 'https://api.example.com' });
const authApi = api.withAuth('my-token');

// ========== 第四階段：異步編程 ==========

// 9. Promise 鏈和錯誤處理
const fetchUserData = async (userId) => {
    try {
        const user = await fetch(`/users/${userId}`).then(r => r.json());
        const posts = await fetch(`/users/${userId}/posts`).then(r => r.json());
        
        return {
            ...user,
            posts: posts.slice(0, 5) // 只取前5篇文章
        };
    } catch (error) {
        console.error('Failed to fetch user data:', error);
        throw new Error('User data unavailable');
    }
};

// 10. 防抖和節流
const debounce = (fn, delay) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn.apply(this, args), delay);
    };
};

const throttle = (fn, limit) => {
    let inThrottle;
    return (...args) => {
        if (!inThrottle) {
            fn.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
};

// 使用示例
const searchHandler = debounce((query) => {
    console.log('Searching for:', query);
}, 300);

const scrollHandler = throttle(() => {
    console.log('Scroll event handled');
}, 100);

// ========== 第五階段：實用工具 ==========

// 11. 深拷貝實現
const deepClone = (obj) => {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj);
    if (obj instanceof Array) return obj.map(item => deepClone(item));
    if (obj instanceof Object) {
        const clonedObj = {};
        Object.keys(obj).forEach(key => {
            clonedObj[key] = deepClone(obj[key]);
        });
        return clonedObj;
    }
};

// 12. 鏈式 API 設計
class QueryBuilder {
    constructor() {
        this.query = {
            select: [],
            where: [],
            orderBy: []
        };
    }
    
    select(...fields) {
        this.query.select.push(...fields);
        return this; // 返回自身以支援鏈式調用
    }
    
    where(condition) {
        this.query.where.push(condition);
        return this;
    }
    
    orderBy(field, direction = 'ASC') {
        this.query.orderBy.push({ field, direction });
        return this;
    }
    
    build() {
        return this.query;
    }
}

// 使用示例
const query = new QueryBuilder()
    .select('name', 'email')
    .where('age > 18')
    .where('status = "active"')
    .orderBy('name')
    .build();

console.log(query);

// ========== 練習建議 ==========
export const learningTips = {
    daily: [
        '每天花 30 分鐘閱讀 MDN 文檔',
        '在 Codewars 上解一道算法題',
        '重構一段舊代碼，使用新學的技巧'
    ],
    
    weekly: [
        '完成一個小項目，應用所學知識',
        '閱讀開源項目代碼，學習最佳實踐',
        '寫技術筆記，總結學習心得'
    ],
    
    projects: [
        '建立一個事件系統（觀察者模式）',
        '實現一個簡單的狀態管理器',
        '創建一個可鏈式調用的動畫庫',
        '開發一個表單驗證框架'
    ]
};

console.log('🎓 開始你的 JavaScript 進階學習之旅！');
