// 敌人：僵尸
class Zombie {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.width = 0.6;
        this.height = 1.7;
        this.health = CONFIG.ZOMBIE_HEALTH;
        this.maxHealth = CONFIG.ZOMBIE_HEALTH;
        this.dead = false;
        this.onGround = false;
        this.facing = -1;
        this.attackCooldown = 0;
        this.hurtCooldown = 0;
        this.animTime = Math.random() * 10;
        this.walkPhase = 0;
        this.jumpCooldown = 0;
    }

    get centerX() { return this.x; }
    get centerY() { return this.y - this.height / 2; }

    getAABB() {
        return {
            left: this.x - this.width / 2,
            right: this.x + this.width / 2,
            top: this.y - this.height,
            bottom: this.y,
        };
    }

    update(dt, world, player) {
        if (this.dead) return;
        this.animTime += dt;
        if (this.hurtCooldown > 0) this.hurtCooldown -= dt;
        if (this.attackCooldown > 0) this.attackCooldown -= dt;
        if (this.jumpCooldown > 0) this.jumpCooldown -= dt;

        // AI：朝玩家移动
        const dx = player.x - this.x;
        const dist = Math.abs(dx);
        this.facing = dx > 0 ? 1 : -1;

        if (dist > 0.8 && dist < 30) {
            this.vx += this.facing * 0.3;
            this.walkPhase += dt * 6;

            // 前方有墙则跳跃
            if (this.onGround && this.jumpCooldown <= 0) {
                const aheadX = Math.floor(this.x + this.facing * 0.7);
                const footY = Math.floor(this.y - 0.1);
                if (isSolid(world.getBlock(aheadX, footY)) && !isSolid(world.getBlock(aheadX, footY - 1))) {
                    this.vy = -CONFIG.JUMP_FORCE * 0.85;
                    this.onGround = false;
                    this.jumpCooldown = 0.5;
                }
            }
        } else {
            this.vx *= 0.8;
            this.walkPhase = 0;
        }

        // 速度限制
        const maxSpeed = CONFIG.ZOMBIE_SPEED;
        this.vx = Math.max(-maxSpeed, Math.min(maxSpeed, this.vx));

        // 重力
        this.vy += CONFIG.GRAVITY;
        if (this.vy > CONFIG.MAX_FALL_SPEED) this.vy = CONFIG.MAX_FALL_SPEED;

        // 摩擦
        if (this.onGround) this.vx *= 0.85;

        // 移动碰撞
        this.moveX(this.vx, world);
        this.moveY(this.vy, world);

        // 攻击玩家
        if (dist < 1.2 && this.attackCooldown <= 0) {
            const dy = Math.abs(player.centerY - this.centerY);
            if (dy < 1.5) {
                player.takeDamage(CONFIG.ZOMBIE_DAMAGE, this);
                this.attackCooldown = 1.0;
            }
        }

        // 掉出世界
        if (this.y > world.height + 5) this.dead = true;
    }

    moveX(dx, world) {
        this.x += dx;
        const aabb = this.getAABB();
        const minX = Math.floor(aabb.left);
        const maxX = Math.floor(aabb.right);
        const minY = Math.floor(aabb.top);
        const maxY = Math.floor(aabb.bottom - 0.001);

        for (let bx = minX; bx <= maxX; bx++) {
            for (let by = minY; by <= maxY; by++) {
                if (!isSolid(world.getBlock(bx, by))) continue;
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

    moveY(dy, world) {
        this.y += dy;
        this.onGround = false;
        const aabb = this.getAABB();
        const minX = Math.floor(aabb.left);
        const maxX = Math.floor(aabb.right - 0.001);
        const minY = Math.floor(aabb.top);
        const maxY = Math.floor(aabb.bottom);

        for (let by = minY; by <= maxY; by++) {
            for (let bx = minX; bx <= maxX; bx++) {
                if (!isSolid(world.getBlock(bx, by))) continue;
                if (dy > 0) {
                    this.y = by - 0.001;
                    this.vy = 0;
                    this.onGround = true;
                } else if (dy < 0) {
                    this.y = by + 1 + this.height + 0.001;
                    this.vy = 0;
                }
                return;
            }
        }
    }

    takeDamage(amount, fromDir) {
        if (this.dead || this.hurtCooldown > 0) return;
        this.health -= amount;
        this.hurtCooldown = 0.3;
        // 击退
        this.vx += fromDir * 3;
        this.vy = -3;
        if (this.health <= 0) {
            this.health = 0;
            this.dead = true;
        }
    }
}