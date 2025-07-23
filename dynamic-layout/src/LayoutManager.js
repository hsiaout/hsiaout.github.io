/**
 * 負責管理布局的核心類別
 */
export class LayoutManager {
    /**
     * @param {HTMLElement} container - 容器元素
     * @param {Object} options - 配置選項
     */
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            gap: options.gap || 8,
            minSlotSize: options.minSlotSize || 50,
            hDivisions: options.hDivisions || 6,
            vDivisions: options.vDivisions || 6
        };
        this.currentLayout = null;
        this.slots = new Map();
        this.initializeContainer();
        this.initializeResizeObserver();
    }

    /**
     * 初始化容器
     * @private
     */
    initializeContainer() {
        // console.log('%cMANAGER - initializeContainer', "background-color: rgba(255,0,0,0.2)");
        this.container.style.position = 'relative';
        this.container.style.overflow = 'hidden';
        this.container.style.display = 'flex';
        this.container.style.gap = `${this.options.gap}px`;
    }

    /**
     * 初始化 ResizeObserver
     * @private
     */
    initializeResizeObserver() {
        let resizeTimeout;

        this.resizeObserver = new ResizeObserver(entries => {
            // 使用 debounce 避免過於頻繁的更新
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                for (const entry of entries) {
                    if (entry.target === this.container) {
                        this.handleContainerResize();
                    }
                }
            }, 100); // 100ms debounce
        });

        this.resizeObserver.observe(this.container);
    }

    /**
     * 處理容器 resize 事件
     * @private
     */
    handleContainerResize() {
        if (LayoutManager.#isAnimationInProgress) return;
        // 獲取目前的布局狀態
        const currentState = this.serializeLayout(this.currentLayout);
        if (!currentState) return;

        // 使用與 saveLayout 相同的還原邏輯
        this._restoreLayoutStateByResize(currentState);

        // 觸發所有 resize bar 的網格吸附
        requestAnimationFrame(() => {
            this._snapAllResizeBars();
        });
    }

    /**
     * 清理 resize observer
     * @public
     */
    destroy() {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
    }

    /**
     * 從定義構建布局
     * @param {Object} definition - 布局定義
     */
    buildFromDefinition(definition, layoutId = null) {
        // console.log('%cMANAGER - buildFromDefinition', "background-color: rgba(255, 230, 0, 0.2)");

        // 更新當前佈局
        if (layoutId) {
            this.currentLayout = layoutId; // 👈 更新當前佈局
        }

        // 清空當前容器
        this.container.innerHTML = '';
        this.slots.clear();

        // 設置容器方向
        this.container.style.flexDirection = definition.direction;

        // 遞迴構建布局
        this.buildItems(definition.items, this.container);
    }

    /**
     * 遞迴構建布局項目
     * @private
     * @param {Array} items - 項目定義數組
     * @param {HTMLElement} parent - 父容器
     */
    buildItems(items, parent) {
        // console.log('%cMANAGER - buildItmes', "background-color: rgba(255,0,0,0.2)");

        items.forEach(item => {
            if (item.type === 'container') {
                const container = this.createContainer(item);
                parent.appendChild(container);
                if (item.items) {
                    this.buildItems(item.items, container);
                }
            } else if (item.type === 'slot') {
                const slot = this.createSlot(item);
                parent.appendChild(slot.element);
                this.slots.set(item.id, slot);
            } else if (item.type === 'resize-bar') {
                const bar = this.createResizeBar(item.orientation);
                parent.appendChild(bar);
            }
        });

        // 為所有的 resize bars 添加功能
        Array.from(parent.children).forEach((child, index, children) => {
            if (child.classList.contains('dl-resize-bar')) {
                const prevEl = children[index - 1];
                const nextEl = children[index + 1];

                // 確保前後元素都存在，且是有效的容器或槽
                if (prevEl && nextEl &&
                    ((prevEl.classList.contains('dl-layout__slot') || prevEl.classList.contains('dl-layout__container')) &&
                        (nextEl.classList.contains('dl-layout__slot') || nextEl.classList.contains('dl-layout__container')))) {

                    // 設置合適的尺寸
                    if (child.classList.contains('dl-resize-bar--vertical')) {
                        child.style.width = '8px';
                        child.style.cursor = 'ew-resize';
                    } else {
                        child.style.height = '8px';
                        child.style.cursor = 'ns-resize';
                    }

                    // 初始化拖曳功能
                    this._initializeResizeBarEvents(child, prevEl, nextEl);
                }
            }
        });
    }

    /**
     * 創建容器元素
     * @private
     * @param {Object} config - 容器配置
     */
    createContainer(config) {
        // console.log('%cMANAGER - createContainer', "background-color: rgba(255,0,0,0.2)");
        const container = document.createElement('div');
        container.className = 'dl-layout__container';
        container.style.display = 'flex';
        container.style.flex = config.flex || '1';
        container.style.flexDirection = config.direction || 'row';
        container.style.gap = `${this.options.gap}px`;
        container.style.minWidth = `${this.options.minSlotSize}px`;
        container.style.minHeight = `${this.options.minSlotSize}px`;
        return container;
    }

    /**
     * 創建調整大小的bar
     * @private
     */
    createResizeBar(orientation) {
        // console.log('%cMANAGER - createResizeBar', "background-color: rgba(255,0,0,0.2)");
        const bar = document.createElement('div');
        bar.className = `dl-resize-bar dl-resize-bar--${orientation}`;
        return bar;
    }

    /**
     * 初始化 resize bar 的事件監聽
     * @private
     * @param {HTMLElement} bar - The resize bar element
     * @param {HTMLElement} prevEl - The previous element
     * @param {HTMLElement} nextEl - The next element
     */
    _initializeResizeBarEvents(bar, prevEl, nextEl) {
        // console.log('%cMANAGER - _initializeResizeBarEvents', "background-color: rgba(255,0,0,0.2)");
        let startX, startY;
        let prevSize, nextSize;
        let isResizing = false;

        const isVertical = bar.classList.contains('dl-resize-bar--vertical');
        const startResize = (e) => {
            isResizing = true;
            startX = e.clientX;
            startY = e.clientY;
            // Get initial sizes and parent size
            const parent = prevEl.parentElement;
            const parentSize = isVertical ? parent.clientWidth : parent.clientHeight;
            prevSize = isVertical ? prevEl.offsetWidth : prevEl.offsetHeight;
            nextSize = isVertical ? nextEl.offsetWidth : nextEl.offsetHeight;

            // Add resize class and disable transitions
            bar.classList.add('dl-resize-bar--active');
            prevEl.classList.add('dl-layout__slot--resizing');
            nextEl.classList.add('dl-layout__slot--resizing');

            // If the elements are containers, add resizing class to them too
            if (prevEl.classList.contains('dl-layout__container')) {
                prevEl.classList.add('dl-layout__container--resizing');
            }
            if (nextEl.classList.contains('dl-layout__container')) {
                nextEl.classList.add('dl-layout__container--resizing');
            }

            // Show grid lines for resize guidance
            this._showGridLinesForResize(bar, prevEl, nextEl, isVertical);

            // Set flex properties to prevent automatic resizing (convert to percentage)
            const prevSizePercent = (prevSize / parentSize) * 100;
            const nextSizePercent = (nextSize / parentSize) * 100;

            prevEl.style.flexGrow = '0';
            prevEl.style.flexShrink = '0';
            nextEl.style.flexGrow = '0';
            nextEl.style.flexShrink = '0';
            prevEl.style.flexBasis = `${prevSizePercent.toFixed(2)}%`;
            nextEl.style.flexBasis = `${nextSizePercent.toFixed(2)}%`;

            // Add event listeners
            document.addEventListener('mousemove', resize);
            document.addEventListener('mouseup', stopResize);

            // Prevent text selection while resizing
            e.preventDefault();
            // console.log("%cStart resize", "background-color: red; color: white");
        };
        const resize = (e) => {
            if (!isResizing) return;

            const delta = isVertical ? e.clientX - startX : e.clientY - startY;
            const parent = prevEl.parentElement;
            const parentSize = isVertical ? parent.clientWidth : parent.clientHeight;

            // Calculate new sizes in pixels
            let newPrevSize = prevSize + delta;
            let newNextSize = nextSize - delta;

            // Apply minimum size constraints
            const minSize = this.options.minSlotSize;
            if (newPrevSize < minSize) {
                newPrevSize = minSize;
                newNextSize = prevSize + nextSize - minSize;
            }
            if (newNextSize < minSize) {
                newNextSize = minSize;
                newPrevSize = prevSize + nextSize - minSize;
            }

            // Convert to percentages
            const newPrevPercent = (newPrevSize / parentSize) * 100;
            const newNextPercent = (newNextSize / parentSize) * 100;

            // Apply new sizes using flex-basis with percentages
            prevEl.style.flexBasis = `${newPrevPercent.toFixed(2)}%`;
            nextEl.style.flexBasis = `${newNextPercent.toFixed(2)}%`;

            // console.log("%cResize", "background-color: green; color: white");
        };
        const stopResize = () => {
            if (!isResizing) return;
            isResizing = false;
            bar.classList.remove('dl-resize-bar--active');
            // Remove resizing classes first to allow animations
            prevEl.classList.remove('dl-layout__slot--resizing');
            nextEl.classList.remove('dl-layout__slot--resizing');

            // Remove container resizing classes if needed
            if (prevEl.classList.contains('dl-layout__container')) {
                prevEl.classList.remove('dl-layout__container--resizing');
            }
            if (nextEl.classList.contains('dl-layout__container')) {
                nextEl.classList.remove('dl-layout__container--resizing');
            }

            // Apply snap to grid (this will add animation classes)
            this._snapToGrid(bar, prevEl, nextEl, isVertical);

            // Clear grid lines
            this._clearVisualGridLines();

            document.removeEventListener('mousemove', resize);
            document.removeEventListener('mouseup', stopResize);
            // console.log("%cStop resize", "background-color: blue; color: white");
        };

        // Add mouse down event listener to the resize bar
        bar.addEventListener('mousedown', startResize);
    }

    /**
     * 創建槽位
     * @private
     * @param {Object} config - 槽位配置
     */
    createSlot(config) {
        // console.log('%cMANAGER - createSlot', "background-color: rgba(255,0,0,0.2)");

        const slot = document.createElement('div');
        slot.className = 'dl-layout__slot';
        slot.id = config.id;
        slot.dataset.slotId = config.id;
        slot.style.flex = config.flex || '1';
        slot.style.minWidth = `${this.options.minSlotSize}px`;
        slot.style.minHeight = `${this.options.minSlotSize}px`;
        slot.style.position = 'relative';
        slot.style.display = 'flex';
        slot.style.overflow = 'hidden';

        // 創建 pane 元素
        const pane = document.createElement('div');
        pane.className = 'dl-layout__pane';
        pane.id = `pane${config.order}`;
        pane.draggable = true;

        slot.appendChild(pane);

        // 初始化拖拽事件
        this._initializePaneDragEvents(pane);

        // 返回 slot 介面
        return {
            id: config.id,
            element: slot,
            metadata: {},
            flex: config.flex || '1',

            setFlex(flex) {
                this.flex = flex;
                this.element.style.flex = flex;
            },

            updateMetadata(metadata) {
                this.metadata = { ...this.metadata, ...metadata };
                if (metadata.isVisible === false) {
                    slot.style.display = 'none';
                } else if (metadata.isVisible === true) {
                    slot.style.display = 'flex';
                }
			}
        };
    }

    /**
     * 初始化 pane 的拖拽事件
     * @private
     */
    _initializePaneDragEvents(pane) {
        // console.log('%cMANAGER - _initializePaneDragEvents', "background-color: rgba(255,0,0,0.2)");
        let dragOffsetX = 0;
        let dragOffsetY = 0;
        let lastHoveredPaneForDragOver = null;
        let activeHelperNode = null;
        let isDragInProgress = false;

        // 確保 pane 有唯一的標識符
        if (!pane.id) {
            pane.id = `pane-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        }

        // 清理任何存在的輔助節點
        const cleanupHelper = () => {
            // console.log('%cMANAGER - cleanupHelper', "background-color: rgba(255,0,0,0.2)");
            if (activeHelperNode && activeHelperNode.parentNode) {
                activeHelperNode.parentNode.removeChild(activeHelperNode);
                activeHelperNode = null;
            }
            // 清理所有可能殘留的 helper
            const allHelpers = document.querySelectorAll('.dl-drag-helper');
            allHelpers.forEach(helper => {
                if (helper.parentNode) {
                    helper.parentNode.removeChild(helper);
                }
            });
        };

        const updateHelperPositionOnDrag = (e) => {
            // console.log('%cMANAGER - updateHelperPositionOnDrag', "background-color: rgba(255,0,0,0.2)");
            if (!activeHelperNode || !this.draggedPaneElement || !isDragInProgress) return;

            const x = e.pageX || e.clientX;
            const y = e.pageY || e.clientY;

            // 忽略無效的座標
            if (x === 0 && y === 0 && e.screenX === 0 && e.screenY === 0) return;

            activeHelperNode.style.left = `${x - dragOffsetX}px`;
            activeHelperNode.style.top = `${y - dragOffsetY}px`;
        };

        const handleDragStart = (e) => {
            // console.log('%cMANAGER - handleDragStart', "background-color: rgba(255,0,0,0.2)");
            e.stopPropagation();

            // 防止重複觸發或在已有拖拽時觸發
            if (isDragInProgress || this.draggedPaneElement || activeHelperNode) {
                console.warn('拖拽已在進行中，忽略新的拖拽請求');
                cleanupHelper();
                return false;
            }

            this.draggedPaneElement = e.target.closest('.dl-layout__pane');
            if (!this.draggedPaneElement) return false;

            // 檢查是否是正確的 pane
            if (this.draggedPaneElement !== pane) {
                console.warn('拖拽元素不匹配，重置狀態');
                this.draggedPaneElement = null;
                return false;
            }

            isDragInProgress = true;
            LayoutManager.setIsAnimationInProgress(true);

            // console.log(`🎯 開始拖拽 pane: ${this.draggedPaneElement.id}`);

            // Add classes for visual feedback
            this.draggedPaneElement.classList.add('dl-layout__pane--dragging', 'dl-layout__pane--wobbling', 'dl-layout__pane--drag-helper', 'dl-u-no-transition');

            // Make other panes wobble with staggered animation delays
            document.querySelectorAll('.dl-layout__pane:not(.dl-layout__pane--dragging)').forEach(p => {
                p.classList.add('dl-layout__pane--wobbling');
                p.style.animationDelay = `-${Math.random() * 0.3}s`;
            });
            this.draggedPaneElement.style.animationDelay = '0s';

            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', this.draggedPaneElement.id);

            // Create helper node
            activeHelperNode = this.draggedPaneElement.cloneNode(true);
            activeHelperNode.classList.remove('dl-layout__pane--dragging');
            activeHelperNode.classList.add('dl-drag-helper', 'dl-layout__pane--drag-helper', 'dl-layout__pane--wobbling', 'dl-u-no-transition');
            activeHelperNode.style.position = 'fixed';
            activeHelperNode.style.pointerEvents = 'none';
            activeHelperNode.style.zIndex = '9999';
            activeHelperNode.style.animationDelay = '0s';
            activeHelperNode.style.opacity = '0.8';
            activeHelperNode.style.transform = 'scale(0.95)';
            activeHelperNode.style.transition = 'transform 0.2s ease-out';

            // Position helper
            const rect = this.draggedPaneElement.getBoundingClientRect();
            activeHelperNode.style.width = `${rect.width}px`;
            activeHelperNode.style.height = `${rect.height}px`;
            dragOffsetX = e.clientX - rect.left;
            dragOffsetY = e.clientY - rect.top;
            activeHelperNode.style.left = `${e.pageX - dragOffsetX}px`;
            activeHelperNode.style.top = `${e.pageY - dragOffsetY}px`;

            document.body.appendChild(activeHelperNode);
            e.dataTransfer.setDragImage(document.createElement('div'), 0, 0);

            // 添加事件監聽器
            document.addEventListener('drag', updateHelperPositionOnDrag);

            return true;
        };

        const handleDragOver = (e) => {
            // console.log('%cMANAGER - handleDragOver', "background-color: rgba(255,0,0,0.2)");
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
        };

        const handleDragEnter = (e) => {
            // console.log('%cMANAGER - handleDragEnter', "background-color: rgba(255,0,0,0.2)");
            e.preventDefault();

            const targetPane = e.target.closest('.dl-layout__pane');
            if (!targetPane || targetPane === this.draggedPaneElement) return;

            // Remove previous drag-over effects
            if (lastHoveredPaneForDragOver && lastHoveredPaneForDragOver !== targetPane) {
                lastHoveredPaneForDragOver.classList.remove('dl-layout__pane--drag-over');
                // 恢復上一個目標的 wobbling
                lastHoveredPaneForDragOver.classList.add('dl-layout__pane--wobbling');
            }

            // Add drag-over effect to current target and remove wobbling
            targetPane.classList.add('dl-layout__pane--drag-over');
            targetPane.classList.remove('dl-layout__pane--wobbling'); // 移除當前目標的 wobbling
            lastHoveredPaneForDragOver = targetPane;
        };

        const handleDragLeave = (e) => {
            // console.log('%cMANAGER - handleDragLeave', "background-color: rgba(255,0,0,0.2)");
            const targetPane = e.target.closest('.dl-layout__pane');
            if (!targetPane) return;

            // Only remove if we're actually leaving this pane
            const rect = targetPane.getBoundingClientRect();
            const isInsidePane = e.clientX >= rect.left && e.clientX <= rect.right &&
                e.clientY >= rect.top && e.clientY <= rect.bottom;

            if (!isInsidePane) {
                targetPane.classList.remove('dl-layout__pane--drag-over');
                targetPane.classList.add('dl-layout__pane--wobbling'); // 恢復 wobbling
                if (lastHoveredPaneForDragOver === targetPane) {
                    lastHoveredPaneForDragOver = null;
                }
            }
        };

        const handleDrop = (e) => {
            // console.log('%cMANAGER - handleDrop', "background-color: rgba(255,0,0,0.2)");
            e.preventDefault();

            const targetPane = e.target.closest('.dl-layout__pane');
            if (!targetPane || targetPane === this.draggedPaneElement) return;

            // console.log(`🎯 拖拽放置: ${this.draggedPaneElement.id} → ${targetPane.id}`);

            // Get the slots that contain these panes
            const sourceSlot = this.draggedPaneElement.closest('.dl-layout__slot');
            const targetSlot = targetPane.closest('.dl-layout__slot');

            if (!sourceSlot || !targetSlot) return;

            // Swap the panes
            const sourceParent = this.draggedPaneElement.parentNode;
            const targetParent = targetPane.parentNode;
            const sourceSibling = this.draggedPaneElement.nextSibling;

            targetParent.insertBefore(this.draggedPaneElement, targetPane);
            sourceParent.insertBefore(targetPane, sourceSibling);

            // console.log('✅ 窗格交換完成');
        };

        const handleDragEnd = () => {
            // console.log('%cMANAGER - handleDragEnd', "background-color: rgba(255,0,0,0.2)");
            // console.log(`🏁 結束拖拽: ${this.draggedPaneElement?.id || 'unknown'}`);

            isDragInProgress = false;

            if (this.draggedPaneElement) {
                this.draggedPaneElement.classList.remove(
                    'dl-layout__pane--dragging',
                    'dl-layout__pane--wobbling',
                    'dl-layout__pane--drag-helper',
                    'dl-u-no-transition'
                );
                this.draggedPaneElement.style.animationDelay = '';
            }

            // Clean up helper node
            cleanupHelper();

            // Remove all wobbling effects from all panes
            document.querySelectorAll('.dl-layout__pane').forEach(p => {
                p.classList.remove('dl-layout__pane--drag-over', 'dl-layout__pane--wobbling');
                p.style.animationDelay = '';
            });

            // 移除事件監聽器
            document.removeEventListener('drag', updateHelperPositionOnDrag);

            this.draggedPaneElement = null;
            lastHoveredPaneForDragOver = null;

            LayoutManager.setIsAnimationInProgress(false);
        };

        // 確保 pane 是可拖拽的
        pane.draggable = true;

        // 移除任何現有的事件監聽器（避免重複綁定）
        pane.removeEventListener('dragstart', handleDragStart);
        pane.removeEventListener('dragover', handleDragOver);
        pane.removeEventListener('dragenter', handleDragEnter);
        pane.removeEventListener('dragleave', handleDragLeave);
        pane.removeEventListener('drop', handleDrop);
        pane.removeEventListener('dragend', handleDragEnd);

        // 綁定新的事件監聽器
        pane.addEventListener('dragstart', handleDragStart);
        pane.addEventListener('dragover', handleDragOver);
        pane.addEventListener('dragenter', handleDragEnter);
        pane.addEventListener('dragleave', handleDragLeave);
        pane.addEventListener('drop', handleDrop);
        pane.addEventListener('dragend', handleDragEnd);

        // console.log(`✅ 初始化 pane 事件: ${pane.id}`);
    }

    /**
     * 將窗格最大化
     * @private
     * @param {HTMLElement} pane - 要最大化的窗格
     */
    _maximizePane(pane) {
        // console.log('%cMANAGER - maximizePane', "background-color: rgba(255,0,0,0.2)");
        const slot = pane.closest('.dl-layout__slot');
        if (!slot) return;

        const slotId = slot.dataset.slotId;
        if (!slotId) return;

        const currentSlot = this.slots.get(slotId);
        if (!currentSlot) return;

        // 檢查是否已經最大化
        if (currentSlot.metadata.isMaximized) {
            this._restorePane(pane);
            return;
        }

        // 開始最大化過程
        this._proceedWithMaximization(pane, slot, currentSlot);
    }

    /**
     * 恢復窗格到原始狀態
     * @private
     * @param {HTMLElement} pane - 要恢復的窗格
     */
    _restorePane(pane) {
        // console.log('%cMANAGER - _restorePane', "background-color: rgba(255,0,0,0.2)");
        const slot = pane.closest('.dl-layout__slot');
        if (!slot) return;

        const slotId = slot.dataset.slotId;
        if (!slotId) return;

        const currentSlot = this.slots.get(slotId);
        if (!currentSlot || !currentSlot.metadata.isMaximized) return;

        LayoutManager.setIsAnimationInProgress(true);

        // 恢復正常動畫時間
        const MAXIMIZE_ANIMATION_DURATION = 300; // 恢復原本 300ms
        const OTHER_ELEMENTS_ANIMATION_DURATION = 250; // 恢復原本 250ms

        // console.log(`🔄 開始恢復窗格 ${slotId}`);


        // 重置狀態
		currentSlot.metadata.isMaximized = false;
		
		// ⭐ 發出恢復事件
		const restoreEvent = new CustomEvent('slotRestored', {
			detail: {
				slotId: currentSlot.id,
				paneId: pane.id
			}
		});
		this.container.dispatchEvent(restoreEvent);

        // 1. 開始縮小動畫
        if (slot._originalRect) {
            const containerRect = this.container.getBoundingClientRect();
            slot.style.top = `${slot._originalRect.top - containerRect.top}px`;
            slot.style.left = `${slot._originalRect.left - containerRect.left}px`;
            slot.style.width = `${slot._originalRect.width}px`;
            slot.style.height = `${slot._originalRect.height}px`;
            slot.style.transition = `all ${MAXIMIZE_ANIMATION_DURATION / 1000}s ease-in-out`;

            // 移除最大化類別以觸發動畫
            slot.classList.remove('dl-layout__slot--maximized');
        }

        // 2. 等待縮小動畫完成
        setTimeout(() => {
            // ⭐ 修復：清理佔位元素 - 添加多種清理策略
            // console.log(`🧹 檢查佔位元素清理 for slot ${slotId}`);

            // 方法1：直接清理 slot._placeholder
            if (slot._placeholder && slot._placeholder.parentNode) {
                // console.log(`🧹 清理佔位元素 (方法1): ${slot._placeholder.dataset.placeholderFor}`);
                slot._placeholder.parentNode.removeChild(slot._placeholder);
                delete slot._placeholder;
            }

            // 方法2：通過 dataset 查找並清理佔位元素
            const placeholderByDataset = this.container.querySelector(`[data-placeholder-for="${slotId}"]`);
            if (placeholderByDataset && placeholderByDataset.parentNode) {
                // console.log(`🧹 清理佔位元素 (方法2): ${slotId}`);
                placeholderByDataset.parentNode.removeChild(placeholderByDataset);
            }

            // 方法3：清理所有 placeholder 類別的元素
            const allPlaceholders = this.container.querySelectorAll('.dl-layout__slot-placeholder');
            allPlaceholders.forEach(placeholder => {
                if (placeholder.parentNode) {
                    // console.log(`🧹 清理佔位元素 (方法3): ${placeholder.dataset.placeholderFor || 'unknown'}`);
                    placeholder.parentNode.removeChild(placeholder);
                }
            });

            // ⭐ 修復：在清理槽位樣式前，先移除所有容器的 transition 避免閃爍
            const allContainers = this.container.querySelectorAll('.dl-layout__container');
            allContainers.forEach(container => {
                container.classList.add('dl-u-no-transition');
            });

            // 清理槽位樣式
            if (slot.isConnected) {
                slot.style.position = '';
                slot.style.top = '';
                slot.style.left = '';
                slot.style.width = '';
                slot.style.height = '';
                slot.style.zIndex = '';
                slot.style.margin = '';
                slot.style.transition = '';

                // 恢復 flex 屬性
                if (slot._originalFlexBasis) {
                    slot.style.flexBasis = slot._originalFlexBasis;
                    slot.style.flexGrow = slot._originalFlexGrow;
                    slot.style.flexShrink = slot._originalFlexShrink;
                }

                // 清理保存的狀態
                delete slot._originalRect;
                delete slot._originalFlexBasis;
                delete slot._originalFlexGrow;
                delete slot._originalFlexShrink;
                delete slot._originalZIndex;
                delete currentSlot.metadata.originalState;
            }

            // 恢復容器狀態
            this.container.classList.remove('dl-layout--maximized');
            this.container.style.gap = `${this.options.gap}px`;

            // 移除父容器的最大化標記
            Array.from(this.container.querySelectorAll('.dl-layout__container--maximized-ancestor'))
                .forEach(el => el.classList.remove('dl-layout__container--maximized-ancestor'));

            // 3. 準備其他元素的淡入動畫
            const resizeBars = Array.from(this.container.querySelectorAll('.dl-resize-bar'));
            resizeBars.forEach(bar => {
                // ⭐ 修復：重置所有 resize bar 的顯示屬性
                bar.style.display = '';
                bar.style.visibility = 'visible'; // 確保 visibility 被重置
                bar.style.opacity = '0';
                bar.style.transition = `opacity ${OTHER_ELEMENTS_ANIMATION_DURATION}ms ease-out`;
            });

            // 恢復其他槽位
            this.slots.forEach((otherSlot, otherId) => {
                if (otherId !== currentSlot.id) {
                    const otherSlotElement = otherSlot.element;
                    if (otherSlotElement && otherSlotElement.isConnected) {
                        otherSlotElement.classList.remove('dl-layout__slot--hidden', 'dl-layout__slot--hiding');
                        otherSlotElement.style.display = 'flex';
                        otherSlotElement.style.visibility = 'visible'; // ⭐ 修復：恢復 visibility
                        otherSlotElement.style.opacity = '0';
                        otherSlotElement.style.transform = 'scale(1)';
                        otherSlotElement.style.transition = `opacity ${OTHER_ELEMENTS_ANIMATION_DURATION}ms ease-out`;

                        otherSlot.updateMetadata({ isVisible: true });
                    }
                }
            });

            // 4. 觸發淡入動畫
            requestAnimationFrame(() => {
                resizeBars.forEach(bar => {
                    bar.style.opacity = '1';
                });

                this.slots.forEach((otherSlot, otherId) => {
                    if (otherId !== currentSlot.id) {
                        const otherSlotElement = otherSlot.element;
                        if (otherSlotElement && otherSlotElement.isConnected) {
                            otherSlotElement.style.opacity = '1';
                        }
                    }
                });
            });

            // 5. 清理動畫樣式
            setTimeout(() => {
                resizeBars.forEach(bar => {
                    bar.style.transition = '';
                    bar.style.opacity = ''; // ⭐ 修復：清理內聯 opacity 樣式
                });

                this.slots.forEach((otherSlot, otherId) => {
                    if (otherId !== currentSlot.id) {
                        const otherSlotElement = otherSlot.element;
                        if (otherSlotElement && otherSlotElement.isConnected) {
                            otherSlotElement.style.transition = '';
                            otherSlotElement.style.opacity = '';
                            otherSlotElement.style.transform = '';
                            otherSlotElement.style.visibility = ''; // ⭐ 修復：清理內聯 visibility 樣式
                        }
                    }
                });

                // ⭐ 修復：最後才恢復容器的 transition，避免閃爍
                allContainers.forEach(container => {
                    container.classList.remove('dl-u-no-transition');
                });

                LayoutManager.setIsAnimationInProgress(false);
                // console.log(`✅ 窗格 ${slotId} 恢復完成`);

            }, OTHER_ELEMENTS_ANIMATION_DURATION);

        }, MAXIMIZE_ANIMATION_DURATION);
    }

    /**
     * 執行最大化的詳細過程
     * @private
     * @param {HTMLElement} pane - 窗格元素
     * @param {HTMLElement} slot - 槽位元素
     * @param {Object} currentSlot - 槽位對象
     */
    _proceedWithMaximization(pane, slot, currentSlot) {
        // console.log('%cMANAGER - _proceedWithMaximization', "background-color: rgba(255,0,0,0.2)");
        LayoutManager.setIsAnimationInProgress(true);

        // 恢復正常動畫時間
        const MAXIMIZE_ANIMATION_DURATION = 300; // 恢復原本 300ms
        const OTHER_ELEMENTS_ANIMATION_DURATION = 250; // 恢復原本 250ms
        const RESIZE_BAR_FADE_DURATION = 200; // 恢復原本 200ms

        // ⭐ 在任何元素被隱藏之前先保存目標槽位的位置
        slot._originalRect = slot.getBoundingClientRect();
        const slotStyle = getComputedStyle(slot);
        slot._originalFlexBasis = slotStyle.flexBasis;
        slot._originalFlexGrow = slotStyle.flexGrow;
        slot._originalFlexShrink = slotStyle.flexShrink;
        slot._originalZIndex = slotStyle.zIndex;

        // 設置 metadata
        currentSlot.metadata.isMaximized = true;
        currentSlot.metadata.originalState = {
            flex: currentSlot.flex,
            isVisible: true
		};
		
		// ⭐ 發出最大化事件
		const maximizeEvent = new CustomEvent('slotMaximized', {
			detail: {
				slotId: currentSlot.id,
				paneId: pane.id
			}
		});
		this.container.dispatchEvent(maximizeEvent);

        // 1. 隱藏所有 resize bars
        const allResizeBars = Array.from(this.container.querySelectorAll('.dl-resize-bar'));
        allResizeBars.forEach(bar => {
            bar.style.transition = `opacity ${RESIZE_BAR_FADE_DURATION}ms ease-out`;
            bar.style.opacity = '0';
        });

        // 2. 準備隱藏其他槽位（使用 visibility 而非 display 避免跑位）
        const hiddenSlotsInfo = [];
        this.slots.forEach((otherSlot, otherId) => {
            if (otherId !== currentSlot.id) {
                const otherSlotElement = otherSlot.element;
                const paneInside = otherSlotElement.querySelector('.dl-layout__pane');

                hiddenSlotsInfo.push({
                    slot: otherSlot,
                    element: otherSlotElement,
                    paneId: paneInside ? paneInside.id : otherSlotElement.id,
                    originalDisplay: getComputedStyle(otherSlotElement).display,
                    originalVisibility: getComputedStyle(otherSlotElement).visibility
                });

                // ⭐ 修復：立即移除 display: none，使用 visibility 和 opacity 來隱藏
                otherSlotElement.style.display = 'flex'; // 確保元素參與佈局
                otherSlotElement.style.visibility = 'visible'; // 暫時保持可見以維持佈局
                otherSlotElement.style.transition = `opacity ${OTHER_ELEMENTS_ANIMATION_DURATION}ms ease-out, transform ${OTHER_ELEMENTS_ANIMATION_DURATION}ms ease-out`;
                otherSlotElement.classList.add('dl-layout__slot--hiding');
                otherSlot.updateMetadata({ isVisible: false });
            }
        });

        // ⭐ 新增：創建佔位元素，防止目標槽位設為絕對定位後其他元素跑位
        const placeholder = document.createElement('div');
        placeholder.className = 'dl-layout__slot-placeholder';
        placeholder.style.width = `${slot._originalRect.width}px`;
        placeholder.style.height = `${slot._originalRect.height}px`;
        placeholder.style.flexBasis = slot._originalFlexBasis;
        placeholder.style.flexGrow = slot._originalFlexGrow;
        placeholder.style.flexShrink = slot._originalFlexShrink;
        placeholder.style.visibility = 'hidden'; // 不可見但佔用空間
        placeholder.style.pointerEvents = 'none';
        placeholder.dataset.placeholderFor = currentSlot.id;

        // 在目標槽位前插入佔位元素
        slot.parentNode.insertBefore(placeholder, slot);

        // 保存佔位元素引用以便後續清理
        slot._placeholder = placeholder;

        // ⭐ 修復：立即將目標槽位設置為絕對定位，避免其他元素變化影響位置
        const containerRect = this.container.getBoundingClientRect();
        slot.style.position = 'absolute';
        slot.style.top = `${slot._originalRect.top - containerRect.top}px`;
        slot.style.left = `${slot._originalRect.left - containerRect.left}px`;
        slot.style.width = `${slot._originalRect.width}px`;
        slot.style.height = `${slot._originalRect.height}px`;
        slot.style.zIndex = '50';
        slot.style.margin = '0';
        slot.style.flexBasis = 'auto';
        slot.style.transitionDelay = '0s';

        // 3. 等待其他元素縮小動畫完成
        setTimeout(() => {
            // 現在才真正隱藏其他槽位和 resize bars
            hiddenSlotsInfo.forEach(slotInfo => {
                if (slotInfo.element && slotInfo.element.isConnected) {
                    slotInfo.element.style.visibility = 'hidden';
                    slotInfo.element.classList.add('dl-layout__slot--hidden');
                }
            });

            allResizeBars.forEach(bar => {
                bar.style.visibility = 'hidden';
            });

            // 設置容器為最大化模式
            this.container.style.gap = '0px';
            this.container.classList.add('dl-layout--maximized');

            // 強制重新計算佈局
            void slot.offsetWidth;

            // 4. 開始最大化動畫
            requestAnimationFrame(() => {
                slot.classList.add('dl-layout__slot--maximized');
            });

            // 標記所有父容器
            let parent = slot.parentElement;
            while (parent && parent !== this.container) {
                if (parent.classList.contains('dl-layout__container')) {
                    parent.classList.add('dl-layout__container--maximized-ancestor');
                }
                parent = parent.parentElement;
            }

            // 5. 動畫完成後的清理
            setTimeout(() => {
                LayoutManager.setIsAnimationInProgress(false);
                // console.log(`✅ 窗格 ${currentSlot.id} 最大化完成`);
            }, MAXIMIZE_ANIMATION_DURATION);

        }, OTHER_ELEMENTS_ANIMATION_DURATION);
    }

    // Add static properties at the top of the class
    static #isAnimationInProgress = false;

    static setIsAnimationInProgress(value) {
        // console.log('%cMANAGER - setIsAnimationInProgress', "background-color: rgba(255,0,0,0.2)");
        LayoutManager.#isAnimationInProgress = value;
    }

    /**
     * 序列化當前布局狀態
     * @returns {Object} 布局狀態對象
     */
    serializeLayout(layoutId) {
        const containerRect = this.container.getBoundingClientRect();

        const state = {
            layoutId: layoutId,
            timestamp: Date.now(),
            container: {
                width: containerRect.width,
                height: containerRect.height,
                clientWidth: this.container.clientWidth,
                clientHeight: this.container.clientHeight
            },
            slots: {},
            containers: {},
            paneAssignments: {},
            options: { ...this.options }
        };

        // 記錄每個槽位的詳細信息
        this.slots.forEach((slot, id) => {
            const slotElement = slot.element;
            const slotRect = slotElement.getBoundingClientRect();
            const slotStyle = getComputedStyle(slotElement);

            // 計算槽位佔用的網格數
            const isVertical = slotElement.parentElement.style.flexDirection === 'row';
            const gridSteps = this.getElementGridSteps(slotElement, isVertical);

            state.slots[id] = {
                flex: slot.flex,
                metadata: { ...slot.metadata },
                dimensions: {
                    width: slotRect.width,
                    height: slotRect.height,
                    left: slotRect.left - containerRect.left,
                    top: slotRect.top - containerRect.top
                },
                style: {
                    flexBasis: slotStyle.flexBasis,
                    flexGrow: slotStyle.flexGrow,
                    flexShrink: slotStyle.flexShrink,
                    display: slotStyle.display
                },
                grid: {
                    steps: gridSteps,
                    isVertical: isVertical
                }
            };

            // 查找該槽位中的 pane，只記錄基本信息
            const pane = slotElement.querySelector('.dl-layout__pane');
            let paneInfo = null;

            if (pane) {
                paneInfo = {
                    id: pane.id,
                    classes: Array.from(pane.classList)
                };
            }

            state.slots[id].pane = paneInfo;

            // 記錄 pane 到 slot 的分配關係
            if (paneInfo) {
                state.paneAssignments[paneInfo.id] = id;
            }
        });

        // 記錄所有嵌套容器的狀態
        this._serializeContainerStates(this.container, state.containers, containerRect);
		// console.log(state);
        return state;
    }

    /**
     * 遞歸序列化容器狀態
     * @private
     * @param {HTMLElement} parentElement - 父元素
     * @param {Object} containersState - 容器狀態對象
     * @param {DOMRect} rootContainerRect - 根容器的邊界矩形
     * @param {string} parentPath - 父路徑（用於生成唯一標識）
     */
    _serializeContainerStates(parentElement, containersState, rootContainerRect, parentPath = '') {
        const containers = parentElement.querySelectorAll('.dl-layout__container');

        containers.forEach((container, index) => {
            // 只處理直接子容器
            if (container.parentElement === parentElement) {
                const containerRect = container.getBoundingClientRect();
                const containerStyle = getComputedStyle(container);
                const structuralPath = this._generateStructuralPath(container);

                // 修正：根據父容器的 flexDirection 來決定使用哪個方向
                const parentFlexDirection = getComputedStyle(container.parentElement).flexDirection;
                const isVertical = parentFlexDirection === 'row';

                // 修正：使用正確的 divisions 來計算網格步數
                const divisions = isVertical ?
                    this.options.hDivisions :
                    this.options.vDivisions;

                // 計算容器實際佔用的空間比例
                const parentRect = container.parentElement.getBoundingClientRect();
                const parentSize = isVertical ? parentRect.width : parentRect.height;
                const containerSize = isVertical ? containerRect.width : containerRect.height;

                // 計算網格步數
                const gridSteps = Math.round((containerSize / parentSize) * divisions);

                containersState[structuralPath] = {
                    originalId: container.id || `${parentPath}container-${index}`,
                    structuralPath: structuralPath,
                    className: container.className,
                    parentPath: parentPath,
                    dimensions: {
                        width: containerRect.width,
                        height: containerRect.height,
                        left: containerRect.left - rootContainerRect.left,
                        top: containerRect.top - rootContainerRect.top
                    },
                    style: {
                        flexBasis: containerStyle.flexBasis,
                        flexGrow: containerStyle.flexGrow,
                        flexShrink: containerStyle.flexShrink,
                        flexDirection: containerStyle.flexDirection,
                        display: containerStyle.display
                    },
                    grid: {
                        steps: gridSteps,
                        isVertical: isVertical,
                        divisions: divisions
                    },
                    hasResizeBars: this._hasResizeBars(container)
                };

                // 設置容器ID以便後續識別
                if (!container.id) {
                    container.id = containersState[structuralPath].originalId;
                }

                // 遞歸處理子容器
                this._serializeContainerStates(container, containersState, rootContainerRect, `${structuralPath}-`);
            }
        });
    }

    /**
     * 恢復布局狀態的詳細信息
     * @private
     * @param {Object} state - 布局狀態對象
     */
    _restoreLayoutState(state) {
        if (!state) return;

        setTimeout(() => {
            // 先恢復容器狀態，因為它們可能會影響槽位的尺寸計算
            if (state.containers.length !== 0) {
                Object.entries(state.containers).forEach(([path, containerState]) => {
                    const container = this._findContainerByStructuralPath(path);
                    if (container && containerState.grid) {
                        // 使用父容器的排列方向來確定是否為垂直
                        const parentFlexDirection = getComputedStyle(container.parentElement).flexDirection;
                        const isVertical = parentFlexDirection === 'row';

                        // 使用網格步數設置大小
                        this.setContainerSizeByGridSteps(
                            container,
                            containerState.grid.steps,
                            isVertical,
                            container.parentElement
                        );

                        // 設置容器方向
                        if (containerState.style.flexDirection) {
                            container.style.flexDirection = containerState.style.flexDirection;
						}
                    }
                });
            }

            // 然後恢復槽位狀態
            if (state.slots) {
                Object.keys(state.slots).forEach(slotId => {
                    const slotState = state.slots[slotId];
                    const slot = this.slots.get(slotId);

                    if (slot && slotState && slotState.grid) {
                        // 使用網格步數設置槽位大小
                        const parentFlexDirection = getComputedStyle(slot.element.parentElement).flexDirection;
                        const isVertical = parentFlexDirection === 'row';

                        this.setElementSizeByGridSteps(
                            slot.element,
                            slotState.grid.steps,
                            isVertical,
                            slot.element.parentElement
                        );

                        // 恢復 metadata
                        if (slotState.metadata) {
                            slot.updateMetadata(slotState.metadata);
                        }
                    }
                });
            }

            // 最後恢復面板分配
            setTimeout(() => {
                if (state.paneAssignments) {
                    this._restorePaneAssignments(state.paneAssignments);
                }

                // 確保所有元素都正確吸附到網格
                this.triggerAllBarsSnap();
            }, 50);

		}, 10);
	}
	
	/**
     * 恢復布局狀態的詳細信息 (不包含paneAssignment)
     * @private
     * @param {Object} state - 布局狀態對象
     */
    _restoreLayoutStateByResize(state) {
        if (!state) return;
        setTimeout(() => {
            // 先恢復容器狀態，因為它們可能會影響槽位的尺寸計算
            if (state.containers.length !== 0) {
                Object.entries(state.containers).forEach(([path, containerState]) => {
                    const container = this._findContainerByStructuralPath(path);
                    if (container && containerState.grid) {
                        // 使用父容器的排列方向來確定是否為垂直
                        const parentFlexDirection = getComputedStyle(container.parentElement).flexDirection;
                        const isVertical = parentFlexDirection === 'row';

                        // 使用網格步數設置大小
                        this.setContainerSizeByGridSteps(
                            container,
                            containerState.grid.steps,
                            isVertical,
                            container.parentElement
                        );

                        // 設置容器方向
                        if (containerState.style.flexDirection) {
                            container.style.flexDirection = containerState.style.flexDirection;
						}
					}
                });
            }

            // 然後恢復槽位狀態
            if (state.slots) {
                Object.keys(state.slots).forEach(slotId => {
                    const slotState = state.slots[slotId];
                    const slot = this.slots.get(slotId);

                    if (slot && slotState && slotState.grid) {
                        // 使用網格步數設置槽位大小
                        const parentFlexDirection = getComputedStyle(slot.element.parentElement).flexDirection;
                        const isVertical = parentFlexDirection === 'row';

                        this.setElementSizeByGridSteps(
                            slot.element,
                            slotState.grid.steps,
                            isVertical,
                            slot.element.parentElement
                        );

                        // 恢復 metadata
                        if (slotState.metadata) {
                            slot.updateMetadata(slotState.metadata);
                        }
                    }
                });
			}
			
            setTimeout(() => {
                // 確保所有元素都正確吸附到網格
                this.triggerAllBarsSnap();
            }, 50);

		}, 10);
    }

    /**
     * 根據結構路徑查找容器
     * @private
     * @param {string} structuralPath - 結構路徑
     * @returns {HTMLElement|null} 找到的容器元素
     */
    _findContainerByStructuralPath(structuralPath) {
        if (structuralPath === 'root-container') {
            return this.container;
        }

        const pathParts = structuralPath.split('-');
        let current = this.container;

        for (let i = 0; i < pathParts.length; i += 2) {
            if (pathParts[i] === 'container' && pathParts[i + 1] !== undefined) {
                const index = parseInt(pathParts[i + 1]);
                const containers = Array.from(current.children).filter(child =>
                    child.classList.contains('dl-layout__container')
                );

                if (index >= 0 && index < containers.length) {
                    current = containers[index];
                } else {
                    console.warn(`容器索引 ${index} 超出範圍，容器數量: ${containers.length}`);
                    return null;
                }
            }
        }

        return current.classList.contains('dl-layout__container') ? current : null;
    }

    /**
     * 恢復 pane 的位置分配
     * @private
     * @param {Object} paneAssignments - pane 分配對象
     */
    _restorePaneAssignments(paneAssignments) {
        // console.log('開始恢復 Pane 位置分配:', paneAssignments);

        // 首先清理所有拖拽狀態
        this._cleanupAllDragStates();

        // ⭐ 修復：確保所有 resize bars 的顯示狀態正確
        const allResizeBars = this.container.querySelectorAll('.dl-resize-bar');
        allResizeBars.forEach(bar => {
            bar.style.display = '';
            bar.style.visibility = 'visible';
            bar.style.opacity = '';
        });

        // 收集所有當前的 pane 元素
        const allPanes = Array.from(this.container.querySelectorAll('.dl-layout__pane'));
        const paneMap = new Map();

        allPanes.forEach(pane => {
            paneMap.set(pane.id, pane);
        });

        // 根據保存的分配關係重新安排 pane
        Object.entries(paneAssignments).forEach(([paneId, targetSlotId]) => {
            const pane = paneMap.get(paneId);
            const targetSlot = this.slots.get(targetSlotId);

            if (pane && targetSlot) {
                const currentSlot = pane.closest('.dl-layout__slot');
                const targetSlotElement = targetSlot.element;

                // 如果 pane 不在正確的 slot 中，進行移動
                if (currentSlot !== targetSlotElement) {
                    // console.log(`移動 pane ${paneId} 從 ${currentSlot?.dataset.slotId || 'unknown'} 到 ${targetSlotId}`);

                    // 移動 pane 到正確的 slot
                    targetSlotElement.appendChild(pane);
                }
            } else {
                if (!pane) {
                    console.warn(`找不到 pane: ${paneId}`);
                }
                if (!targetSlot) {
                    console.warn(`找不到目標 slot: ${targetSlotId}`);
                }
            }
        });

        // 延遲重新初始化所有 pane 的事件監聽器
        setTimeout(() => {
            this._reinitializeAllPaneEvents();
        }, 100);

        // console.log('✅ Pane 位置分配恢復完成');
    }

    /**
     * 清理所有拖拽狀態
     * @private
     */
    _cleanupAllDragStates() {
        // 清理所有拖拽相關的 CSS 類
        const allPanes = this.container.querySelectorAll('.dl-layout__pane');
        allPanes.forEach(pane => {
            pane.classList.remove(
                'dl-layout__pane--dragging',
                'dl-layout__pane--wobbling',
                'dl-layout__pane--drag-over',
                'dl-layout__pane--drag-helper',
                'dl-u-no-transition'
            );
            pane.style.animationDelay = '';
        });

        // 清理所有拖拽輔助元素
        const helpers = document.querySelectorAll('.dl-drag-helper');
        helpers.forEach(helper => {
            if (helper.parentNode) {
                helper.parentNode.removeChild(helper);
            }
        });

        // 重置 LayoutManager 的拖拽狀態
        if (this.draggedPaneElement) {
            this.draggedPaneElement = null;
        }

        // 移除所有拖拽事件監聽器
        document.removeEventListener('drag', this._updateHelperPosition);

        // console.log('🧹 清理所有拖拽狀態完成');
    }

    /**
     * 重新初始化所有 pane 的事件監聽器
     * @private
     */
    _reinitializeAllPaneEvents() {
        const allPanes = this.container.querySelectorAll('.dl-layout__pane');

        // 先收集所有 pane 的引用
        const paneElements = Array.from(allPanes);

        paneElements.forEach((pane, index) => {
            // 移除舊的事件監聽器並獲取新的元素引用
            const newPane = this._removePaneEventListeners(pane);

            // 重新初始化拖拽事件
            this._initializePaneDragEvents(newPane);
        });

        // console.log(`🔄 重新初始化 ${paneElements.length} 個 pane 的事件監聽器`);
    }

    /**
     * 移除 pane 的事件監聽器
     * @private
     * @param {HTMLElement} pane - pane 元素
     */
    _removePaneEventListeners(pane) {
        // 創建新的 pane 元素來替換舊的（這會移除所有事件監聽器）
        const newPane = pane.cloneNode(true);
        pane.parentNode.replaceChild(newPane, pane);
        return newPane;
    }

    /**
     * 檢查容器是否有 resize bars
     * @private
     * @param {HTMLElement} container - 容器元素
     * @returns {boolean} 是否有 resize bars
     */
    _hasResizeBars(container) {
        return container.querySelector('.dl-resize-bar') !== null;
    }

    /**
     * 應用保存的布局狀態
     * @param {Object} state - 布局狀態對象
     */
    applyLayoutState(state, resizeInfo = null) {
        // console.log('%cMANAGER - applyLayoutState', "background-color: rgba(255,0,0,0.2)");
        if (!state || !state.containers || !state.slots) return;

        const applyContainerState = (container, containerState) => {
            if (!container || !containerState) return;

            // 套用容器屬性
            container.style.flexDirection = containerState.direction;
            container.style.flexBasis = containerState.flexProperties.basis;
            container.style.flexGrow = containerState.flexProperties.grow;
            container.style.flexShrink = containerState.flexProperties.shrink;

            // 遍歷並應用子元素狀態
            let childIndex = 0;
            containerState.children.forEach(childState => {
                while (childIndex < container.children.length) {
                    const child = container.children[childIndex];

                    if (childState.type === 'slot' && child.classList.contains('dl-layout__slot')) {
                        const slotState = state.slots[childState.id];
                        if (slotState) {
                            child.style.flexBasis = slotState.flexProperties.basis;
                            child.style.flexGrow = slotState.flexProperties.grow;
                            child.style.flexShrink = slotState.flexProperties.shrink;
                        }
                        childIndex++;
                        break;
                    } else if (childState.type === 'resize-bar' && child.classList.contains('dl-resize-bar')) {
                        childIndex++;
                        break;
                    } else if (child.classList.contains('dl-layout__container')) {
                        applyContainerState(child, childState);
                        childIndex++;
                        break;
                    }
                    childIndex++;
                }
            });
        };

        // 從根容器開始應用狀態
        state.containers.forEach(containerState => {
            applyContainerState(this.container, containerState);
        });
    }

    /**
     * 繪製視覺網格線
     * @private
     * @param {string} lineOrientation - 線條方向 ('vertical' 或 'horizontal')
     * @param {number} divisions - 分割數
     * @param {number} drawingAreaX - 繪製區域 X 座標（像素）
     * @param {number} drawingAreaY - 繪製區域 Y 座標（像素）
     * @param {number} drawingAreaWidth - 緷製區域寬度（像素）
     * @param {number} drawingAreaHeight - 繪製區域高度（像素）
     */
    _drawVisualGridLines(lineOrientation, divisions, drawingAreaX, drawingAreaY, drawingAreaWidth, drawingAreaHeight) {
        // console.log('%cMANAGER - _drawVisualGridLines', "background-color: rgba(255,0,0,0.2)");
        this._clearVisualGridLines();
        let overlay = this.container.querySelector('.dl-layout__grid-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.classList.add('dl-layout__grid-overlay');
            this.container.appendChild(overlay);
        }

        if (lineOrientation === 'vertical') {
            const step = drawingAreaWidth / divisions;
            for (let i = 1; i < divisions; i++) {
                const line = document.createElement('div');
                line.classList.add('dl-layout__grid-line', 'dl-layout__grid-line--vertical');
                line.style.left = `${drawingAreaX + (step * i)}px`;
                line.style.top = `${drawingAreaY}px`;
                line.style.height = `${drawingAreaHeight}px`;
                overlay.appendChild(line);
            }
        } else {
            const step = drawingAreaHeight / divisions;
            for (let i = 1; i < divisions; i++) {
                const line = document.createElement('div');
                line.classList.add('dl-layout__grid-line', 'dl-layout__grid-line--horizontal');
                line.style.top = `${drawingAreaY + (step * i)}px`;
                line.style.left = `${drawingAreaX}px`;
                line.style.width = `${drawingAreaWidth}px`;
                overlay.appendChild(line);
            }
        }

        // console.group(`%cGrid Lines (${lineOrientation}) - Pixel Based`, "background-color: teal; color: white");
        // console.log('Container size:', `${drawingAreaWidth}×${drawingAreaHeight}px`);
        // console.log('Area position:', `${drawingAreaX}px, ${drawingAreaY}px`);
        // console.log('Area size:', `${drawingAreaWidth}×${drawingAreaHeight}px`);
        // console.log('Divisions:', divisions);
        // console.groupEnd();
    }

    /**
     * 清除視覺網格線
     * @private
     */
    _clearVisualGridLines() {
        // console.log('%cMANAGER - _clearVisualGridLines', "background-color: rgba(255,0,0,0.2)");
        const overlay = this.container.querySelector('.dl-layout__grid-overlay');
        if (overlay) {
            // overlay.innerHTML = '';
            // 👈 修改：完全移除 overlay 元素
            if (overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
                // console.log('🗑️ Grid overlay 已移除');
            }
        }
    }

    /**
     * 顯示 resize 時的網格輔助線
     * @private
     * @param {HTMLElement} bar - resize bar 元素
     * @param {HTMLElement} prevEl - 前一個元素
     * @param {HTMLElement} nextEl - 後一個元素
     * @param {boolean} isVertical - 是否為垂直方向
     */
    _showGridLinesForResize(bar, prevEl, nextEl, isVertical) {
        // console.log('%cMANAGER - _showGridLinesForResize', "background-color: rgba(255,0,0,0.2)");
        const parent = prevEl.parentElement;
        if (!parent) return;

        const parentRect = parent.getBoundingClientRect();
        const containerRect = this.container.getBoundingClientRect();

        // 計算相對於主容器的位置
        const drawingAreaX = parentRect.left - containerRect.left;
        const drawingAreaY = parentRect.top - containerRect.top;
        const drawingAreaWidth = parentRect.width;
        const drawingAreaHeight = parentRect.height;

        // 根據方向選擇分割數
        const divisions = isVertical ? this.options.hDivisions : this.options.vDivisions;
        const lineOrientation = isVertical ? 'vertical' : 'horizontal';

        this._drawVisualGridLines(
            lineOrientation,
            divisions,
            drawingAreaX,
            drawingAreaY,
            drawingAreaWidth,
            drawingAreaHeight
        );
    }    /**
     
     /**
     * 吸附到網格線
     * @private
     * @param {HTMLElement} bar - resize bar 元素
     * @param {HTMLElement} prevEl - 前一個元素
     * @param {HTMLElement} nextEl - 後一個元素
     * @param {boolean} isVertical - 是否為垂直方向
     */
    _snapToGrid(bar, prevEl, nextEl, isVertical) {
        // console.log('%cMANAGER - _snapToGrid', "background-color: rgba(255,0,0,0.2)");
        const parent = bar.parentElement;
        const parentRect = parent.getBoundingClientRect();
        const barRect = bar.getBoundingClientRect();
        const parentSize = isVertical ? parentRect.width : parentRect.height;
        const barSize = this.options.barSize || 8;
        const gap = this.options.gap || 0;
        const divisions = isVertical ? this.options.hDivisions : this.options.vDivisions;
        const gridStep = parentSize / divisions;

        // 計算 bar 的實際位置，需要考慮以下因素：
        // 1. gap的一半（因為每個元素兩側都有一半的gap）
        // 2. resize bar的一半寬度（因為我們要讓bar的中心對齊網格線）
        const barPos = isVertical ?
            (barRect.left - parentRect.left + (gap / 2) + (barSize / 2)) :
            (barRect.top - parentRect.top + (gap / 2) + (barSize / 2));

        // 對齊到最近的網格線
        const snappedBarPos = Math.round(barPos / gridStep) * gridStep;

        // 獲取前一個元素的起始位置，也需要考慮 gap
        const prevRect = prevEl.getBoundingClientRect();
        const prevStart = isVertical ?
            (prevRect.left - parentRect.left + gap / 2) :
            (prevRect.top - parentRect.top + gap / 2);

        // 計算新的大小，需要考慮 gap 和 bar 的寬度
        let snappedPrevSize = snappedBarPos - prevStart - (barSize / 2) - (gap / 2);

        // 獲取當前的總大小
        const prevStyle = getComputedStyle(prevEl);
        const nextStyle = getComputedStyle(nextEl);
        let rawPrevSize = isVertical ? parseFloat(prevStyle.width) : parseFloat(prevStyle.height);
        let rawNextSize = isVertical ? parseFloat(nextStyle.width) : parseFloat(nextStyle.height);
        const totalSize = rawPrevSize + rawNextSize;

        // 應用最小大小限制
        const minSize = this.options.minSlotSize || 50;
        snappedPrevSize = Math.max(minSize, snappedPrevSize);
        snappedPrevSize = Math.min(totalSize - minSize, snappedPrevSize);
        let snappedNextSize = totalSize - snappedPrevSize;

        // 確保下一個元素也符合最小大小要求
        if (snappedNextSize < minSize) {
            snappedNextSize = minSize;
            snappedPrevSize = totalSize - snappedNextSize;
        }

        // 轉換為百分比
        const snappedPrevPercent = (snappedPrevSize / parentSize) * 100;
        const snappedNextPercent = (snappedNextSize / parentSize) * 100;

        // 應用新的大小，使用百分比
        prevEl.style.flexBasis = `${snappedPrevPercent.toFixed(2)}%`;
        prevEl.style.flexGrow = '0';
        prevEl.style.flexShrink = '0';

        nextEl.style.flexBasis = `${snappedNextPercent.toFixed(2)}%`;
        nextEl.style.flexGrow = '0';
        nextEl.style.flexShrink = '0';

        // console.group('%cGrid Snap - Percentage Based', "background-color: teal; color: white");
        // console.log('Raw Bar position:', `${barPos}px`);
        // console.log('Gap size:', `${gap}px`);
        // console.log('Bar size:', `${barSize}px`);
        // console.log('Snapped position:', `${snappedBarPos}px`);
        // console.log('Grid step:', `${gridStep}px`);
        // console.log('Previous element:', `${snappedPrevPercent.toFixed(2)}%`);
        // console.log('Next element:', `${snappedNextPercent.toFixed(2)}%`);
        // console.log('Total:', `${(snappedPrevPercent + snappedNextPercent).toFixed(2)}%`);
        // console.groupEnd();
    }

    /**
     * 觸發所有 resize bar 的網格吸附
     * @private
     */
    _snapAllResizeBars() {
        // console.log('%cMANAGER - _snapAllResizeBars', "background-color: rgba(255,0,0,0.2)");
        const resizeBars = this.container.querySelectorAll('.dl-resize-bar');
        resizeBars.forEach(bar => {
            const prevEl = bar.previousElementSibling;
            const nextEl = bar.nextElementSibling;
            const isVertical = bar.classList.contains('dl-resize-bar--vertical');

            if (prevEl && nextEl) {
                // 移除任何之前的轉場效果
                prevEl.classList.add('dl-u-no-transition');
                nextEl.classList.add('dl-u-no-transition');

                this._snapToGrid(bar, prevEl, nextEl, isVertical);

                // 重新啟用轉場效果
                setTimeout(() => {
                    prevEl.classList.remove('dl-u-no-transition');
                    nextEl.classList.remove('dl-u-no-transition');
                }, 0);
            }
        });
    }

    /**
     * 手動觸發所有 resize bar 的網格吸附
     * @public
     */
    triggerAllBarsSnap() {
        // console.log('%cMANAGER - triggerAllBarsSnap', "background-color: rgba(255,0,0,0.2)");
        this._snapAllResizeBars();
    }

    /**
     * 根據網格步長設置元素的 flex-basis
     * @param {HTMLElement} element - 要設置的元素
     * @param {number} gridSteps - 佔用的網格步長數
     * @param {boolean} isVertical - 是否為垂直方向（用於確定使用哪個分割數）
     * @param {HTMLElement} parent - 父容器（可選，默認使用元素的父容器）
     * @returns {number} 實際設置的百分比值
     */
    setElementSizeByGridSteps(element, gridSteps, isVertical, parent = null) {
        // console.log('%cMANAGER - setElementSizeByGridSteps', "background-color: rgba(255,0,0,0.2)");
        const parentEl = parent || element.parentElement;
        if (!parentEl) {
            console.warn('無法找到父容器');
            return 0;
        }

        // 計算可用空間（扣除 gap 和 resize bar）
        const parentRect = parentEl.getBoundingClientRect();
        const totalSize = isVertical ? parentRect.width : parentRect.height;

        // 計算 gap 和 resize bar 的總大小
        const numberOfGaps = parentEl.children.length - 1;
        const gapSize = this.options.gap;
        const barSize = 8; // resize bar 的大小

        // 計算 resize bar 的數量
        const resizeBars = parentEl.querySelectorAll('.dl-resize-bar');
        const numberOfBars = resizeBars.length;

        // 計算總間隔大小
        const totalGapSize = (numberOfGaps * gapSize);
        const totalBarSize = (numberOfBars * barSize);

        // 實際可用空間
        const availableSize = totalSize - totalGapSize - totalBarSize;

        // 檢查可用空間是否足夠
        if (availableSize <= 0) {
            console.warn('可用空間不足');
            return 0;
        }

        const divisions = isVertical ? this.options.hDivisions : this.options.vDivisions;

        // 根據網格步數計算百分比（基於可用空間）
        const percentage = (gridSteps / divisions) * 100;

        // 將百分比轉換為實際大小（考慮間隔）
        const actualSize = (availableSize * (percentage / 100));

        // 將實際大小轉換回相對於總空間的百分比
        const adjustedPercentage = (actualSize / totalSize) * 100;

        // 設置 flex 屬性
        element.style.flexBasis = `${adjustedPercentage.toFixed(2)}%`;
        element.style.flexGrow = '0';
        element.style.flexShrink = '0';

        // console.log(`%cSet Grid Size`, "background-color: purple; color: white",
        //     `Element: ${element.className}`,
        //     `\nGrid Steps: ${gridSteps}/${divisions}`,
        //     `\nTotal Size: ${totalSize}px`,
        //     `\nAvailable Size: ${availableSize}px`,
        //     `\nGaps: ${numberOfGaps} (${totalGapSize}px)`,
        //     `\nBars: ${numberOfBars} (${totalBarSize}px)`,
        //     `\nRaw percentage: ${percentage}%`,
        //     `\nAdjusted percentage: ${adjustedPercentage}%`
        // );

        return adjustedPercentage;
    }

    /**
	 * 設置容器大小（修正版本）
	 * @param {HTMLElement} container - 容器元素
	 * @param {number} gridSteps - 佔用的網格步長數
	 * @param {boolean} isVertical - 是否為垂直方向
	 * @param {HTMLElement} parent - 父容器（可選，默認使用元素的父容器）
	 * @returns {number} 實際設置的百分比值
	 */
	setContainerSizeByGridSteps(container, gridSteps, isVertical, parent = null) {
    const parentEl = parent || container.parentElement;
    if (!parentEl) {
      console.warn("無法找到父容器");
      return 0;
    }

    // 計算可用空間（扣除 gap 和 resize bar）
    const parentRect = parentEl.getBoundingClientRect();
    const totalSize = isVertical ? parentRect.width : parentRect.height;

    // 計算 gap 和 resize bar 的總大小
    const numberOfGaps = parentEl.children.length - 1;
    const gapSize = this.options.gap;
    const barSize = 8; // resize bar 的大小

    // ⭐ 修正：只計算直接子元素中的 resize bar
    const numberOfBars = Array.from(parentEl.children).filter((child) =>
      child.classList.contains("dl-resize-bar")
    ).length;

    // 計算總間隔大小
    const totalGapSize = numberOfGaps * gapSize;
    const totalBarSize = numberOfBars * barSize;

    // 實際可用空間
    const availableSize = totalSize - totalGapSize - totalBarSize;

    // 檢查可用空間是否足夠
    if (availableSize <= 0) {
      console.warn("可用空間不足");
      return 0;
    }

    const divisions = isVertical
      ? this.options.hDivisions
      : this.options.vDivisions;

    // 根據網格步數計算百分比（基於可用空間）
    const percentage = (gridSteps / divisions) * 100;

    // 將百分比轉換為實際大小（考慮間隔）
    const actualSize = availableSize * (percentage / 100);

    // 將實際大小轉換回相對於總空間的百分比
    const adjustedPercentage = (actualSize / totalSize) * 100;

    // 設置 flex 屬性
    container.style.flexBasis = `${adjustedPercentage.toFixed(2)}%`;
    container.style.flexGrow = "0";
    container.style.flexShrink = "0";

    // console.log(
    //   `%cSet Container Grid Size`,
    //   "background-color: purple; color: white",
    //   `Container: ${container.className}`,
    //   `\nGrid Steps: ${gridSteps}/${divisions}`,
    //   `\nTotal Size: ${totalSize}px`,
    //   `\nAvailable Size: ${availableSize}px`,
    //   `\nGaps: ${numberOfGaps} (${totalGapSize}px)`,
    //   `\nBars: ${numberOfBars} (${totalBarSize}px)`,
    //   `\nRaw percentage: ${percentage}%`,
    //   `\nAdjusted percentage: ${adjustedPercentage}%`
    // );

    return adjustedPercentage;
  }

    /**
     * 計算元素當前佔用的網格步長數
     * @param {HTMLElement} element - 要計算的元素
     * @param {boolean} isVertical - 是否為垂直方向
     * @param {HTMLElement} parent - 父容器（可選）
     * @returns {number} 佔用的網格步長數
     */
    getElementGridSteps(element, isVertical, parent = null) {
        // console.log('%cMANAGER - getElementGridSteps', "background-color: rgba(255,0,0,0.2)");
        const parentEl = parent || element.parentElement;
        if (!parentEl) return 0;

        const parentRect = parentEl.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();
        const parentSize = isVertical ? parentRect.width : parentRect.height;
        const elementSize = isVertical ? elementRect.width : elementRect.height;

        const divisions = isVertical ? this.options.hDivisions : this.options.vDivisions;
        const gridStep = parentSize / divisions;

        return Math.round(elementSize / gridStep);
    }

    /**
     * 設置相鄰兩個元素的網格配置
     * @param {HTMLElement} prevEl - 前一個元素
     * @param {HTMLElement} nextEl - 後一個元素
     * @param {number} prevSteps - 前一個元素的網格步長
     * @param {number} nextSteps - 後一個元素的網格步長
     * @param {boolean} isVertical - 是否為垂直方向
     * @returns {Object} 包含設置結果的對象
     */
    setAdjacentElementsGridSize(prevEl, nextEl, prevSteps, nextSteps, isVertical) {
        // console.log('%cMANAGER - setAdjacentElementsGridSize', "background-color: rgba(255,0,0,0.2)");
        const divisions = isVertical ? this.options.hDivisions : this.options.vDivisions;

        // 驗證總步長不超過分割數
        if (prevSteps + nextSteps > divisions) {
            console.warn(`總網格步長 (${prevSteps + nextSteps}) 超過可用分割數 (${divisions})`);
            // 按比例調整
            const ratio = divisions / (prevSteps + nextSteps);
            prevSteps = Math.round(prevSteps * ratio);
            nextSteps = divisions - prevSteps;
        }

        const prevPercentage = this.setElementSizeByGridSteps(prevEl, prevSteps, isVertical);
        const nextPercentage = this.setElementSizeByGridSteps(nextEl, nextSteps, isVertical);

        return {
            prevSteps,
            nextSteps,
            prevPercentage,
            nextPercentage,
            totalSteps: prevSteps + nextSteps,
            totalPercentage: prevPercentage + nextPercentage
        };
    }

    /**
     * 獲取容器內所有元素的網格配置
     * @param {HTMLElement} container - 容器元素
     * @param {boolean} isVertical - 是否為垂直方向
     * @returns {Array} 包含所有元素網格配置的數組
     */
    getContainerGridLayout(container, isVertical) {
        // console.log('%cMANAGER - getContainerGridLayout', "background-color: rgba(255,0,0,0.2)");
        const children = Array.from(container.children).filter(child =>
            !child.classList.contains('dl-resize-bar') &&
            !child.classList.contains('dl-layout__grid-overlay')
        );

        return children.map(child => ({
            element: child,
            id: child.dataset.slotId || child.id || 'unnamed',
            className: child.className,
            gridSteps: this.getElementGridSteps(child, isVertical, container),
            percentage: parseFloat(getComputedStyle(child).flexBasis) || 0
        }));
    }

    /**
     * 應用完整的網格布局配置
     * @param {HTMLElement} container - 容器元素
     * @param {Array} gridConfig - 網格配置數組 [{id, gridSteps}, ...]
     * @param {boolean} isVertical - 是否為垂直方向
     * @returns {boolean} 是否成功應用配置
     */
    applyGridLayout(container, gridConfig, isVertical) {
        // console.log('%cMANAGER - applyGridLayout', "background-color: rgba(255,0,0,0.2)");
        const divisions = isVertical ? this.options.hDivisions : this.options.vDivisions;
        const totalSteps = gridConfig.reduce((sum, config) => sum + config.gridSteps, 0);

        if (totalSteps > divisions) {
            console.warn(`總網格步長 (${totalSteps}) 超過可用分割數 (${divisions})`);
            return false;
        }

        let success = true;
        gridConfig.forEach(config => {
            const element = container.querySelector(`[data-slot-id="${config.id}"], #${config.id}`);
            if (element) {
                this.setElementSizeByGridSteps(element, config.gridSteps, isVertical, container);
            } else {
                console.warn(`找不到 ID 為 ${config.id} 的元素`);
                success = false;
            }
        });

        return success;
    }

    /**
     * 從 JSON 字符串恢復布局
     * @param {string} jsonString - JSON 格式的布局配置字符串
     * @returns {boolean} 是否成功恢復
     */
    restoreFromJsonString(jsonString) {
        // console.log('%cMANAGER - restoreFromJsonString', "background-color: rgba(255,0,0,0.2)");
        try {
            const layoutConfig = JSON.parse(jsonString);
            return this._restoreLayoutState(layoutConfig);
        } catch (error) {
            console.error('解析 JSON 失敗:', error);
            return false;
        }
    }

    /**
     * 獲取用戶保存的布局列表
     * @returns {Array} 已保存的布局列表
     */
    getSavedLayouts() {
        // console.log('%cMANAGER - getSavedLayouts', "background-color: rgba(255,0,0,0.2)");
        try {
            const saved = localStorage.getItem('layoutManager.savedLayouts');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('讀取已保存布局失敗:', error);
            return [];
        }
    }

    /**
     * 保存布局到本地存儲
     * @param {Object} layout - 布局配置
     * @returns {boolean} 是否保存成功
     */
    saveSavedLayout(layout) {
        // console.log('%cMANAGER - saveSavedLayout', "background-color: rgba(255,0,0,0.2)");
        try {
            const savedLayouts = this.getSavedLayouts();
            savedLayouts.push(layout);
            localStorage.setItem('layoutManager.savedLayouts', JSON.stringify(savedLayouts));
            return true;
        } catch (error) {
            console.error('保存布局失敗:', error);
            return false;
        }
    }

    /**
     * 刪除已保存的布局
     * @param {number} index - 要刪除的布局索引
     * @returns {boolean} 是否刪除成功
     */
    deleteSavedLayout(index) {
        // console.log('%cMANAGER - deleteSavedLayout', "background-color: rgba(255,0,0,0.2)");
        try {
            const savedLayouts = this.getSavedLayouts();
            if (index >= 0 && index < savedLayouts.length) {
                savedLayouts.splice(index, 1);
                localStorage.setItem('layoutManager.savedLayouts', JSON.stringify(savedLayouts));
                return true;
            }
            return false;
        } catch (error) {
            console.error('刪除布局失敗:', error);
            return false;
        }
    }

    /**
     * 清除所有已保存的布局
     * @returns {boolean} 是否清除成功
     */
    clearSavedLayouts() {
        // console.log('%cMANAGER - deletclearSavedLayoutseSavedLayout', "background-color: rgba(255,0,0,0.2)");
        try {
            localStorage.removeItem('layoutManager.savedLayouts');
            return true;
        } catch (error) {
            console.error('清除布局失敗:', error);
            return false;
        }
    }

    /**
     * 驗證布局配置的有效性
     * @param {Object} layoutConfig - 要驗證的布局配置
     * @returns {Object} 驗證結果 {isValid: boolean, errors: Array}
     */
    validateLayoutConfig(layoutConfig) {
        // console.log('%cMANAGER - validateLayoutConfig', "background-color: rgba(255,0,0,0.2)");
        const errors = [];

        if (!layoutConfig) {
            errors.push('布局配置為空');
            return { isValid: false, errors };
        }

        if (!layoutConfig.definition) {
            errors.push('缺少布局定義');
        }

        if (!layoutConfig.version) {
            errors.push('缺少版本信息');
        }

        // 驗證布局定義結構
        if (layoutConfig.definition) {
            const validateItems = (items, level = 0) => {
                if (!Array.isArray(items)) {
                    errors.push(`第 ${level} 層的 items 不是數組`);
                    return;
                }

                items.forEach((item, index) => {
                    if (!item.type) {
                        errors.push(`第 ${level} 層第 ${index} 項缺少 type 屬性`);
                    }

                    if (item.type === 'slot' && !item.id) {
                        errors.push(`第 ${level} 層第 ${index} 項槽位缺少 id`);
                    }

                    if (item.type === 'container' && item.items) {
                        validateItems(item.items, level + 1);
                    }
                });
            };

            validateItems(layoutConfig.definition.items);
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
    /**
     * 生成基於DOM結構的穩定路徑
     * @private
     * @param {HTMLElement} element - 容器元素
     * @returns {string} 結構路徑
     */
    _generateStructuralPath(element) {
        const path = [];
        let current = element;

        while (current && current !== this.container) {
            const parent = current.parentElement;
            if (parent) {
                const siblings = Array.from(parent.children).filter(child =>
                    child.classList.contains('dl-layout__container')
                );
                const index = siblings.indexOf(current);
                path.unshift(`container-${index}`);
            }
            current = parent;
        }

        return path.join('-') || 'root-container';
    }
}
