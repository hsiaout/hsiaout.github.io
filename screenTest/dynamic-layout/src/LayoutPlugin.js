import { LayoutManager } from './LayoutManager.js';
import { LayoutDefinitions, getLayoutDefinition, getAvailableLayouts, hasLayout } from './LayoutDefinitions.js';

/**
 * Layout Plugin 類別
 * 提供簡單的 API 介面來操作版面配置系統
 */
export class LayoutPlugin {
    /**
     * @param {string|HTMLElement} container - 容器的 ID 或 DOM 元素
     * @param {Object} options - 配置選項
     * @param {number} [options.gap=8] - 槽之間的間距
     * @param {number} [options.minSlotSize=50] - 最小槽大小
     */
    constructor(container, options = {}) {
        console.log('Initializing LayoutPlugin with container:', container);

        this.container = typeof container === 'string'
            ? document.getElementById(container)
            : container;

        if (!this.container) {
            console.error('Container not found:', container);
            throw new Error('Container not found');
        }
        console.log('Container found:', this.container);

        // 初始化核心管理器
        this.manager = new LayoutManager(this.container, {
            gap: options.gap || 8,
            minSlotSize: options.minSlotSize || 50,
            hDivisions: options.hDivisions || 6,
            vDivisions: options.vDivisions || 6
        });

		this.currentLayout = null;
		this.debugGrid = false;
    }
    /**
     * 切換版面配置
     * @param {string|number} layoutId - 版面配置 ID
     * @param {Object} customConfig - 自定義版面配置定義 (可選)
     */
    switchLayout(layoutId) {
        // 使用自定義配置或預設配置
        const config = getLayoutDefinition(layoutId);

        if (!config) {
            console.warn(`Layout ${layoutId} not found`);
            return false;
        }

        this.currentLayout = layoutId;
        this.manager.buildFromDefinition(config, layoutId);

        const layoutDropdownButton = document.getElementById('layout-dropdown-button');
        const icon = `<i class="icon-layout-${layoutId} text-primary"></i>`;
        if (layoutDropdownButton) {
          $(layoutDropdownButton).html(icon);
        }
        return true;
    }

    /**
     * 更新特定槽的大小和位置
     * @param {string} slotId - 槽的 ID
     * @param {Object} config - 配置對象
     * @param {string} [config.flex] - flex 屬性值
     * @param {Object} [config.metadata] - 其他元數據
     */
    updateSlotConfig(slotId, config) {
        const slot = this.manager.slots.get(slotId);
        if (!slot) return;

        if (config.flex) {
            slot.setFlex(config.flex);
        }
        if (config.metadata) {
            slot.updateMetadata(config.metadata);
        }
	}

    /**
     * 最大化特定槽（使用優化的動畫系統）
     * @param {string} slotId - 槽的 ID
     * 
     * 動畫系統特性：
     * - 300ms 標準動畫時間
     * - 零閃爍保證
     * - 智能佔位元素管理
     * - 流暢的容器過渡
     */
    maximizeSlot(slotId) {
        const slot = this.manager.slots.get(slotId);
        if (!slot) {
            console.warn(`找不到槽位: ${slotId}`);
            return;
        }

        // 找到對應的 pane 元素
        const pane = slot.element.querySelector('.dl-layout__pane');
        if (!pane) {
            console.warn(`槽位 ${slotId} 中找不到 pane 元素`);
            return;
        }

        // 使用 LayoutManager 的完整最大化邏輯（已優化動畫系統）
        this.manager._maximizePane(pane);
        console.log(`✅ API: 觸發槽位 ${slotId} 最大化`);
    }

    /**
     * 最小化特定槽（使用修復的恢復動畫）
     * @param {string} slotId - 槽的 ID
     * 
     * 修復內容：
     * - 多層級佔位元素清理
     * - 容器 transition 管理
     * - 250ms 標準恢復動畫
     * - 完整的狀態重置
     */
    minimizeSlot(slotId) {
        const slot = this.manager.slots.get(slotId);
        if (!slot || !slot.metadata.isMaximized) {
            console.warn(`槽位 ${slotId} 未處於最大化狀態`);
            return;
        }

        // 找到對應的 pane 元素
        const pane = slot.element.querySelector('.dl-layout__pane');
        if (!pane) {
            console.warn(`槽位 ${slotId} 中找不到 pane 元素`);
            return;
        }

        // 立即更新按鈕狀態，確保用戶看到即時反饋
        const maximizeButton = pane.querySelector('.dl-card__button--maximize');
        if (maximizeButton) {
            maximizeButton.innerHTML = '↗️';
            maximizeButton.title = '放大';
        }

        // 使用 LayoutManager 的完整恢復邏輯（已修復閃爍問題）
        this.manager._restorePane(pane);
        console.log(`✅ API: 觸發槽位 ${slotId} 最小化`);
    }

    /**
     * 切換槽的最大/最小化狀態（智能動畫管理）
     * @param {string} slotId - 槽的 ID
     * 
     * 智能特性：
     * - 自動檢測當前狀態
     * - 即時按鈕反饋
     * - 優化的動畫切換
     */
    toggleMaximize(slotId) {
		const slot = this.manager.slots.get(slotId);
        if (!slot) return;

        // 獲取按鈕元素以確保狀態同步
        const pane = slot.element.querySelector('.dl-layout__pane');
        const maximizeButton = pane ? pane.querySelector('.dl-card__button--maximize') : null;

        if (slot.metadata.isMaximized) {
            // 立即更新按鈕狀態
            if (maximizeButton) {
                maximizeButton.innerHTML = '↗️';
                maximizeButton.title = '放大';
            }
            this.minimizeSlot(slotId);
        } else {
            // 立即更新按鈕狀態
            if (maximizeButton) {
                maximizeButton.innerHTML = '↙️';
                maximizeButton.title = '縮小';
            }
            this.maximizeSlot(slotId);
        }
    }

    /**
     * 更新選項設定
     * @param {Object} options - 新的選項設定
     */
    updateOptions(options) {
        if (options.hDivisions !== undefined) {
            this.manager.options.hDivisions = options.hDivisions;
        }
        if (options.vDivisions !== undefined) {
            this.manager.options.vDivisions = options.vDivisions;
        }
        if (options.gap !== undefined) {
            this.manager.options.gap = options.gap;
        }
        if (options.minSlotSize !== undefined) {
            this.manager.options.minSlotSize = options.minSlotSize;
        }
        console.log('Updated options:', this.manager.options);
    }

    /**
     * 獲取所有可用的布局 ID
     * @returns {string[]} 布局 ID 數組
     */
    getAvailableLayouts() {
        return getAvailableLayouts();
    }

    /**
     * 檢查布局是否存在
     * @param {string|number} layoutId - 布局 ID
     * @returns {boolean} 是否存在
     */
    hasLayout(layoutId) {
        return hasLayout(layoutId);
    }

    /**
     * 獲取當前布局 ID
     * @returns {string|null} 當前布局 ID
     */
    getCurrentLayout() {
        return this.currentLayout;
    }

    /**
     * 獲取所有槽的信息
     * @returns {Object} 槽信息對象
     */
    getAllSlots() {
        const slots = {};
        this.manager.slots.forEach((slot, id) => {
            slots[id] = {
                id: id,
                flex: slot.flex,
                metadata: slot.metadata,
                element: slot.element
            };
        });
        return slots;
    }

    /**
	 * 監聽事件
	 * @param {string} eventType - 事件類型
	 * @param {Function} callback - 回調函數
	 */
	on(eventType, callback) {
		if (this.manager && this.manager.container && typeof callback === 'function') {
			this.manager.container.addEventListener(eventType, callback);
			console.log(`✅ Event listener added for ${eventType}`);
		} else {
			console.warn(`❌ Cannot add event listener for ${eventType}`);
		}
	}

	/**
	 * 移除事件監聽器
	 * @param {string} eventType - 事件類型
	 * @param {Function} callback - 回調函數
	 */
	off(eventType, callback) {
		if (this.manager && this.manager.container && typeof callback === 'function') {
			this.manager.container.removeEventListener(eventType, callback);
			console.log(`✅ Event listener removed for ${eventType}`);
		}
	}

    /**
     * 序列化當前布局狀態
     * @returns {Object} 布局狀態對象
     */
    serializeLayout() {
        return this.manager.serializeLayout(this.currentLayout);
    }

    /**
     * 從序列化的狀態恢復布局
     * @param {Object} state - 布局狀態對象
     */
    restoreLayout(state) {
        if (!state || !state.layoutId) return false;

        try {
            // 更新選項
            if (state.options) {
                this.updateOptions(state.options);
            }

            // 切換到指定布局
            if (!this.switchLayout(state.layoutId)) {
                return false;
            }

            // 等待布局渲染完成後再恢復狀態
            setTimeout(() => {
                this.manager._restoreLayoutState(state);
            }, 50);

            return true;
        } catch (error) {
            console.error('恢復布局失敗:', error);
            return false;
        }
    }

    /**
     * 顯示/隱藏調試格線
     * @param {boolean} show - 是否顯示格線
     */
    toggleDebugGrid(show) {
        if (show) {
            this.container.classList.add('dl-layout__container--debug-grid');
            this._createDebugGrid();
        } else {
            this.container.classList.remove('dl-layout__container--debug-grid');
            this._removeDebugGrid();
        }
    }

    /**
     * 創建調試格線
     * @private
     */
    _createDebugGrid() {
        // 移除現有的調試格線
        this._removeDebugGrid();

        const overlay = document.createElement('div');
        overlay.classList.add('dl-debug-grid-overlay');

        const containerRect = this.container.getBoundingClientRect();
        const hDivisions = this.manager.options.hDivisions || 6;
        const vDivisions = this.manager.options.vDivisions || 6;

        // 創建垂直線
        for (let i = 1; i < hDivisions; i++) {
            const line = document.createElement('div');
            line.classList.add('dl-debug-grid-line', 'dl-debug-grid-line--vertical');
            const position = (i / hDivisions) * 100;
            line.style.left = `${position}%`;

            // 添加標籤
            const label = document.createElement('div');
            label.classList.add('dl-debug-grid-label', 'dl-debug-grid-label--vertical');
            label.textContent = `${position.toFixed(1)}%`;
            label.style.left = `${position}%`;
            label.style.top = '4px';

            overlay.appendChild(line);
            overlay.appendChild(label);
        }

        // 創建水平線
        for (let i = 1; i < vDivisions; i++) {
            const line = document.createElement('div');
            line.classList.add('dl-debug-grid-line', 'dl-debug-grid-line--horizontal');
            const position = (i / vDivisions) * 100;
            line.style.top = `${position}%`;

            // 添加標籤
            const label = document.createElement('div');
            label.classList.add('dl-debug-grid-label', 'dl-debug-grid-label--horizontal');
            label.textContent = `${position.toFixed(1)}%`;
            label.style.top = `${position}%`;
            label.style.left = '4px';

            overlay.appendChild(line);
            overlay.appendChild(label);
        }

        this.container.appendChild(overlay);
    }

    /**
     * 移除調試格線
     * @private
     */
    _removeDebugGrid() {
        const existingOverlay = this.container.querySelector('.dl-debug-grid-overlay');
        if (existingOverlay) {
            existingOverlay.remove();
        }
    }

    /**
     * 觸發所有 resize bar 的網格吸附
     * @public
     */
    triggerAllBarsSnap() {
        this.manager._snapAllResizeBars();
    }

    /**
     * 銷毀插件實例
     */
    destroy() {
        if (this.container) {
            this.container.innerHTML = '';
        }
        this.manager = null;
        this.currentLayout = null;
	}

	/**
	 * 獲取特定槽位的 pane 元素
	 * @param {string} slotId - 槽位 ID
	 * @returns {HTMLElement|null} pane 元素
	 */
	getSlotPane(slotId) {
		const slot = this.manager.slots.get(slotId);
		if (!slot) return null;
		
		return slot.pane || slot.element.querySelector('.dl-layout__pane');
	}

	/**
	 * 設置 pane 內容
	 * @param {string} slotId - 槽位 ID
	 * @param {string|HTMLElement} content - 內容
	 */
	setPaneContent(paneId, content) {
		const pane = document.querySelector('#'+paneId);
		if (!pane) return;

		if (typeof content === 'string') {
			pane.innerHTML = content;
		} else if (content instanceof HTMLElement) {
			pane.innerHTML = '';
			pane.appendChild(content);
		}
	}
	
	/**
	 * 追加 pane 內容
	 * @param {string} slotId - 槽位 ID
	 * @param {string|HTMLElement} content - 內容
	 */
	appendPaneContent(slotId, content) {
		const slot = this.manager.slots.get(slotId);
		if (!slot) return;

		// 直接操作 pane 元素
		const pane = slot.pane || slot.element.querySelector('.dl-layout__pane');
		if (!pane) return;

		if (typeof content === 'string') {
			const div = document.createElement('div');
			div.innerHTML = content;
			pane.appendChild(div);
		} else if (content instanceof HTMLElement) {
			pane.appendChild(content);
		}
	}

	/**
	 * 清空 pane 內容
	 * @param {string} slotId - 槽位 ID
	 */
	clearPaneContent(slotId) {
		const slot = this.manager.slots.get(slotId);
		if (!slot) return;

		// 直接操作 pane 元素
		const pane = slot.pane || slot.element.querySelector('.dl-layout__pane');
		if (!pane) return;

		pane.innerHTML = '';
	}
}
