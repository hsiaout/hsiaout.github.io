# 瀏覽器支援指南

## 可以安全使用的 ES6+ 特性 (2024)

### ✅ 完全安全 (99%+ 支援)
- `const`/`let`
- 箭頭函數 `() => {}`
- 模板字面量 `` `Hello ${name}` ``
- 解構賦值 `const {a, b} = obj`
- 展開運算符 `...args`
- `class` 語法
- `import`/`export` (需要模組環境)
- `Promise`/`async`/`await`

### ✅ 非常安全 (95%+ 支援)
- 可選鏈 `obj?.prop`
- 空值合併 `value ?? default`
- `Array.includes()`
- `Object.assign()`

### ⚠️ 需要注意 (85-95% 支援)
- 私有字段 `#private`
- 頂層 await
- `String.replaceAll()`
- 邏輯賦值 `||=`, `&&=`, `??=`

### ❌ 避免使用 (新特性，支援度低)
- Decorator `@decorator`
- Record & Tuple
- Pipeline operator `|>`

## 目標瀏覽器建議

### 現代專案
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### 保守專案  
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+
