// 玩家类：移动、物理、挖掘、建造、战斗
class Player {
    constructor(world, spawn) {
        this.world = world;
        // 位置和速度（以方块为单位）
        this.x = spawn.x;
        this.y = spawn.y;
        this.vx = 0;
        this.vy = 0;

        // 碰撞箱尺寸（方块单位）
        this.width = 0.6;
        this.height = 1.8;

        // 状态
        this.health = CONFIG.PLAYER_MAX_HEALTH;
        this.maxHealth = CONFIG.PLAYER_MAX_HEALTH;
        this.hunger = CONFIG.PLAYER_MAX_HUNGER;
        this.maxHunger = CONFIG.PLAYER_MAX_HUNGER;
        this.dead = false;
        this.facing = 1; // 1=右, -1=左

        this.onGround = false;
        this.crouching = false;

        // 物品栏
        this.inventory = new Inventory();

        // 挖掘状态
        this.mining = null; // {x, y, progress, totalTime}
        this.buildCooldown = 0;
        this.attackCooldown = 0;
        this.hurtCooldown = 0; // 受伤无敌帧

        // 动画
        this.animTime = 0;
        this.walkPhase = 0;
        this.swingPhase = 0; // 挥动工具动画
        this.swinging = false;

        // 手电筒
        this.flashlight = false;

        // 统计
        this.daysSurvived = 1;
    }

    get centerX() { return this.x; }
    get centerY() { return this.y - this.height / 2; }

    // 获取玩家AABB
    getAABB() {
        return {
            left: this.x - this.width / 2,
            right: this.x + this.width / 2,
            top: this.y - this.height,
            bottom: this.y,
        };
    }

    // ===== 物理更新 =====
    update(dt, input) {
        if (this.dead) return;

        this.animTime += dt;
        if (this.hurtCooldown > 0) this.hurtCooldown -= dt;
        if (this.buildCooldown > 0) this.buildCooldown -= dt;
        if (this.attackCooldown > 0) this.attackCooldown -= dt;

        // 水平移动输入
        let moveDir = 0;
        if (input.left) moveDir -= 1;
        if (input.right) moveDir += 1;

        if (moveDir !== 0) {
            this.vx += moveDir * CONFIG.PLAYER_ACCEL;
            this.facing = moveDir;
            this.walkPhase += dt * 10;
        } else {
            this.walkPhase = 0;
        }

        // 速度限制
        this.vx = Math.max(-CONFIG.PLAYER_SPEED, Math.min(CONFIG.PLAYER_SPEED, this.vx));

        // 跳跃
        if (input.jump && this.onGround) {
            this.vy = -CONFIG.JUMP_FORCE;
            this.onGround = false;
        }

        // 重力
        this.vy += CONFIG.GRAVITY;
        if (this.vy > CONFIG.MAX_FALL_SPEED) this.vy = CONFIG.MAX_FALL_SPEED;

        // 摩擦
        if (this.onGround) {
            this.vx *= CONFIG.FRICTION;
        } else {
            this.vx *= CONFIG.AIR_FRICTION;
        }
        if (Math.abs(this.vx) < 0.05) this.vx = 0;

        // 移动并处理碰撞
        this.moveX(this.vx);
        this.moveY(this.vy, input.down);

        // 饥饿和生命恢复
        this.hunger -= CONFIG.HUNGER_DECAY * dt * 60;
        if (this.hunger < 0) this.hunger = 0;
        if (this.hunger <= 0) {
            this.takeDamage(CONFIG.HUNGER_DAMAGE * dt * 60, null);
        } else if (this.hunger > 10 && this.health < this.maxHealth && this.hurtCooldown <= 0) {
            this.health += CONFIG.HEALTH_REGEN * dt * 60;
            if (this.health > this.maxHealth) this.health = this.maxHealth;
        }

        // 挥动动画衰减
        if (this.swinging) {
            this.swingPhase += dt * 8;
            if (this.swingPhase > 1) {
                this.swinging = false;
                this.swingPhase = 0;
            }
        }
    }

    // X轴移动+碰撞
    moveX(dx) {
        this.x += dx;
        const aabb = this.getAABB();
        const minX = Math.floor(aabb.left);
        const maxX = Math.floor(aabb.right);
        const minY = Math.floor(aabb.top);
        const maxY = Math.floor(aabb.bottom - 0.001);

        for (let bx = minX; bx <= maxX; bx++) {
            for (let by = minY; by <= maxY; by++) {
                if (!this.isBlockSolidFor(bx, by)) continue;
                // 碰撞，回退
                if (dx > 0) {
                    this.x = bx - this.width / 2 - 0.001;
                } else if (dx < 0) {
                    this.x = bx + 1 + this.width / 2 + 0.001;
                }
                this.vx = 0;
                return;
            }
        }
    }

    // Y轴移动+碰撞
    moveY(dy, downPressed) {
        this.y += dy;
        this.onGround = false;
        const aabb = this.getAABB();
        const minX = Math.floor(aabb.left);
        const maxX = Math.floor(aabb.right - 0.001);
        const minY = Math.floor(aabb.top);
        const maxY = Math.floor(aabb.bottom);

        for (let by = minY; by <= maxY; by++) {
            for (let bx = minX; bx <= maxX; bx++) {
                const isPlatform = isPlatformBlock(this.world.getBlock(bx, by));
                // 平台：只在从上方落下且不按下蹲时碰撞
                if (isPlatform) {
                    if (dy > 0 && !downPressed) {
                        // 下落且没按蹲键：只在脚从平台上方穿过时碰撞
                        const prevBottom = this.y - dy;
                        if (prevBottom <= by + 0.05 && this.y >= by) {
                            this.y = by - 0.001;
                            this.vy = 0;
                            this.onGround = true;
                        }
                    }
                    continue;
                }
                if (!this.isBlockSolidFor(bx, by)) continue;
                if (dy > 0) {
                    // 下落碰撞
                    this.y = by - 0.001;
                    this.vy = 0;
                    this.onGround = true;
                } else if (dy < 0) {
                    // 上升碰撞（撞头）
                    this.y = by + 1 + this.height + 0.001;
                    this.vy = 0;
                }
                return;
            }
        }
    }

    // 判断方块对玩家是否固体（平台特殊处理）
    isBlockSolidFor(bx, by) {
        const block = this.world.getBlock(bx, by);
        if (isPlatformBlock(block)) return false; // 平台在 moveY 中单独处理
        return isSolid(block);
    }

    // ===== 挖掘 =====
    // 返回 {drop} 如果挖掘完成
    updateMining(dt, targetX, targetY, mouseDown, inRange) {
        if (!mouseDown || !inRange || this.dead) {
            this.mining = null;
            return null;
        }

        const block = this.world.getBlock(targetX, targetY);
        if (block === BLOCK.AIR || block === BLOCK.BEDROCK) {
            this.mining = null;
            return null;
        }

        const toolTier = this.inventory.getToolTier();
        const mineTime = this.world.getMineTime(targetX, targetY, toolTier);
        if (mineTime === Infinity) {
            this.mining = null;
            return null;
        }

        // 工具加速
        const toolData = this.inventory.getSelectedType();
        let speedMul = 1;
        if (toolData && toolData.tool === 'pickaxe') speedMul = 1.8;
        if (toolData && toolData.tool === 'axe' && (block === BLOCK.WOOD || block === BLOCK.PLANK)) speedMul = 2.2;

        // 开始或继续挖掘
        if (!this.mining || this.mining.x !== targetX || this.mining.y !== targetY) {
            this.mining = { x: targetX, y: targetY, progress: 0, total: mineTime };
            this.swinging = true;
        }
        this.mining.progress += dt * 60 * speedMul;
        this.swinging = true;

        if (this.mining.progress >= this.mining.total) {
            const drop = this.world.mineBlock(targetX, targetY);
            this.mining = null;
            return drop;
        }
        return null;
    }

    // ===== 放置方块 =====
    tryPlace(targetX, targetY) {
        if (this.buildCooldown > 0 || this.dead) return false;
        const sel = this.inventory.getSelected();
        if (!sel) return false;
        const data = getItemData(sel.item);
        if (!data || !data.block) return false;

        // 距离检查
        if (!this.inRange(targetX, targetY, CONFIG.BUILD_RANGE)) return false;

        // 不能放在玩家身上
        if (this.overlapsPlayer(targetX, targetY)) return false;

        if (this.world.placeBlock(targetX, targetY, data.block)) {
            this.inventory.consumeSelected();
            this.buildCooldown = 0.15;
            this.swinging = true;
            return true;
        }
        return false;
    }

    // ===== 攻击 =====
    attack(enemies) {
        if (this.attackCooldown > 0 || this.dead) return false;
        const sel = this.inventory.getSelected();
        let damage = 2; // 徒手
        if (sel) {
            const data = getItemData(sel.item);
            if (data && data.damage) damage = data.damage;
        }
        this.attackCooldown = 0.35;
        this.swinging = true;

        // 攻击范围
        const reach = 1.8;
        const ax = this.x + this.facing * reach;
        const ay = this.centerY;

        let hit = false;
        for (const e of enemies) {
            if (e.dead) continue;
            const dx = e.x - ax;
            const dy = e.y - ay;
            if (Math.sqrt(dx * dx + dy * dy) < 1.2) {
                e.takeDamage(damage, this.facing);
                hit = true;
            }
        }
        return hit;
    }

    // ===== 吃食物 =====
    eat() {
        const sel = this.inventory.getSelected();
        if (!sel) return false;
        const data = getItemData(sel.item);
        if (!data || !data.food) return false;
        if (this.hunger >= this.maxHunger) return false;
        this.hunger = Math.min(this.maxHunger, this.hunger + data.food);
        this.inventory.consumeSelected();
        return true;
    }

    // ===== 受伤 =====
    takeDamage(amount, source) {
        if (this.dead || this.hurtCooldown > 0) return;
        this.health -= amount;
        this.hurtCooldown = 0.6;
        // 击退
        if (source && source.vx !== undefined) {
            this.vx += source.vx > 0 ? 4 : -4;
            this.vy = -4;
        }
        if (this.health <= 0) {
            this.health = 0;
            this.dead = true;
        }
    }

    // ===== 辅助 =====
    inRange(tx, ty, range) {
        const dx = tx + 0.5 - this.x;
        const dy = ty + 0.5 - this.centerY;
        return Math.sqrt(dx * dx + dy * dy) <= range;
    }

    overlapsPlayer(tx, ty) {
        const aabb = this.getAABB();
        return tx + 1 > aabb.left && tx < aabb.right &&
               ty + 1 > aabb.top && ty < aabb.bottom;
    }

    respawn(spawn) {
        this.x = spawn.x;
        this.y = spawn.y;
        this.vx = 0;
        this.vy = 0;
        this.health = this.maxHealth;
        this.hunger = this.maxHunger;
        this.dead = false;
        this.hurtCooldown = 2;
    }
}

// 辅助：判断平台方块
function isPlatformBlock(id) {
    return id === BLOCK.PLATFORM;
}