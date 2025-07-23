import { LayoutPlugin } from "./src/LayoutPlugin.js";

// 創建變數
let layoutPlugin;
let savedLayoutState = null;

// 初始化
document.addEventListener("DOMContentLoaded", () => {
	try {
		layoutPlugin = new LayoutPlugin("main-layout-container", {
			gap: 4,
			minSlotSize: 50,
			hDivisions: 6,
			vDivisions: 6,
		});

		// 初始化布局
		applyLayout(9);

		// 等待布局完成後添加內容
		setTimeout(() => {
			const paneIds = ['pane1', 'pane2'];

			paneIds.forEach(paneId => {
				const content = document.createElement('div');
				content.classList.add('dl-card');
				content.innerHTML = `
					<div class="dl-card__header" data-no-drag>
						<h3>Panel ${paneId}</h3>
						<button class="maximize-btn fa-solid fa-maximize" data-slot-id="${paneId}"></button>
					</div>
					<div class="dl-card__content">
						<p>This is content for ${paneId}</p>
					</div>
				`;

				layoutPlugin.setPaneContent(paneId, content);
			});

		}, 100);

		$("#main-layout-container").on('click', '.maximize-btn', function (event) {
        	const paneId = $(event.currentTarget).parents(".dl-layout__slot").attr("id");
        	toggleMaximize(paneId);
    	});

		// 監聽最大化/恢復事件
		layoutPlugin.on('slotMaximized', (e) => {
			// 更新按鈕狀態
			const btn = document.querySelector(`[data-pane-id="${e.detail.paneId}"] .maximize-btn`);
			if (btn) {btn.classList.remove('fa-maximize'); btn.classList.add('fa-minimize')}
		});

		layoutPlugin.on('slotRestored', (e) => {
			// 更新按鈕狀態
			const btn = document.querySelector(`[data-pane-id="${e.detail.paneId}"] .maximize-btn`);
			if (btn) {btn.classList.remove('fa-minimize'); btn.classList.add('fa-maximize')}
		});

	} catch (error) {
		console.error(`初始化失敗: ${error.message}`);
	}
});

// 切換布局
window.applyLayout = function (layoutId) {
	layoutId = layoutId || 1;
	const success = layoutPlugin.switchLayout(layoutId);
	console.log(`切換到布局 ${layoutId}: ${success ? "成功" : "失敗"}`);

	// 觸發所有 resize bar 吸附
	setTimeout(() => {
		layoutPlugin.triggerAllBarsSnap();
	}, 10);
};

window.updateGridSettings = function (hDivisions, vDivisions) {

	layoutPlugin.updateOptions({
		hDivisions: hDivisions,
		vDivisions: vDivisions,
	});

	console.log(`網格設定更新: ${hDivisions}x${vDivisions}`);

	// 觸發所有 resize bar 吸附
	setTimeout(() => {
		layoutPlugin.triggerAllBarsSnap();
	}, 10);

	// 如果調試格線開啟，更新格線顯示
	if (layoutPlugin.debugGrid) {
		layoutPlugin.toggleDebugGrid(true);
		console.log(`🔍 調試格線已更新為 ${hDivisions}x${vDivisions}`);
	}
};

window.toggleDebugGrid = function (isEnabled) {
	layoutPlugin.debugGrid = isEnabled;
	layoutPlugin.toggleDebugGrid(layoutPlugin.debugGrid);
	console.log(layoutPlugin.debugGrid ? "🔍 調試格線已開啟" : "🔍 調試格線已關閉");
};


// 測試最大化功能
window.testMaximizeSlot = function (slotId) {
	layoutPlugin.maximizeSlot(slotId);
};

// 測試最小化功能
window.testMinimizeSlot = function (slotId) {
	const slot = layoutPlugin.manager.slots.get(slotId);
	if (!slot || !slot.metadata.isMaximized) {
		layoutPlugin.minimizeSlot(slotId);
		console.warn(`⚠️ 槽位 ${slotId} 未處於最大化狀態`);
		return;
	}
};

// 測試切換最大化功能
window.testToggleMaximize = function (slotId) {
	layoutPlugin.toggleMaximize(slotId);
};

// 儲存佈局狀態
window.saveLayout = function () {
	savedLayoutState = layoutPlugin.serializeLayout();
};

// 恢復佈局狀態
window.restoreLayout = function () {
	layoutPlugin.restoreLayout(savedLayoutState);
};

// 顯示當前佈局信息
window.showLayoutInfo = function () {
	const currentLayout = layoutPlugin.getCurrentLayout();
	const availableLayouts = layoutPlugin.getAvailableLayouts();
	const allSlots = layoutPlugin.getAllSlots();

	// 獲取詳細的布局信息
	const currentState = layoutPlugin.serializeLayout();

	const info = {
		當前布局: currentLayout,
		可用布局: availableLayouts,
		槽數量: Object.keys(allSlots).length,
		槽列表: Object.keys(allSlots),
		容器尺寸: currentState.container,
		嵌套容器數量: Object.keys(currentState.containers || {}).length,
		嵌套容器列表: Object.keys(currentState.containers || {}),
		Pane分配: currentState.paneAssignments,
	};

	console.log("📊 當前布局詳細信息:");
	console.log(JSON.stringify(info, null, 2));

};
