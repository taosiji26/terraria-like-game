// 物品栏 / 背包系统
class Inventory {
    constructor(size = CONFIG.HOTBAR_SIZE) {
        this.size = size;
        this.slots = new Array(size).fill(null); // 每格: {item, count} 或 null
        this.selected = 0; // 当前选中格
    }

    // 获取当前选中格
    getSelected() {
        return this.slots[this.selected];
    }

    // 选中格 index
    select(index) {
        if (index >= 0 && index < this.size) {
            this.selected = index;
        }
    }

    // 滚动切换
    scroll(dir) {
        this.selected = (this.selected + dir + this.size) % this.size;
    }

    // 添加物品，返回剩余未添加数量
    addItem(itemId, count = 1) {
        const data = getItemData(itemId);
        if (!data) return count;

        // 先尝试堆叠到已有格子
        if (data.stackable) {
            for (let i = 0; i < this.size && count > 0; i++) {
                const s = this.slots[i];
                if (s && s.item === itemId && s.count < CONFIG.INVENTORY_STACK_MAX) {
                    const canAdd = Math.min(CONFIG.INVENTORY_STACK_MAX - s.count, count);
                    s.count += canAdd;
                    count -= canAdd;
                }
            }
        }

        // 再放到空格子
        for (let i = 0; i < this.size && count > 0; i++) {
            if (!this.slots[i]) {
                const canAdd = Math.min(CONFIG.INVENTORY_STACK_MAX, count);
                this.slots[i] = { item: itemId, count: canAdd };
                count -= canAdd;
            }
        }

        return count; // 返回没放下的数量
    }

    // 检查是否有足够的某物品
    hasItem(itemId, count = 1) {
        let total = 0;
        for (const s of this.slots) {
            if (s && s.item === itemId) total += s.count;
        }
        return total >= count;
    }

    // 统计某物品总数
    countItem(itemId) {
        let total = 0;
        for (const s of this.slots) {
            if (s && s.item === itemId) total += s.count;
        }
        return total;
    }

    // 消耗物品
    removeItem(itemId, count = 1) {
        for (let i = 0; i < this.size && count > 0; i++) {
            const s = this.slots[i];
            if (s && s.item === itemId) {
                const take = Math.min(s.count, count);
                s.count -= take;
                count -= take;
                if (s.count <= 0) this.slots[i] = null;
            }
        }
        return count === 0;
    }

    // 从选中格消耗1个
    consumeSelected() {
        const s = this.slots[this.selected];
        if (!s) return null;
        const item = s.item;
        s.count--;
        if (s.count <= 0) this.slots[this.selected] = null;
        return item;
    }

    // 检查能否制作某配方
    canCraft(recipe) {
        for (const c of recipe.cost) {
            if (!this.hasItem(c.item, c.count)) return false;
        }
        return true;
    }

    // 执行制作
    craft(recipe) {
        if (!this.canCraft(recipe)) return false;
        for (const c of recipe.cost) {
            this.removeItem(c.item, c.count);
        }
        this.addItem(recipe.result.item, recipe.result.count);
        return true;
    }

    // 获取当前选中物品的工具等级（如果是工具）
    getToolTier() {
        const s = this.getSelected();
        if (!s) return TOOL_TIER.NONE;
        const data = getItemData(s.item);
        if (data && data.tool) return data.tier;
        return TOOL_TIER.NONE;
    }

    // 获取当前选中物品的类型
    getSelectedType() {
        const s = this.getSelected();
        if (!s) return null;
        return getItemData(s.item);
    }
}