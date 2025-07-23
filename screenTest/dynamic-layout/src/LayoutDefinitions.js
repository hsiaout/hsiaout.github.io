/**
 * 預設布局定義
 * 包含所有標準布局配置
 */
export const LayoutDefinitions = {
    // 1. 單視窗
    '1': {
        direction: 'row',
        items: [
            { type: 'slot', id: 'slot1', order: 1,  flex: '1', defaultContent: {title: 'TITLE', content: ''} }
        ]
    },

    // 2. 左右雙視窗
    '2': {
        direction: 'row',
        items: [
            { type: 'slot', id: 'slot1', order: 1, flex: '1', defaultContent: {title: 'TITLE_1', content: '1'} },
            { type: 'resize-bar', orientation: 'vertical' },
            { type: 'slot', id: 'slot2', order: 2, flex: '1', defaultContent: {title: 'TITLE_2', content: '2'} }
        ]
    },

    // 3. 上二下一
    '3': {
        direction: 'column',
        items: [
            {
                type: 'container',
                id: 'topRow',
                direction: 'row',
                flex: '1',
                items: [
                    { type: 'slot', id: 'slot1', order: 1, flex: '1' },
                    { type: 'resize-bar', orientation: 'vertical' },
                    { type: 'slot', id: 'slot2', order: 2, flex: '1' }
                ]
            },
            { type: 'resize-bar', orientation: 'horizontal' },
            { type: 'slot', id: 'slot3', order: 3, flex: '1' }
        ]
    },

    // 4. 上一下二
    '4': {
        direction: 'column',
        items: [
            { type: 'slot', id: 'slot1', order: 1, flex: '1' },
            { type: 'resize-bar', orientation: 'horizontal' },
            {
                type: 'container',
                id: 'bottomRow',
                direction: 'row',
                flex: '1',
                items: [
                    { type: 'slot', id: 'slot2', order: 2, flex: '1' },
                    { type: 'resize-bar', orientation: 'vertical' },
                    { type: 'slot', id: 'slot3', order: 3, flex: '1' }
                ]
            }
        ]
    },

    // 5. 左一右二
    '5': {
        direction: 'row',
        items: [
            { type: 'slot', id: 'slot1', order: 1, flex: '1' },
            { type: 'resize-bar', orientation: 'vertical' },
            {
                type: 'container',
                id: 'rightCol',
                direction: 'column',
                flex: '1',
                items: [
                    { type: 'slot', id: 'slot2', order: 2, flex: '1' },
                    { type: 'resize-bar', orientation: 'horizontal' },
                    { type: 'slot', id: 'slot3', order: 3, flex: '1' }
                ]
            }
        ]
    },

    // 6. 左二右一
    '6': {
        direction: 'row',
        items: [
            {
                type: 'container',
                id: 'leftCol',
                direction: 'column',
                flex: '1',
                items: [
                    { type: 'slot', id: 'slot1', order: 1, flex: '1' },
                    { type: 'resize-bar', orientation: 'horizontal' },
                    { type: 'slot', id: 'slot2', order: 2, flex: '1' }
                ]
            },
            { type: 'resize-bar', orientation: 'vertical' },
            { type: 'slot', id: 'slot3', order: 3, flex: '1' }
        ]
    },

    // 7. 四宮格
    '7': {
        direction: 'column',
        items: [
            {
                type: 'container',
                id: 'row1',
                direction: 'row',
                flex: '1',
                items: [
                    { type: 'slot', id: 'slot1', order: 1, flex: '1' },
                    { type: 'resize-bar', orientation: 'vertical' },
                    { type: 'slot', id: 'slot2', order: 2, flex: '1' }
                ]
            },
            { type: 'resize-bar', orientation: 'horizontal' },
            {
                type: 'container',
                id: 'row2',
                direction: 'row',
                flex: '1',
                items: [
                    { type: 'slot', id: 'slot3', order: 3, flex: '1' },
                    { type: 'resize-bar', orientation: 'vertical' },
                    { type: 'slot', id: 'slot4', order: 4, flex: '1' }
                ]
            }
        ]
    },

    // 8. 六視窗 (3x2)
    '8': {
        direction: 'column',
        items: [
            {
                type: 'container',
                id: 'row1',
                direction: 'row',
                flex: '1',
                items: [
                    { type: 'slot', id: 'slot1', order: 1, flex: '1' },
                    { type: 'resize-bar', orientation: 'vertical' },
                    { type: 'slot', id: 'slot2', order: 2, flex: '1' },
                    { type: 'resize-bar', orientation: 'vertical' },
                    { type: 'slot', id: 'slot3', order: 3, flex: '1' }
                ]
            },
            { type: 'resize-bar', orientation: 'horizontal' },
            {
                type: 'container',
                id: 'row2',
                direction: 'row',
                flex: '1',
                items: [
                    { type: 'slot', id: 'slot4', order: 4, flex: '1' },
                    { type: 'resize-bar', orientation: 'vertical' },
                    { type: 'slot', id: 'slot5', order: 5, flex: '1' },
                    { type: 'resize-bar', orientation: 'vertical' },
                    { type: 'slot', id: 'slot6', order: 6, flex: '1' }
                ]
            }
        ]
    },

    // 9. 九宮格 (3x3)
    '9': {
        direction: 'column',
        items: [
            {
                type: 'container',
                id: 'row1',
                direction: 'row',
                flex: '1',
                items: [
                    { type: 'slot', id: 'slot1', order: 1, flex: '1' },
                    { type: 'resize-bar', orientation: 'vertical' },
                    { type: 'slot', id: 'slot2', order: 2, flex: '1' },
                    { type: 'resize-bar', orientation: 'vertical' },
                    { type: 'slot', id: 'slot3', order: 3, flex: '1' }
                ]
            },
            { type: 'resize-bar', orientation: 'horizontal' },
            {
                type: 'container',
                id: 'row2',
                direction: 'row',
                flex: '1',
                items: [
                    { type: 'slot', id: 'slot4', order: 4, flex: '1' },
                    { type: 'resize-bar', orientation: 'vertical' },
                    { type: 'slot', id: 'slot5', order: 5, flex: '1' },
                    { type: 'resize-bar', orientation: 'vertical' },
                    { type: 'slot', id: 'slot6', order: 6, flex: '1' }
                ]
            },
            { type: 'resize-bar', orientation: 'horizontal' },
            {
                type: 'container',
                id: 'row3',
                direction: 'row',
                flex: '1',
                items: [
                    { type: 'slot', id: 'slot7', order: 7, flex: '1' },
                    { type: 'resize-bar', orientation: 'vertical' },
                    { type: 'slot', id: 'slot8', order: 8, flex: '1' },
                    { type: 'resize-bar', orientation: 'vertical' },
                    { type: 'slot', id: 'slot9', order: 9, flex: '1' }
                ]
            }
        ]
    },

    // 10. 上中下三視窗
    '10': {
        direction: 'column',
        items: [
            { type: 'slot', id: 'slot1', order: 1, flex: '1' },
            { type: 'resize-bar', orientation: 'horizontal' },
            { type: 'slot', id: 'slot2', order: 2, flex: '1' },
            { type: 'resize-bar', orientation: 'horizontal' },
            { type: 'slot', id: 'slot3', order: 3, flex: '1' }
        ]
    },

    // 11. 左中右三視窗
    '11': {
        direction: 'row',
        items: [
            { type: 'slot', id: 'slot1', order: 1, flex: '1' },
            { type: 'resize-bar', orientation: 'vertical' },
            { type: 'slot', id: 'slot2', order: 2, flex: '1' },
            { type: 'resize-bar', orientation: 'vertical' },
            { type: 'slot', id: 'slot3', order: 2, flex: '1' }
        ]
    }
};

/**
 * 獲取指定的布局定義
 * @param {string|number} layoutId - 布局 ID
 * @returns {Object|null} 布局定義對象
 */
export function getLayoutDefinition(layoutId) {
    return LayoutDefinitions[String(layoutId)] || null;
}

/**
 * 獲取所有可用的布局 ID
 * @returns {string[]} 布局 ID 數組
 */
export function getAvailableLayouts() {
    return Object.keys(LayoutDefinitions);
}

/**
 * 檢查指定的布局是否存在
 * @param {string|number} layoutId - 布局 ID
 * @returns {boolean} 是否存在
 */
export function hasLayout(layoutId) {
    return String(layoutId) in LayoutDefinitions;
}
