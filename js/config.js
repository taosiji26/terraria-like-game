// 游戏全局配置常量
const CONFIG = {
    // 世界尺寸（以方块为单位）
    WORLD_WIDTH: 400,
    WORLD_HEIGHT: 200,
    // 方块像素大小
    TILE_SIZE: 24,
    // 重力
    GRAVITY: 0.55,
    // 最大下落速度
    MAX_FALL_SPEED: 14,
    // 跳跃力
    JUMP_FORCE: 11,
    // 玩家移动速度
    PLAYER_SPEED: 4.2,
    // 玩家加速度
    PLAYER_ACCEL: 0.8,
    // 摩擦力
    FRICTION: 0.75,
    // 空气阻力
    AIR_FRICTION: 0.92,

    // 摄像机
    CAMERA_LERP: 0.12,

    // 挖掘
    MINING_RANGE: 5, // 玩家可挖掘距离（方块数）
    BUILD_RANGE: 5,

    // 昼夜
    DAY_LENGTH: 120, // 一天总秒数
    DAY_RATIO: 0.65, // 白天占比

    // 僵尸
    ZOMBIE_SPAWN_INTERVAL: 3, // 夜晚每几秒尝试生成
    ZOMBIE_MAX_COUNT: 12,
    ZOMBIE_SPEED: 1.6,
    ZOMBIE_DAMAGE: 6,
    ZOMBIE_HEALTH: 20,
    ZOMBIE_SPAWN_DISTANCE: 18, // 距离玩家方块数

    // 玩家
    PLAYER_MAX_HEALTH: 20,
    PLAYER_MAX_HUNGER: 20,
    HUNGER_DECAY: 0.02, // 每秒减少
    HUNGER_DAMAGE: 0.5, // 饥饿时每秒伤害
    HEALTH_REGEN: 0.1, // 饱腹时每秒恢复

    // 物品栏
    HOTBAR_SIZE: 9,
    INVENTORY_STACK_MAX: 99,

    // 渲染
    LIGHT_RADIUS: 8, // 火把/手电筒光照半径
    AMBIENT_LIGHT_DAY: 1.0,
    AMBIENT_LIGHT_NIGHT: 0.18,
};

// 方块ID枚举
const BLOCK = {
    AIR: 0,
    GRASS: 1,
    DIRT: 2,
    STONE: 3,
    WOOD: 4,        // 树干
    LEAVES: 5,
    SAND: 6,
    WATER: 7,
    COAL_ORE: 8,
    IRON_ORE: 9,
    GOLD_ORE: 10,
    DIAMOND_ORE: 11,
    PLANK: 12,      // 木板（建造）
    TORCH: 13,      // 火把
    GLASS: 14,
    BRICK: 15,
    IRON_BLOCK: 16,
    GOLD_BLOCK: 17,
    BEDROCK: 18,    // 不可破坏基岩
    SNOW: 19,
    PLATFORM: 20,   // 木平台（可穿过）
};

// 物品ID（用于物品栏，部分对应方块）
const ITEM = {
    // 资源（对应方块）
    DIRT: BLOCK.DIRT,
    STONE: BLOCK.STONE,
    WOOD: BLOCK.WOOD,
    LEAVES: BLOCK.LEAVES,
    SAND: BLOCK.SAND,
    COAL: 100,
    IRON: 101,
    GOLD: 102,
    DIAMOND: 103,
    PLANK: BLOCK.PLANK,
    TORCH: BLOCK.TORCH,
    GLASS: BLOCK.GLASS,
    BRICK: BLOCK.BRICK,
    IRON_BLOCK: BLOCK.IRON_BLOCK,
    GOLD_BLOCK: BLOCK.GOLD_BLOCK,
    SNOW: BLOCK.SNOW,
    PLATFORM: BLOCK.PLATFORM,
    STICK: 110,
    // 工具/武器
    WOOD_PICKAXE: 200,
    STONE_PICKAXE: 201,
    IRON_PICKAXE: 202,
    WOOD_AXE: 210,
    STONE_AXE: 211,
    IRON_AXE: 212,
    WOOD_SWORD: 220,
    STONE_SWORD: 221,
    IRON_SWORD: 222,
    // 食物
    APPLE: 300,
    BREAD: 301,
    COOKED_MEAT: 302,
};

// 工具等级（用于挖掘能力）
const TOOL_TIER = {
    NONE: 0,
    WOOD: 1,
    STONE: 2,
    IRON: 3,
};