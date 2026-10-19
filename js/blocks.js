// 方块属性定义表
// 每个方块: { name, color, hardness, tier(挖掘所需工具等级), solid, transparent, drops, light(发光) }
const BLOCK_DATA = {
    [BLOCK.AIR]: {
        name: '空气', solid: false, transparent: true, hardness: 0,
    },
    [BLOCK.GRASS]: {
        name: '草方块', color: '#4ade80', topColor: '#5ee884',
        hardness: 0.6, tier: TOOL_TIER.NONE, solid: true,
        drops: { item: ITEM.DIRT, count: 1 },
    },
    [BLOCK.DIRT]: {
        name: '泥土', color: '#92692c', topColor: '#a47a3d',
        hardness: 0.6, tier: TOOL_TIER.NONE, solid: true,
        drops: { item: ITEM.DIRT, count: 1 },
    },
    [BLOCK.STONE]: {
        name: '石头', color: '#7c7c7c', topColor: '#8e8e8e',
        hardness: 1.5, tier: TOOL_TIER.WOOD, solid: true,
        drops: { item: ITEM.STONE, count: 1 },
    },
    [BLOCK.WOOD]: {
        name: '木头', color: '#7a4a1e', topColor: '#8a5a2e',
        hardness: 1.2, tier: TOOL_TIER.NONE, solid: true,
        drops: { item: ITEM.WOOD, count: 1 },
    },
    [BLOCK.LEAVES]: {
        name: '树叶', color: '#2d8a2d', topColor: '#3da53d',
        hardness: 0.3, tier: TOOL_TIER.NONE, solid: true, transparent: true,
        drops: null, // 偶尔掉苹果（在挖掘时处理）
    },
    [BLOCK.SAND]: {
        name: '沙子', color: '#e8d97a', topColor: '#f0e38a',
        hardness: 0.5, tier: TOOL_TIER.NONE, solid: true,
        drops: { item: ITEM.SAND, count: 1 },
    },
    [BLOCK.WATER]: {
        name: '水', color: '#3b82f6', solid: false, transparent: true,
        hardness: 0, tier: 99,
    },
    [BLOCK.COAL_ORE]: {
        name: '煤矿石', color: '#6b6b6b', topColor: '#7c7c7c', spotColor: '#1a1a1a',
        hardness: 2.0, tier: TOOL_TIER.WOOD, solid: true,
        drops: { item: ITEM.COAL, count: 1 },
    },
    [BLOCK.IRON_ORE]: {
        name: '铁矿石', color: '#a89080', topColor: '#b89e8e', spotColor: '#d4a070',
        hardness: 2.5, tier: TOOL_TIER.STONE, solid: true,
        drops: { item: ITEM.IRON, count: 1 },
    },
    [BLOCK.GOLD_ORE]: {
        name: '金矿石', color: '#a89040', topColor: '#b8a050', spotColor: '#fbbf24',
        hardness: 3.0, tier: TOOL_TIER.IRON, solid: true,
        drops: { item: ITEM.GOLD, count: 1 },
    },
    [BLOCK.DIAMOND_ORE]: {
        name: '钻石矿石', color: '#3a8a8a', topColor: '#4a9a9a', spotColor: '#67e8f9',
        hardness: 4.0, tier: TOOL_TIER.IRON, solid: true,
        drops: { item: ITEM.DIAMOND, count: 1 },
    },
    [BLOCK.PLANK]: {
        name: '木板', color: '#b07a3a', topColor: '#c08a4a',
        hardness: 1.0, tier: TOOL_TIER.NONE, solid: true,
        drops: { item: ITEM.PLANK, count: 1 },
    },
    [BLOCK.TORCH]: {
        name: '火把', color: '#f59e0b', solid: false, transparent: true,
        hardness: 0.1, tier: TOOL_TIER.NONE, light: 12,
        drops: { item: ITEM.TORCH, count: 1 },
    },
    [BLOCK.GLASS]: {
        name: '玻璃', color: '#a0e0e0', topColor: '#b0f0f0',
        hardness: 0.4, tier: TOOL_TIER.NONE, solid: true, transparent: true,
        drops: null, // 玻璃破碎不掉落
    },
    [BLOCK.BRICK]: {
        name: '砖块', color: '#a04030', topColor: '#b05040',
        hardness: 2.0, tier: TOOL_TIER.WOOD, solid: true,
        drops: { item: ITEM.BRICK, count: 1 },
    },
    [BLOCK.IRON_BLOCK]: {
        name: '铁块', color: '#d4d4d4', topColor: '#e4e4e4',
        hardness: 3.5, tier: TOOL_TIER.STONE, solid: true,
        drops: { item: ITEM.IRON_BLOCK, count: 1 },
    },
    [BLOCK.GOLD_BLOCK]: {
        name: '金块', color: '#fbbf24', topColor: '#fcd34d',
        hardness: 3.5, tier: TOOL_TIER.IRON, solid: true,
        drops: { item: ITEM.GOLD_BLOCK, count: 1 },
    },
    [BLOCK.BEDROCK]: {
        name: '基岩', color: '#444444', topColor: '#555555',
        hardness: 999, tier: 99, solid: true,
        drops: null,
    },
    [BLOCK.SNOW]: {
        name: '雪', color: '#f0f8ff', topColor: '#ffffff',
        hardness: 0.3, tier: TOOL_TIER.NONE, solid: true,
        drops: { item: ITEM.SNOW, count: 1 },
    },
    [BLOCK.PLATFORM]: {
        name: '木平台', color: '#a06a2a', topColor: '#b07a3a',
        hardness: 0.8, tier: TOOL_TIER.NONE, solid: true, platform: true, transparent: true,
        drops: { item: ITEM.PLATFORM, count: 1 },
    },
};

// 物品属性表
const ITEM_DATA = {
    [ITEM.DIRT]: { name: '泥土', icon: '🟫', block: BLOCK.DIRT, stackable: true },
    [ITEM.STONE]: { name: '石头', icon: '⬜', block: BLOCK.STONE, stackable: true },
    [ITEM.WOOD]: { name: '木头', icon: '🟧', block: BLOCK.WOOD, stackable: true },
    [ITEM.LEAVES]: { name: '树叶', icon: '🍃', block: BLOCK.LEAVES, stackable: true },
    [ITEM.SAND]: { name: '沙子', icon: '🟨', block: BLOCK.SAND, stackable: true },
    [ITEM.COAL]: { name: '煤炭', icon: '⚫', stackable: true },
    [ITEM.IRON]: { name: '铁锭', icon: '⬛', stackable: true },
    [ITEM.GOLD]: { name: '金锭', icon: '🟡', stackable: true },
    [ITEM.DIAMOND]: { name: '钻石', icon: '💎', stackable: true },
    [ITEM.PLANK]: { name: '木板', icon: '🟫', block: BLOCK.PLANK, stackable: true },
    [ITEM.TORCH]: { name: '火把', icon: '🔥', block: BLOCK.TORCH, stackable: true },
    [ITEM.GLASS]: { name: '玻璃', icon: '🔲', block: BLOCK.GLASS, stackable: true },
    [ITEM.BRICK]: { name: '砖块', icon: '🧱', block: BLOCK.BRICK, stackable: true },
    [ITEM.IRON_BLOCK]: { name: '铁块', icon: '⬜', block: BLOCK.IRON_BLOCK, stackable: true },
    [ITEM.GOLD_BLOCK]: { name: '金块', icon: '🟫', block: BLOCK.GOLD_BLOCK, stackable: true },
    [ITEM.SNOW]: { name: '雪', icon: '⚪', block: BLOCK.SNOW, stackable: true },
    [ITEM.PLATFORM]: { name: '木平台', icon: '▬', block: BLOCK.PLATFORM, stackable: true },
    [ITEM.STICK]: { name: '木棍', icon: '🥢', stackable: true },
    // 工具
    [ITEM.WOOD_PICKAXE]: { name: '木镐', icon: '⛏', tool: 'pickaxe', tier: TOOL_TIER.WOOD, stackable: false },
    [ITEM.STONE_PICKAXE]: { name: '石镐', icon: '⛏', tool: 'pickaxe', tier: TOOL_TIER.STONE, stackable: false },
    [ITEM.IRON_PICKAXE]: { name: '铁镐', icon: '⛏', tool: 'pickaxe', tier: TOOL_TIER.IRON, stackable: false },
    [ITEM.WOOD_AXE]: { name: '木斧', icon: '🪓', tool: 'axe', tier: TOOL_TIER.WOOD, stackable: false },
    [ITEM.STONE_AXE]: { name: '石斧', icon: '🪓', tool: 'axe', tier: TOOL_TIER.STONE, stackable: false },
    [ITEM.IRON_AXE]: { name: '铁斧', icon: '🪓', tool: 'axe', tier: TOOL_TIER.IRON, stackable: false },
    [ITEM.WOOD_SWORD]: { name: '木剑', icon: '🗡', tool: 'sword', tier: TOOL_TIER.WOOD, damage: 4, stackable: false },
    [ITEM.STONE_SWORD]: { name: '石剑', icon: '🗡', tool: 'sword', tier: TOOL_TIER.STONE, damage: 7, stackable: false },
    [ITEM.IRON_SWORD]: { name: '铁剑', icon: '⚔', tool: 'sword', tier: TOOL_TIER.IRON, damage: 10, stackable: false },
    // 食物
    [ITEM.APPLE]: { name: '苹果', icon: '🍎', food: 4, stackable: true },
    [ITEM.BREAD]: { name: '面包', icon: '🍞', food: 6, stackable: true },
    [ITEM.COOKED_MEAT]: { name: '熟肉', icon: '🍖', food: 8, stackable: true },
};

// 获取方块数据，默认返回空气
function getBlockData(id) {
    return BLOCK_DATA[id] || BLOCK_DATA[BLOCK.AIR];
}

// 获取物品数据
function getItemData(id) {
    return ITEM_DATA[id];
}

// 判断方块是否固体（阻挡移动）
function isSolid(id) {
    const d = BLOCK_DATA[id];
    return d && d.solid;
}

// 判断方块是否透明（不阻挡光照）
function isTransparent(id) {
    const d = BLOCK_DATA[id];
    return !d || d.transparent || !d.solid;
}

// 判断方块是否为平台（可从下方穿过）
function isPlatform(id) {
    const d = BLOCK_DATA[id];
    return d && d.platform;
}

// 判断方块是否发光
function getLightEmission(id) {
    const d = BLOCK_DATA[id];
    return (d && d.light) || 0;
}