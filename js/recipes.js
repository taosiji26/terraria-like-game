// 制作配方表
// 每个配方: { result: {item, count}, cost: [{item, count}] }
// 注意：铁矿石挖掘直接获得铁锭（简化熔炼流程）
const RECIPES = [
    // 基础材料
    { result: { item: ITEM.PLANK, count: 4 }, cost: [{ item: ITEM.WOOD, count: 1 }] },
    { result: { item: ITEM.STICK, count: 4 }, cost: [{ item: ITEM.PLANK, count: 2 }] },
    { result: { item: ITEM.TORCH, count: 4 }, cost: [{ item: ITEM.COAL, count: 1 }, { item: ITEM.STICK, count: 1 }] },
    { result: { item: ITEM.PLATFORM, count: 2 }, cost: [{ item: ITEM.PLANK, count: 1 }] },
    { result: { item: ITEM.GLASS, count: 1 }, cost: [{ item: ITEM.SAND, count: 2 }, { item: ITEM.COAL, count: 1 }] },
    { result: { item: ITEM.BRICK, count: 1 }, cost: [{ item: ITEM.STONE, count: 2 }, { item: ITEM.COAL, count: 1 }] },

    // 木工具
    { result: { item: ITEM.WOOD_PICKAXE, count: 1 }, cost: [{ item: ITEM.PLANK, count: 3 }, { item: ITEM.STICK, count: 2 }] },
    { result: { item: ITEM.WOOD_AXE, count: 1 }, cost: [{ item: ITEM.PLANK, count: 3 }, { item: ITEM.STICK, count: 2 }] },
    { result: { item: ITEM.WOOD_SWORD, count: 1 }, cost: [{ item: ITEM.PLANK, count: 2 }, { item: ITEM.STICK, count: 1 }] },

    // 石工具
    { result: { item: ITEM.STONE_PICKAXE, count: 1 }, cost: [{ item: ITEM.STONE, count: 3 }, { item: ITEM.STICK, count: 2 }] },
    { result: { item: ITEM.STONE_AXE, count: 1 }, cost: [{ item: ITEM.STONE, count: 3 }, { item: ITEM.STICK, count: 2 }] },
    { result: { item: ITEM.STONE_SWORD, count: 1 }, cost: [{ item: ITEM.STONE, count: 2 }, { item: ITEM.STICK, count: 1 }] },

    // 铁工具
    { result: { item: ITEM.IRON_PICKAXE, count: 1 }, cost: [{ item: ITEM.IRON, count: 3 }, { item: ITEM.STICK, count: 2 }] },
    { result: { item: ITEM.IRON_AXE, count: 1 }, cost: [{ item: ITEM.IRON, count: 3 }, { item: ITEM.STICK, count: 2 }] },
    { result: { item: ITEM.IRON_SWORD, count: 1 }, cost: [{ item: ITEM.IRON, count: 2 }, { item: ITEM.STICK, count: 1 }] },

    // 存储方块
    { result: { item: ITEM.IRON_BLOCK, count: 1 }, cost: [{ item: ITEM.IRON, count: 4 }] },
    { result: { item: ITEM.GOLD_BLOCK, count: 1 }, cost: [{ item: ITEM.GOLD, count: 4 }] },

    // 食物
    { result: { item: ITEM.BREAD, count: 1 }, cost: [{ item: ITEM.LEAVES, count: 3 }] },
];