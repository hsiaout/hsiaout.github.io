# Layout Plugin - Modular API Architecture

## 完成狀態總覽

✅ **已完成的主要目標**:
1. **修復最大化動畫系統** - 完全解決閃爍、跑位和動畫衝突問題 ✨ NEW
2. **轉換為百分比響應式佈局** - 從像素轉換為百分比，提高響應性
3. **創建模組化 API 架構** - 從 test-slot-agent.html 提取功能並建立清潔的工程師友好 API
4. **完整的容器狀態管理** - 支援嵌套容器的大小保存和恢復
5. **增強的布局序列化** - 完整記錄 Pane 到 Slot 的對應關係
6. **恢復正常動畫速度** - 所有動畫時間回到生產級標準 ✨ NEW
7. **修復 Wobbling 動畫** - 拖曳時正確處理目標窗格的 wobbling 效果 ✨ NEW

## 架構組件

### 核心模組
- **`LayoutManager.js`** - 核心佈局邏輯和槽管理，完整動畫系統
- **`LayoutPlugin.js`** - 主要 API 介面，提供所有公開方法和增強的序列化功能
- **`LayoutDefinitions.js`** - 11 種預定義佈局配置
- **`ContentManager.js`** - 模板化內容管理
- **`EventManager.js`** - 拖拽、最大化等事件處理

### 檔案結構
```
test-slot-agent/
├── src/
│   ├── LayoutManager.js      # 核心佈局邏輯 + 修復的動畫系統
│   ├── LayoutPlugin.js       # API 主介面 + 增強序列化
│   ├── LayoutDefinitions.js  # 佈局配置
│   ├── ContentManager.js     # 內容模板
│   └── EventManager.js       # 事件處理
├── test-slot-agent.css       # 編譯後的 CSS（包含動畫修復）
├── test-slot-agent.scss      # SCSS 源文件（恢復正常動畫速度）
├── test-slot-agent.html      # 原始檔案（保持不變）
├── demo.html                 # API 演示 + 容器狀態測試
└── README-API.md            # 本文檔
```

## API 使用範例

### 基本初始化
```javascript
import { LayoutPlugin } from './src/LayoutPlugin.js';

const layoutPlugin = new LayoutPlugin('container-id', {
    gap: 8,
    minSlotSize: 50,
    hDivisions: 6,
    vDivisions: 6
});
```

### 佈局管理
```javascript
// 切換佈局
layoutPlugin.switchLayout(1);

// 獲取可用佈局
const layouts = layoutPlugin.getAvailableLayouts();

// 獲取當前佈局
const current = layoutPlugin.getCurrentLayout();
```

### 最大化/最小化功能
```javascript
// 使用修復的動畫系統
layoutPlugin.maximizeSlot('slot-1');

// 使用修復的恢復動畫
layoutPlugin.minimizeSlot('slot-1');

// 智能切換（自動檢測狀態）
layoutPlugin.toggleMaximize('slot-1');
```

### 內容管理
```javascript
// 設置基本內容
layoutPlugin.setSlotContent('slot-1', '<div>內容</div>');

// 使用模板
layoutPlugin.setSlotContentWithTemplate('slot-1', 'basicCard', {
    title: '標題',
    content: '內容'
});

// 註冊自定義模板
layoutPlugin.registerContentTemplate('custom', (data) => {
    return `<div>${data.custom}</div>`;
});
```

### 增強的狀態管理
```javascript
// 完整序列化（包含容器狀態）
const state = layoutPlugin.serializeLayout();
console.log(state.containers); // 嵌套容器狀態
console.log(state.paneAssignments); // Pane 到 Slot 對應

// 恢復完整狀態（包含容器大小）
layoutPlugin.restoreLayout(state);

// 觸發所有 resize bar 的網格吸附
layoutPlugin.triggerAllBarsSnap();
```

### 事件處理
```javascript
// 監聽窗格交換
layoutPlugin.on('panesSwapped', (e) => {
    console.log('交換:', e.detail);
});

// 最大化/最小化
layoutPlugin.maximizeSlot('slot-1');
layoutPlugin.minimizeSlot('slot-1');
```

## 新增功能詳解 ✨

### 1. 完整的最大化動畫系統修復
**解決的問題**：
- ❌ 最大化/恢復時的容器閃爍
- ❌ 佔位元素清理不完整
- ❌ 動畫時間衝突
- ❌ transition 干擾

**修復方案**：
```javascript
// 在恢復過程中暫時禁用容器 transition
const allContainers = this.container.querySelectorAll('.dl-layout__container');
allContainers.forEach(container => {
    container.classList.add('dl-u-no-transition');
});

// 執行佈局恢復後才重新啟用
setTimeout(() => {
    allContainers.forEach(container => {
        container.classList.remove('dl-u-no-transition');
    });
}, OTHER_ELEMENTS_ANIMATION_DURATION);
```

### 2. 動畫時間標準化
**恢復到生產級動畫速度**：
```scss
// SCSS 變數（恢復正常速度）
$transition-maximize: 0.3s ease-in-out;     // 300ms
$transition-hiding: 0.25s ease-out;         // 250ms
$transition-resize-bar: 0.2s ease-out;      // 200ms
```

```javascript
// JavaScript 常數（恢復正常速度）
const MAXIMIZE_ANIMATION_DURATION = 300;         // 300ms
const OTHER_ELEMENTS_ANIMATION_DURATION = 250;   // 250ms
const RESIZE_BAR_FADE_DURATION = 200;           // 200ms
```

### 3. 拖曳動畫效果優化 ✨ NEW
- 修復拖曳目標窗格的 wobbling 效果
- 進入目標時移除 wobbling 效果
- 離開目標時恢復 wobbling 效果
- 確保動畫狀態的正確轉換

### 4. 多層級佔位元素清理策略
```javascript
// 方法1：直接清理 slot._placeholder
if (slot._placeholder && slot._placeholder.parentNode) {
    slot._placeholder.parentNode.removeChild(slot._placeholder);
    delete slot._placeholder;
}

// 方法2：通過 dataset 查找清理
const placeholderByDataset = this.container.querySelector(`[data-placeholder-for="${slotId}"]`);
if (placeholderByDataset && placeholderByDataset.parentNode) {
    placeholderByDataset.parentNode.removeChild(placeholderByDataset);
}

// 方法3：清理所有 placeholder 類別元素
const allPlaceholders = this.container.querySelectorAll('.dl-layout__slot-placeholder');
allPlaceholders.forEach(placeholder => {
    if (placeholder.parentNode) {
        placeholder.parentNode.removeChild(placeholder);
    }
});
```

### 5. 完整容器狀態管理
- **結構化路徑識別**: 使用穩定的 DOM 結構路徑追蹤嵌套容器
- **Flex 屬性保存**: 完整記錄 flexBasis、flexGrow、flexShrink
- **尺寸和位置**: 保存容器的實際像素尺寸和相對位置
- **Resize Bar 檢測**: 自動識別容器是否包含可調整大小的分隔條

```javascript
// 序列化結果範例
{
  containers: {
    "container-0": {
      structuralPath: "container-0",
      dimensions: { width: 400, height: 300, left: 0, top: 0 },
      style: {
        flexBasis: "50%",
        flexGrow: "0", 
        flexShrink: "0",
        flexDirection: "row"
      },
      hasResizeBars: true
    }
  }
}
```

### 6. Pane 到 Slot 對應追蹤
- **位置關係記錄**: 記錄每個 Pane 在哪個 Slot 中的位置分配
- **智能位置恢復**: 恢復時自動將 Pane 移動到正確的 Slot 位置
- **事件重新綁定**: 恢復後自動重新初始化拖拽和互動事件

```javascript
// Pane 分配範例
{
  paneAssignments: {
    "pane-pane1": "pane1",
    "pane-pane2": "pane2"
  },
  slots: {
    "pane1": {
      pane: {
        id: "pane-pane1",
        classes: ["dl-layout__pane"]
      }
    }
  }
}
```

### 7. 增強的調試和分析工具
- **容器狀態驗證**: 自動檢查恢復後的容器數量匹配
- **詳細恢復日誌**: 提供每個容器恢復過程的詳細記錄
- **錯誤處理改進**: 更好的錯誤提示和回復機制

## 修復內容

### 1. 動畫時間問題修復 ✅
- 添加 `.dl-layout__slot--snap-animating` CSS 類別
- 修復 `stopResize` 函數中的類別移除時間
- 解決 `transition: none !important` 與動畫類別的衝突

### 2. 響應式百分比轉換 ✅
- 更新 `_snapToGrid` 使用百分比計算
- 修改 `resize` 函數以在拖拽期間應用百分比值
- 增強網格計算以使用百分比步驟

### 3. 容器狀態管理系統 ✅
- 實現結構化容器路徑生成（`_generateStructuralPath`）
- 添加容器狀態序列化（`_serializeContainerStates`）
- 實現容器狀態恢復（`_restoreContainerStates`）
- 解決容器 ID 變化導致的恢復失敗問題

### 4. 拖曳動畫效果優化 ✨ NEW
- 修復拖曳目標窗格的 wobbling 效果
- 進入目標時移除 wobbling 效果
- 離開目標時恢復 wobbling 效果
- 確保動畫狀態的正確轉換

### 5. API 錯誤修復 ✅
- 修復缺失的 `_hasResizeBars` 方法
- 改進錯誤處理和日誌記錄
- 增強序列化和恢復的穩定性

## 可用佈局

1-11. **標準佈局** - 從單視窗到九宮格的完整佈局選項
- 所有佈局現在都支援完整的容器狀態保存和恢復
- 嵌套容器的大小調整會被正確記錄和恢復

## 內容模板

1. **basicCard** - 基本卡片（標題 + 內容）
2. **specialCard** - 特殊卡片（帶最大化按鈕）
3. **simpleText** - 純文字內容
4. **dataDisplay** - 數據展示

## 測試和演示

### Demo 檔案增強 ✨
- **`demo.html`** - 完整的 API 演示，包含容器狀態測試
  - 詳細的保存/恢復狀態顯示
  - 容器數量驗證
  - 恢復過程的即時日誌
  - JSON 導出/導入功能

### 新增測試功能
- **容器狀態驗證**: 自動檢查保存前後的容器數量
- **詳細日誌顯示**: 實時顯示每個恢復步驟
- **錯誤處理測試**: 測試各種錯誤情況的處理

## 布局儲存格式詳解 ✨

### 完整的狀態對象結構
```javascript
{
  layoutId: "2",                    // 布局 ID
  timestamp: 1703123456789,         // 保存時間戳
  
  // 主容器信息
  container: {
    width: 800, height: 600,
    clientWidth: 800, clientHeight: 600
  },
  
  // 槽位詳細狀態
  slots: {
    "pane1": {
      flex: "1",
      metadata: { isMaximized: false },
      dimensions: { width: 390, height: 600, left: 0, top: 0 },
      style: { flexBasis: "50%", flexGrow: "0", flexShrink: "0" },
      pane: {
        id: "pane-pane1",
        classes: ["dl-layout__pane"]
      }
    }
  },
  
  // 嵌套容器狀態 ✨ NEW
  containers: {
    "container-0": {
      structuralPath: "container-0",
      dimensions: { width: 400, height: 300 },
      style: { flexBasis: "50%", flexDirection: "row" },
      hasResizeBars: true
    }
  },
  
  // Pane 位置分配映射 ✨ NEW
  paneAssignments: {
    "pane-pane1": "pane1",
    "pane-pane2": "pane2"
  },
  
  // 系統選項
  options: {
    gap: 8, minSlotSize: 50,
    hDivisions: 6, vDivisions: 6
  }
}
```

## 向後相容性

✅ 原始 `test-slot-agent.html` 檔案保持完全不變並持續運作  
✅ 所有現有功能都通過新 API 可用  
✅ CSS 更新向後相容  
✅ 舊的序列化格式仍然支援（向前相容）  

## 性能改進

- **延遲恢復**: 容器狀態在 DOM 穩定後恢復，避免競爭條件
- **批次更新**: 多個容器狀態同時恢復，減少重繪次數
- **錯誤隔離**: 單個容器恢復失敗不會影響整體恢復過程

## 使用指南

1. **開發人員**：使用新的模組化 API（`LayoutPlugin`）進行乾淨的集成
2. **測試人員**：使用 `demo.html` 測試完整的容器狀態管理功能
3. **演示**：使用增強的 `demo.html` 展示新功能
4. **參考**：查看 `test-slot-agent.html` 了解原始實現

## 下一步建議

1. **TypeScript 支援** - 為更好的開發體驗添加類型定義
2. **主題系統** - 可切換的 CSS 主題支援  
3. **佈局模板商店** - 用戶自定義佈局的保存和分享
4. **性能監控** - 添加佈局操作的性能指標
5. **國際化** - 多語言支援

## 技術亮點 ✨

- **零依賴**: 純 JavaScript ES6+ 模組實現
- **響應式設計**: 基於百分比的彈性佈局系統
- **模組化架構**: 清晰的關注點分離
- **完整狀態管理**: 支援複雜嵌套佈局的完整序列化
- **開發者友好**: 豐富的 API 和詳細的錯誤處理
- **修復動畫衝突**: 完整修復 wobbling、拖曳和最大化動畫的互動 ✨ NEW

項目現在提供了一個完全模組化、響應式且工程師友好的佈局系統，具有清潔的 API 和全面的功能集，特別是在動畫效果和容器狀態管理方面達到了企業級應用的要求。
