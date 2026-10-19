// 世界：方块存储、地形生成、方块操作、光照
class World {
    constructor(seed) {
        this.width = CONFIG.WORLD_WIDTH;
        this.height = CONFIG.WORLD_HEIGHT;
        this.seed = seed || (Math.floor(Math.random() * 1000000) + 1);
        this.noise = new Noise(this.seed);

        // 方块数据：Uint8Array，索引 = y * width + x
        this.blocks = new Uint8Array(this.width * this.height);
        // 方块变体（用于渲染纹理变化，0-3）
        this.variants = new Uint8Array(this.width * this.height);

        // 地表高度图
        this.surface = new Int16Array(this.width);

        this.generate();
    }

    index(x, y) {
        return y * this.width + x;
    }

    inBounds(x, y) {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }

    getBlock(x, y) {
        if (!this.inBounds(x, y)) return BLOCK.BEDROCK;
        return this.blocks[this.index(x, y)];
    }

    setBlock(x, y, id) {
        if (!this.inBounds(x, y)) return false;
        const i = this.index(x, y);
        this.blocks[i] = id;
        this.variants[i] = Math.floor(Math.random() * 4);
        return true;
    }

    // 获取方块变体（用于纹理变化）
    getVariant(x, y) {
        if (!this.inBounds(x, y)) return 0;
        return this.variants[this.index(x, y)];
    }

    // ===== 地形生成 =====
    generate() {
        // 1. 生成地表高度
        for (let x = 0; x < this.width; x++) {
            const n = this.noise.fbm1D(x, 4, 0.5, 0.015);
            const n2 = this.noise.fbm1D(x, 2, 0.5, 0.005);
            // 基础高度 + 起伏
            const base = this.height * 0.45;
            const variation = (n - 0.5) * 30 + (n2 - 0.5) * 15;
            this.surface[x] = Math.floor(base + variation);
        }

        // 2. 填充方块
        for (let x = 0; x < this.width; x++) {
            const surf = this.surface[x];
            for (let y = 0; y < this.height; y++) {
                let block = BLOCK.AIR;

                if (y === this.height - 1) {
                    block = BLOCK.BEDROCK;
                } else if (y >= surf) {
                    // 地下
                    const depth = y - surf;
                    if (depth === 0) {
                        block = BLOCK.GRASS;
                    } else if (depth < 4) {
                        block = BLOCK.DIRT;
                    } else {
                        block = BLOCK.STONE;
                    }

                    // 洞穴雕刻
                    if (depth > 3) {
                        const cave = this.noise.fbm2D(x, y, 3, 0.5, 0.08);
                        const cave2 = this.noise.fbm2D(x + 1000, y + 1000, 2, 0.5, 0.04);
                        // 越深洞穴越多
                        const threshold = 0.55 - depth * 0.002;
                        if (cave > threshold && cave2 > 0.4 && y < this.height - 2) {
                            block = BLOCK.AIR;
                        }
                    }

                    // 矿石分布
                    if (block === BLOCK.STONE) {
                        block = this.generateOre(x, y, depth);
                    }
                }

                this.blocks[this.index(x, y)] = block;
                this.variants[this.index(x, y)] = Math.floor(Math.random() * 4);
            }
        }

        // 3. 生成树木
        this.generateTrees();

        // 4. 生成沙地（低洼区域）
        this.generateSandPatches();
    }

    generateOre(x, y, depth) {
        // 煤矿：浅层常见
        if (depth > 5 && this.noise.hash2(x * 3, y * 3) < 0.02) return BLOCK.COAL_ORE;
        // 铁矿：中层
        if (depth > 10 && this.noise.hash2(x * 5 + 1, y * 5 + 1) < 0.015) return BLOCK.IRON_ORE;
        // 金矿：深层
        if (depth > 25 && this.noise.hash2(x * 7 + 2, y * 7 + 2) < 0.008) return BLOCK.GOLD_ORE;
        // 钻石：最深
        if (depth > 40 && this.noise.hash2(x * 11 + 3, y * 11 + 3) < 0.004) return BLOCK.DIAMOND_ORE;
        return BLOCK.STONE;
    }

    generateTrees() {
        let lastTree = -10;
        for (let x = 2; x < this.width - 2; x++) {
            if (x - lastTree < 4) continue;
            // 5% 概率种树
            if (this.noise.hash(x * 13) < 0.08) {
                const surf = this.surface[x];
                if (this.getBlock(x, surf) !== BLOCK.GRASS) continue;
                const treeHeight = 4 + Math.floor(this.noise.hash(x * 17) * 3);
                // 树干
                for (let i = 1; i <= treeHeight; i++) {
                    this.setBlock(x, surf - i, BLOCK.WOOD);
                }
                // 树冠
                const topY = surf - treeHeight;
                for (let dx = -2; dx <= 2; dx++) {
                    for (let dy = -2; dy <= 1; dy++) {
                        if (Math.abs(dx) + Math.abs(dy) > 3) continue;
                        const tx = x + dx, ty = topY + dy;
                        if (this.getBlock(tx, ty) === BLOCK.AIR) {
                            this.setBlock(tx, ty, BLOCK.LEAVES);
                        }
                    }
                }
                lastTree = x;
            }
        }
    }

    generateSandPatches() {
        // 在某些区域把草地替换成沙子
        for (let x = 0; x < this.width; x++) {
            const patch = this.noise.fbm1D(x + 5000, 2, 0.5, 0.01);
            if (patch > 0.65) {
                const surf = this.surface[x];
                if (this.getBlock(x, surf) === BLOCK.GRASS) {
                    this.setBlock(x, surf, BLOCK.SAND);
                    for (let d = 1; d < 3; d++) {
                        if (this.getBlock(x, surf + d) === BLOCK.DIRT) {
                            this.setBlock(x, surf + d, BLOCK.SAND);
                        }
                    }
                }
            }
        }
    }

    // ===== 方块操作 =====
    // 挖掘方块，返回掉落物品 {item, count} 或 null
    mineBlock(x, y) {
        const block = this.getBlock(x, y);
        if (block === BLOCK.AIR || block === BLOCK.BEDROCK) return null;

        const data = getBlockData(block);
        let drop = data.drops ? { ...data.drops } : null;

        // 树叶有几率掉苹果
        if (block === BLOCK.LEAVES && Math.random() < 0.1) {
            drop = { item: ITEM.APPLE, count: 1 };
        }

        this.setBlock(x, y, BLOCK.AIR);
        return drop;
    }

    // 获取方块挖掘进度所需时间（受工具影响）
    getMineTime(x, y, toolTier) {
        const block = this.getBlock(x, y);
        const data = getBlockData(block);
        if (data.tier > toolTier) return Infinity; // 工具不够
        return data.hardness * 20; // 帧数
    }

    // 放置方块
    placeBlock(x, y, blockId) {
        if (!this.inBounds(x, y)) return false;
        if (this.getBlock(x, y) !== BLOCK.AIR) return false;
        this.setBlock(x, y, blockId);
        return true;
    }

    // ===== 光照查询 =====
    // 计算某点的天空光（从顶部到该点有多少空气）
    getSkyLight(x, y) {
        if (!this.inBounds(x, y)) return 0;
        // 从顶部往下扫描，遇到实体方块则停止
        for (let yy = 0; yy <= y; yy++) {
            const b = this.getBlock(x, yy);
            if (isSolid(b) && !isTransparent(b)) {
                return 0;
            }
        }
        return 1;
    }

    // 查找附近火把光照（在渲染时调用）
    getTorchLight(x, y, radius) {
        let light = 0;
        const r = Math.ceil(radius);
        for (let dx = -r; dx <= r; dx++) {
            for (let dy = -r; dy <= r; dy++) {
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > radius) continue;
                const b = this.getBlock(x + dx, y + dy);
                const emit = getLightEmission(b);
                if (emit > 0) {
                    const intensity = (1 - dist / radius) * (emit / 12);
                    if (intensity > light) light = intensity;
                }
            }
        }
        return light;
    }

    // 找到一个合适的玩家出生点（地表上方）
    findSpawnPoint() {
        const x = Math.floor(this.width / 2);
        const surf = this.surface[x];
        return { x: x + 0.5, y: surf - 3 };
    }
}