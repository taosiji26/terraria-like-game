// 渲染器：方块纹理预生成 + 场景绘制 + 光照
class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d', { alpha: false });
        this.tileSize = CONFIG.TILE_SIZE;

        // 摄像机（以方块为单位的世界坐标）
        this.camX = 0;
        this.camY = 0;

        // 预生成方块纹理缓存
        this.tileCache = {};
        this.generateAllTileTextures();

        // 玩家纹理
        this.playerSprites = {};
        this.generatePlayerSprites();

        // 僵尸纹理
        this.zombieSprites = {};
        this.generateZombieSprites();

        this.resize();
    }

    resize() {
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = window.innerWidth * dpr;
        this.canvas.height = window.innerHeight * dpr;
        this.canvas.style.width = window.innerWidth + 'px';
        this.canvas.style.height = window.innerHeight + 'px';
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        this.viewW = window.innerWidth;
        this.viewH = window.innerHeight;
    }

    // 世界坐标 -> 屏幕坐标
    worldToScreen(wx, wy) {
        return {
            x: (wx - this.camX) * this.tileSize + this.viewW / 2,
            y: (wy - this.camY) * this.tileSize + this.viewH / 2,
        };
    }

    // 屏幕坐标 -> 世界方块坐标
    screenToBlock(sx, sy) {
        const wx = (sx - this.viewW / 2) / this.tileSize + this.camX;
        const wy = (sy - this.viewH / 2) / this.tileSize + this.camY;
        return { x: Math.floor(wx), y: Math.floor(wy) };
    }

    // 屏幕坐标 -> 世界坐标
    screenToWorld(sx, sy) {
        return {
            x: (sx - this.viewW / 2) / this.tileSize + this.camX,
            y: (sy - this.viewH / 2) / this.tileSize + this.camY,
        };
    }

    // ===== 预生成方块纹理 =====
    generateAllTileTextures() {
        for (const idStr in BLOCK_DATA) {
            const id = parseInt(idStr);
            if (id === BLOCK.AIR) continue;
            this.tileCache[id] = this.generateTileTexture(id);
        }
    }

    generateTileTexture(id) {
        const s = this.tileSize;
        const cv = document.createElement('canvas');
        cv.width = s;
        cv.height = s;
        const ctx = cv.getContext('2d');
        const data = BLOCK_DATA[id];

        if (!data || !data.color) {
            return cv;
        }

        const baseColor = data.color;
        const topColor = data.topColor || baseColor;
        const spotColor = data.spotColor;

        // 底色
        ctx.fillStyle = baseColor;
        ctx.fillRect(0, 0, s, s);

        // 顶部高光（草、雪等）
        if (data.topColor && data.topColor !== baseColor) {
            ctx.fillStyle = topColor;
            ctx.fillRect(0, 0, s, Math.max(2, s * 0.18));
        }

        // 噪点纹理（用伪随机）
        const seed = id * 31;
        for (let i = 0; i < s; i++) {
            for (let j = 0; j < s; j++) {
                const h = ((i * 374761393 + j * 668265263 + seed) ^ ((i * 374761393 + j * 668265263 + seed) >> 13)) * 1274126177 | 0;
                const r = ((h >>> 0) % 100) / 100;
                if (r < 0.15) {
                    // 暗点
                    ctx.fillStyle = this.darken(baseColor, 0.15);
                    ctx.fillRect(i, j, 1, 1);
                } else if (r > 0.92) {
                    // 亮点
                    ctx.fillStyle = this.lighten(baseColor, 0.12);
                    ctx.fillRect(i, j, 1, 1);
                }
            }
        }

        // 矿石斑点
        if (spotColor) {
            ctx.fillStyle = spotColor;
            const spots = [[5, 7], [14, 4], [10, 15], [18, 17]];
            for (const [sx, sy] of spots) {
                ctx.fillRect(sx, sy, 3, 3);
                ctx.fillRect(sx + 1, sy - 1, 2, 1);
            }
        }

        // 木头纹理（横纹）
        if (id === BLOCK.WOOD) {
            ctx.fillStyle = this.darken(baseColor, 0.25);
            ctx.fillRect(0, 4, s, 1);
            ctx.fillRect(0, 11, s, 1);
            ctx.fillRect(0, 18, s, 1);
        }
        // 木板纹理
        if (id === BLOCK.PLANK) {
            ctx.fillStyle = this.darken(baseColor, 0.2);
            ctx.fillRect(0, 7, s, 1);
            ctx.fillRect(0, 16, s, 1);
            ctx.fillRect(11, 0, 1, 7);
            ctx.fillRect(6, 8, 1, 8);
            ctx.fillRect(17, 17, 1, 7);
        }
        // 砖块纹理
        if (id === BLOCK.BRICK) {
            ctx.fillStyle = this.darken(baseColor, 0.3);
            ctx.fillRect(0, 7, s, 1);
            ctx.fillRect(0, 15, s, 1);
            ctx.fillRect(11, 0, 1, 7);
            ctx.fillRect(5, 8, 1, 7);
            ctx.fillRect(17, 16, 1, 7);
        }
        // 火把
        if (id === BLOCK.TORCH) {
            ctx.clearRect(0, 0, s, s);
            // 木棍
            ctx.fillStyle = '#7a4a1e';
            ctx.fillRect(s / 2 - 1, s * 0.4, 3, s * 0.6);
            // 火焰
            ctx.fillStyle = '#f59e0b';
            ctx.fillRect(s / 2 - 3, s * 0.2, 7, s * 0.25);
            ctx.fillStyle = '#fbbf24';
            ctx.fillRect(s / 2 - 2, s * 0.15, 5, s * 0.2);
            ctx.fillStyle = '#fef3c7';
            ctx.fillRect(s / 2 - 1, s * 0.1, 3, s * 0.15);
        }
        // 平台
        if (id === BLOCK.PLATFORM) {
            ctx.clearRect(0, 0, s, s);
            ctx.fillStyle = baseColor;
            ctx.fillRect(0, s * 0.35, s, s * 0.4);
            ctx.fillStyle = this.darken(baseColor, 0.2);
            ctx.fillRect(0, s * 0.7, s, 1);
            ctx.fillStyle = topColor;
            ctx.fillRect(0, s * 0.35, s, 2);
        }
        // 玻璃
        if (id === BLOCK.GLASS) {
            ctx.clearRect(0, 0, s, s);
            ctx.fillStyle = 'rgba(180, 220, 220, 0.35)';
            ctx.fillRect(0, 0, s, s);
            ctx.strokeStyle = 'rgba(200, 240, 240, 0.8)';
            ctx.lineWidth = 1;
            ctx.strokeRect(0.5, 0.5, s - 1, s - 1);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.beginPath();
            ctx.moveTo(3, s - 3);
            ctx.lineTo(s - 3, 3);
            ctx.stroke();
        }
        // 树叶更蓬松
        if (id === BLOCK.LEAVES) {
            ctx.fillStyle = this.darken(baseColor, 0.2);
            ctx.fillRect(0, s - 3, s, 3);
            ctx.fillStyle = this.lighten(baseColor, 0.15);
            ctx.fillRect(2, 2, 4, 3);
            ctx.fillRect(15, 5, 5, 3);
        }

        return cv;
    }

    // 颜色辅助
    darken(hex, amt) {
        const c = this.hexToRgb(hex);
        return `rgb(${Math.floor(c.r * (1 - amt))},${Math.floor(c.g * (1 - amt))},${Math.floor(c.b * (1 - amt))})`;
    }
    lighten(hex, amt) {
        const c = this.hexToRgb(hex);
        return `rgb(${Math.min(255, Math.floor(c.r + (255 - c.r) * amt))},${Math.min(255, Math.floor(c.g + (255 - c.g) * amt))},${Math.min(255, Math.floor(c.b + (255 - c.b) * amt))})`;
    }
    hexToRgb(hex) {
        if (hex.startsWith('rgb')) {
            const m = hex.match(/\d+/g);
            return { r: +m[0], g: +m[1], b: +m[2] };
        }
        const h = hex.replace('#', '');
        return {
            r: parseInt(h.substr(0, 2), 16),
            g: parseInt(h.substr(2, 2), 16),
            b: parseInt(h.substr(4, 2), 16),
        };
    }

    // ===== 玩家精灵 =====
    generatePlayerSprites() {
        // 生成4帧：站立、行走1、行走2、跳跃
        const s = this.tileSize;
        const make = (drawFn) => {
            const cv = document.createElement('canvas');
            cv.width = s;
            cv.height = s * 2;
            const ctx = cv.getContext('2d');
            ctx.imageSmoothingEnabled = false;
            drawFn(ctx, s);
            return cv;
        };

        const drawBody = (ctx, s, legOffset) => {
            const w = s * 0.5;
            const cx = s / 2;
            // 头
            ctx.fillStyle = '#fbcfa0';
            ctx.fillRect(cx - w / 2, 0, w, w * 0.7);
            // 头发
            ctx.fillStyle = '#5a3a1a';
            ctx.fillRect(cx - w / 2, 0, w, w * 0.2);
            ctx.fillRect(cx - w / 2, 0, w * 0.15, w * 0.4);
            ctx.fillRect(cx + w / 2 - w * 0.15, 0, w * 0.15, w * 0.4);
            // 眼睛
            ctx.fillStyle = '#1a1a2e';
            ctx.fillRect(cx - w * 0.25, w * 0.35, 2, 2);
            ctx.fillRect(cx + w * 0.1, w * 0.35, 2, 2);
            // 身体
            ctx.fillStyle = '#3b82f6';
            ctx.fillRect(cx - w * 0.4, w * 0.7, w * 0.8, w * 0.6);
            // 手臂
            ctx.fillStyle = '#fbcfa0';
            ctx.fillRect(cx - w * 0.55, w * 0.7, w * 0.15, w * 0.5);
            ctx.fillRect(cx + w * 0.4, w * 0.7, w * 0.15, w * 0.5);
            // 腿
            ctx.fillStyle = '#1e3a8a';
            ctx.fillRect(cx - w * 0.35, w * 1.3, w * 0.3, w * 0.5 + legOffset);
            ctx.fillRect(cx + w * 0.05, w * 1.3, w * 0.3, w * 0.5 - legOffset);
            // 鞋
            ctx.fillStyle = '#1a1a2e';
            ctx.fillRect(cx - w * 0.4, w * 1.8 + legOffset, w * 0.35, 3);
            ctx.fillRect(cx + w * 0.05, w * 1.8 - legOffset, w * 0.35, 3);
        };

        this.playerSprites.stand = make((ctx, s) => drawBody(ctx, s, 0));
        this.playerSprites.walk1 = make((ctx, s) => drawBody(ctx, s, 3));
        this.playerSprites.walk2 = make((ctx, s) => drawBody(ctx, s, -3));
        this.playerSprites.jump = make((ctx, s) => {
            drawBody(ctx, s, 0);
            // 跳跃时腿弯曲
        });
    }

    // ===== 僵尸精灵 =====
    generateZombieSprites() {
        const s = this.tileSize;
        const make = (drawFn) => {
            const cv = document.createElement('canvas');
            cv.width = s;
            cv.height = s * 2;
            const ctx = cv.getContext('2d');
            ctx.imageSmoothingEnabled = false;
            drawFn(ctx, s);
            return cv;
        };

        const drawZombie = (ctx, s, legOffset) => {
            const w = s * 0.5;
            const cx = s / 2;
            // 头
            ctx.fillStyle = '#4a7a4a';
            ctx.fillRect(cx - w / 2, 0, w, w * 0.7);
            // 眼睛（红色）
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(cx - w * 0.25, w * 0.35, 3, 2);
            ctx.fillRect(cx + w * 0.1, w * 0.35, 3, 2);
            // 嘴
            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(cx - w * 0.15, w * 0.55, w * 0.3, 2);
            // 身体
            ctx.fillStyle = '#3a5a3a';
            ctx.fillRect(cx - w * 0.4, w * 0.7, w * 0.8, w * 0.6);
            // 手臂（前伸）
            ctx.fillStyle = '#4a7a4a';
            ctx.fillRect(cx - w * 0.55, w * 0.75, w * 0.15, w * 0.45);
            ctx.fillRect(cx + w * 0.4, w * 0.75, w * 0.15, w * 0.45);
            // 腿
            ctx.fillStyle = '#2a4a2a';
            ctx.fillRect(cx - w * 0.35, w * 1.3, w * 0.3, w * 0.5 + legOffset);
            ctx.fillRect(cx + w * 0.05, w * 1.3, w * 0.3, w * 0.5 - legOffset);
        };

        this.zombieSprites.stand = make((ctx, s) => drawZombie(ctx, s, 0));
        this.zombieSprites.walk1 = make((ctx, s) => drawZombie(ctx, s, 3));
        this.zombieSprites.walk2 = make((ctx, s) => drawZombie(ctx, s, -3));
    }

    // ===== 主渲染 =====
    render(game) {
        const ctx = this.ctx;
        const { world, player, enemies, dayNight, particles, input } = game;

        // 1. 天空
        this.renderSky(dayNight);

        // 2. 方块（只渲染可见区域）
        this.renderTiles(world, dayNight);

        // 3. 玩家
        if (!player.dead) {
            this.renderPlayer(player);
        }

        // 4. 敌人
        for (const e of enemies) {
            if (!e.dead) this.renderZombie(e);
        }

        // 5. 粒子
        this.renderParticles(particles);

        // 6. 光照覆盖
        this.renderLighting(world, player, dayNight);

        // 7. 准星 / 目标方块高亮
        this.renderTargetHighlight(world, player, input);

        // 8. 挖掘进度裂纹
        if (player.mining) {
            this.renderMiningProgress(player.mining);
        }
    }

    renderSky(dayNight) {
        const ctx = this.ctx;
        const [r, g, b] = dayNight.getSkyColor();
        const grad = ctx.createLinearGradient(0, 0, 0, this.viewH);
        grad.addColorStop(0, `rgb(${Math.floor(r * 255)},${Math.floor(g * 255)},${Math.floor(b * 255)})`);
        grad.addColorStop(1, `rgb(${Math.floor(r * 200)},${Math.floor(g * 200)},${Math.floor(b * 220)})`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, this.viewW, this.viewH);

        // 夜晚星星
        if (dayNight.isNight) {
            ctx.fillStyle = 'rgba(255,255,255,0.8)';
            for (let i = 0; i < 60; i++) {
                const sx = (i * 137.5) % this.viewW;
                const sy = (i * 73.3) % (this.viewH * 0.5);
                const tw = 0.5 + 0.5 * Math.sin(performance.now() * 0.001 + i);
                ctx.globalAlpha = tw * 0.7;
                ctx.fillRect(sx, sy, 2, 2);
            }
            ctx.globalAlpha = 1;
        }

        // 白天太阳 / 夜晚月亮
        const dayDuration = dayNight.dayLength * dayNight.dayRatio;
        const t = dayNight.time / dayNight.dayLength;
        const angle = t * Math.PI * 2 - Math.PI / 2;
        const cx = this.viewW / 2 + Math.cos(angle) * this.viewW * 0.4;
        const cy = this.viewH * 0.3 + Math.sin(angle) * this.viewH * 0.25;
        if (!dayNight.isNight) {
            ctx.fillStyle = '#fde047';
            ctx.beginPath();
            ctx.arc(cx, cy, 24, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'rgba(253, 224, 71, 0.3)';
            ctx.beginPath();
            ctx.arc(cx, cy, 40, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillStyle = '#e5e7eb';
            ctx.beginPath();
            ctx.arc(cx, cy, 18, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'rgba(200, 200, 220, 0.3)';
            ctx.beginPath();
            ctx.arc(cx - 6, cy - 4, 6, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    renderTiles(world, dayNight) {
        const ctx = this.ctx;
        const ts = this.tileSize;
        // 可见方块范围
        const startX = Math.floor(this.camX - this.viewW / 2 / ts) - 1;
        const endX = Math.ceil(this.camX + this.viewW / 2 / ts) + 1;
        const startY = Math.floor(this.camY - this.viewH / 2 / ts) - 1;
        const endY = Math.ceil(this.camY + this.viewH / 2 / ts) + 1;

        for (let y = startY; y <= endY; y++) {
            for (let x = startX; x <= endX; x++) {
                if (x < 0 || x >= world.width || y < 0 || y >= world.height) continue;
                const block = world.getBlock(x, y);
                if (block === BLOCK.AIR) continue;
                const tex = this.tileCache[block];
                if (!tex) continue;
                const sx = Math.floor((x - this.camX) * ts + this.viewW / 2);
                const sy = Math.floor((y - this.camY) * ts + this.viewH / 2);
                ctx.drawImage(tex, sx, sy);
            }
        }
    }

    renderPlayer(player) {
        const ctx = this.ctx;
        const ts = this.tileSize;
        const screen = this.worldToScreen(player.x, player.y);
        const px = Math.floor(screen.x - ts / 2);
        const py = Math.floor(screen.y - ts * 2); // 玩家2格高

        // 选择动画帧
        let sprite;
        if (!player.onGround) {
            sprite = this.playerSprites.jump;
        } else if (Math.abs(player.vx) > 0.3) {
            const phase = Math.floor(player.walkPhase) % 2;
            sprite = phase === 0 ? this.playerSprites.walk1 : this.playerSprites.walk2;
        } else {
            sprite = this.playerSprites.stand;
        }

        // 受伤闪烁
        if (player.hurtCooldown > 0 && Math.floor(player.hurtCooldown * 20) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }

        // 翻转
        ctx.save();
        if (player.facing < 0) {
            ctx.scale(-1, 1);
            ctx.drawImage(sprite, -px - ts, py);
        } else {
            ctx.drawImage(sprite, px, py);
        }
        ctx.restore();
        ctx.globalAlpha = 1;

        // 持有物品显示
        const sel = player.inventory.getSelected();
        if (sel) {
            const data = getItemData(sel.item);
            if (data && data.icon) {
                const handX = px + (player.facing > 0 ? ts * 0.7 : ts * 0.1);
                const handY = py + ts * 0.7;
                ctx.font = '20px sans-serif';
                ctx.fillText(data.icon, handX, handY + 16);
            }
        }
    }

    renderZombie(z) {
        const ctx = this.ctx;
        const ts = this.tileSize;
        const screen = this.worldToScreen(z.x, z.y);
        const px = Math.floor(screen.x - ts / 2);
        const py = Math.floor(screen.y - ts * 2);

        let sprite;
        if (Math.abs(z.vx) > 0.2) {
            const phase = Math.floor(z.walkPhase) % 2;
            sprite = phase === 0 ? this.zombieSprites.walk1 : this.zombieSprites.walk2;
        } else {
            sprite = this.zombieSprites.stand;
        }

        if (z.hurtCooldown > 0 && Math.floor(z.hurtCooldown * 20) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }

        ctx.save();
        if (z.facing < 0) {
            ctx.scale(-1, 1);
            ctx.drawImage(sprite, -px - ts, py);
        } else {
            ctx.drawImage(sprite, px, py);
        }
        ctx.restore();
        ctx.globalAlpha = 1;

        // 血条
        if (z.health < z.maxHealth) {
            const bw = ts * 0.8;
            const bx = screen.x - bw / 2;
            const by = py - 6;
            ctx.fillStyle = '#333';
            ctx.fillRect(bx, by, bw, 4);
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(bx, by, bw * (z.health / z.maxHealth), 4);
        }
    }

    renderParticles(ps) {
        const ctx = this.ctx;
        for (const p of ps.particles) {
            const screen = this.worldToScreen(p.x, p.y);
            const alpha = p.life / p.maxLife;
            ctx.globalAlpha = alpha;
            if (p.text) {
                ctx.fillStyle = p.color;
                ctx.font = `bold ${p.size}px sans-serif`;
                ctx.fillText(p.text, screen.x, screen.y);
            } else {
                ctx.fillStyle = p.color;
                ctx.fillRect(Math.floor(screen.x), Math.floor(screen.y), p.size, p.size);
            }
        }
        ctx.globalAlpha = 1;
    }

    // 光照：夜晚暗化 + 火把/手电筒加亮
    renderLighting(world, player, dayNight) {
        const ctx = this.ctx;
        const ambient = dayNight.getAmbientLight();

        // 暗化覆盖
        if (ambient < 1) {
            ctx.fillStyle = `rgba(0,0,15,${1 - ambient})`;
            ctx.fillRect(0, 0, this.viewW, this.viewH);
        }

        // 加亮（火把、手电筒）
        ctx.globalCompositeOperation = 'lighter';

        // 手电筒
        if (player.flashlight && !player.dead) {
            const screen = this.worldToScreen(player.x, player.centerY);
            const dir = player.facing;
            const grad = ctx.createRadialGradient(
                screen.x + dir * 60, screen.y, 0,
                screen.x + dir * 60, screen.y, 200
            );
            grad.addColorStop(0, 'rgba(255,240,200,0.6)');
            grad.addColorStop(0.5, 'rgba(255,240,200,0.2)');
            grad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, this.viewW, this.viewH);
        }

        // 火把（可见范围内）
        const ts = this.tileSize;
        const startX = Math.floor(this.camX - this.viewW / 2 / ts) - 2;
        const endX = Math.ceil(this.camX + this.viewW / 2 / ts) + 2;
        const startY = Math.floor(this.camY - this.viewH / 2 / ts) - 2;
        const endY = Math.ceil(this.camY + this.viewH / 2 / ts) + 2;
        const flicker = 0.85 + 0.15 * Math.sin(performance.now() * 0.02);

        for (let y = startY; y <= endY; y++) {
            for (let x = startX; x <= endX; x++) {
                if (world.getBlock(x, y) === BLOCK.TORCH) {
                    const screen = this.worldToScreen(x + 0.5, y + 0.5);
                    const radius = CONFIG.LIGHT_RADIUS * ts * flicker;
                    const grad = ctx.createRadialGradient(
                        screen.x, screen.y, 0,
                        screen.x, screen.y, radius
                    );
                    grad.addColorStop(0, 'rgba(255,180,80,0.8)');
                    grad.addColorStop(0.4, 'rgba(255,140,40,0.3)');
                    grad.addColorStop(1, 'rgba(0,0,0,0)');
                    ctx.fillStyle = grad;
                    ctx.fillRect(screen.x - radius, screen.y - radius, radius * 2, radius * 2);
                }
            }
        }

        ctx.globalCompositeOperation = 'source-over';
    }

    // 目标方块高亮
    renderTargetHighlight(world, player, input) {
        if (!input.mouseInGame) return;
        const target = this.screenToBlock(input.mouseX, input.mouseY);
        if (!world.inBounds(target.x, target.y)) return;
        const block = world.getBlock(target.x, target.y);
        const inRange = player.inRange(target.x, target.y, CONFIG.MINING_RANGE);

        const ts = this.tileSize;
        const screen = this.worldToScreen(target.x, target.y);
        const ctx = this.ctx;

        if (block !== BLOCK.AIR && inRange) {
            // 挖掘目标：白色边框
            ctx.strokeStyle = 'rgba(255,255,255,0.8)';
            ctx.lineWidth = 2;
            ctx.strokeRect(screen.x, screen.y, ts, ts);
        } else if (block === BLOCK.AIR && inRange) {
            // 建造目标：淡色边框
            const sel = player.inventory.getSelected();
            if (sel && getItemData(sel.item)?.block) {
                ctx.strokeStyle = 'rgba(100,255,100,0.5)';
                ctx.lineWidth = 2;
                ctx.strokeRect(screen.x, screen.y, ts, ts);
            }
        }
    }

    // 挖掘进度裂纹
    renderMiningProgress(mining) {
        const ctx = this.ctx;
        const ts = this.tileSize;
        const screen = this.worldToScreen(mining.x, mining.y);
        const progress = mining.progress / mining.total;
        const stage = Math.floor(progress * 4);
        if (stage <= 0) return;

        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.lineWidth = 1;
        // 画裂纹
        const cracks = [
            [[0.2, 0.2], [0.8, 0.8]],
            [[0.8, 0.2], [0.2, 0.8]],
            [[0.5, 0], [0.5, 1]],
            [[0, 0.5], [1, 0.5]],
        ];
        for (let i = 0; i < stage; i++) {
            const [a, b] = cracks[i];
            ctx.beginPath();
            ctx.moveTo(screen.x + a[0] * ts, screen.y + a[1] * ts);
            ctx.lineTo(screen.x + b[0] * ts, screen.y + b[1] * ts);
            ctx.stroke();
        }
    }

    // 更新摄像机（跟随玩家）
    updateCamera(player, dt) {
        const targetX = player.x;
        const targetY = player.centerY;
        const lerp = CONFIG.CAMERA_LERP;
        this.camX += (targetX - this.camX) * lerp;
        this.camY += (targetY - this.camY) * lerp;
    }
}