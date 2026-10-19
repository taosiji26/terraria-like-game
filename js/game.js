// 主游戏逻辑：状态机、主循环、生成僵尸、HUD更新
class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.renderer = new Renderer(canvas);
        this.input = new Input(canvas);
        this.particles = new ParticleSystem();

        this.state = 'menu'; // menu | playing | dead
        this.world = null;
        this.player = null;
        this.enemies = [];
        this.dayNight = new DayNightCycle();

        this.lastTime = 0;
        this.message = null;
        this.messageTimer = 0;

        this.craftingOpen = false;

        // 用于生成僵尸的随机
        this.spawnRng = Math.random;

        window.addEventListener('resize', () => this.renderer.resize());
    }

    // 开始新游戏
    newGame() {
        this.world = new World();
        const spawn = this.world.findSpawnPoint();
        this.player = new Player(this.world, spawn);
        this.enemies = [];
        this.dayNight = new DayNightCycle();
        this.particles.clear();
        this.state = 'playing';
        this.craftingOpen = false;

        // 给玩家初始物品（便于测试）
        this.player.inventory.addItem(ITEM.WOOD_PICKAXE, 1);
        this.player.inventory.addItem(ITEM.WOOD_AXE, 1);
        this.player.inventory.addItem(ITEM.WOOD_SWORD, 1);
        this.player.inventory.addItem(ITEM.TORCH, 10);
        this.player.inventory.addItem(ITEM.APPLE, 5);

        this.renderer.camX = spawn.x;
        this.renderer.camY = spawn.y - 1;
    }

    // 主循环
    loop(time) {
        const dt = Math.min((time - this.lastTime) / 1000, 0.05);
        this.lastTime = time;

        if (this.state === 'playing') {
            this.update(dt);
            this.renderer.updateCamera(this.player, dt);
            this.renderer.render(this);
            this.updateHUD();
        } else if (this.state === 'dead') {
            // 死亡时保持渲染最后一帧
            this.renderer.render(this);
        }

        this.input.endFrame();
        requestAnimationFrame((t) => this.loop(t));
    }

    start() {
        requestAnimationFrame((t) => {
            this.lastTime = t;
            this.loop(t);
        });
    }

    // ===== 更新 =====
    update(dt) {
        const input = this.input;
        const player = this.player;

        // 处理一次性按键
        this.handleKeyPresses();

        // 玩家移动输入
        const moveInput = input.getMoveInput();
        player.update(dt, moveInput);

        // 滚轮切换物品栏
        if (input.wheel !== 0) {
            player.inventory.scroll(input.wheel > 0 ? 1 : -1);
        }

        // 鼠标挖掘/攻击/放置
        this.handleMouseActions(dt);

        // 敌人更新
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i];
            e.update(dt, this.world, player);
            if (e.dead) {
                this.particles.emitHit(e.centerX, e.centerY, '#4a7a4a');
                this.enemies.splice(i, 1);
            }
        }

        // 昼夜
        this.dayNight.update(dt);
        if (this.dayNight.justChangedToNight) {
            this.showMessage('夜幕降临，僵尸出现了！');
        }
        if (this.dayNight.justChangedToDay) {
            this.showMessage('天亮了，僵尸消失了。');
            // 清除剩余僵尸
            this.enemies = [];
        }

        // 生成僵尸
        if (this.dayNight.shouldSpawnZombie(dt) && this.enemies.length < CONFIG.ZOMBIE_MAX_COUNT) {
            this.spawnZombie();
        }

        // 粒子
        this.particles.update(dt);

        // 提示信息计时
        if (this.messageTimer > 0) {
            this.messageTimer -= dt;
            if (this.messageTimer <= 0) this.message = null;
        }

        // 死亡
        if (player.dead) {
            this.state = 'dead';
            this.onDeath();
        }
    }

    handleKeyPresses() {
        const input = this.input;
        // 打开制作菜单
        if (input.consumeKey('KeyE')) {
            this.craftingOpen = !this.craftingOpen;
            document.getElementById('crafting-menu').classList.toggle('hidden', !this.craftingOpen);
            if (this.craftingOpen) this.updateCraftingMenu();
        }
        // 手电筒
        if (input.consumeKey('KeyF')) {
            this.player.flashlight = !this.player.flashlight;
            this.showMessage(this.player.flashlight ? '手电筒开' : '手电筒关');
        }
        // 吃食物
        if (input.consumeKey('KeyR')) {
            if (this.player.eat()) {
                this.showMessage('吃了东西');
            }
        }
        // 数字键选择物品栏
        for (let i = 1; i <= 9; i++) {
            if (input.consumeKey('Digit' + i)) {
                this.player.inventory.select(i - 1);
            }
        }
    }

    handleMouseActions(dt) {
        const input = this.input;
        const player = this.player;
        if (!input.mouseInGame) return;

        const target = this.renderer.screenToBlock(input.mouseX, input.mouseY);
        const inRange = player.inRange(target.x, target.y, CONFIG.MINING_RANGE);

        // 右键放置
        if (input.justRightClicked) {
            player.tryPlace(target.x, target.y);
        }

        // 左键：如果目标方块是空气且附近有敌人，则攻击；否则挖掘
        const block = this.world.getBlock(target.x, target.y);
        if (input.mouseDown) {
            if (block === BLOCK.AIR) {
                // 攻击
                if (input.justLeftClicked) {
                    player.attack(this.enemies);
                }
            } else {
                // 挖掘
                const minedBlockId = this.world.getBlock(target.x, target.y);
                const drop = player.updateMining(dt, target.x, target.y, true, inRange);
                if (drop) {
                    this.onBlockMined(target.x, target.y, drop, minedBlockId);
                }
            }
        } else {
            player.mining = null;
        }
    }

    onBlockMined(x, y, drop, minedBlockId) {
        // 粒子颜色
        const data = getBlockData(minedBlockId);
        const particleColor = data.color || '#92692c';
        this.particles.emitBlockBreak(x, y, particleColor);

        if (drop) {
            const left = this.player.inventory.addItem(drop.item, drop.count);
            if (left > 0) {
                this.showMessage('背包满了！');
            }
        }
    }

    // ===== 生成僵尸 =====
    spawnZombie() {
        const player = this.player;
        const dist = CONFIG.ZOMBIE_SPAWN_DISTANCE;
        // 在玩家左右两侧随机
        const side = Math.random() < 0.5 ? -1 : 1;
        const x = Math.floor(player.x + side * dist);
        if (x < 1 || x >= this.world.width - 1) return;

        // 找到地表
        let y = 0;
        for (let yy = 0; yy < this.world.height; yy++) {
            if (isSolid(this.world.getBlock(x, yy))) {
                y = yy - 2;
                break;
            }
        }
        // 确保位置是空气
        if (isSolid(this.world.getBlock(x, y)) || isSolid(this.world.getBlock(x, y - 1))) return;

        this.enemies.push(new Zombie(x + 0.5, y + 1));
    }

    // ===== HUD =====
    updateHUD() {
        const p = this.player;
        // 生命
        const hb = document.getElementById('health-bar');
        hb.style.width = (p.health / p.maxHealth * 100) + '%';
        document.getElementById('health-text').textContent = `${Math.ceil(p.health)}/${p.maxHealth}`;
        // 饥饿
        const hub = document.getElementById('hunger-bar');
        hub.style.width = (p.hunger / p.maxHunger * 100) + '%';
        document.getElementById('hunger-text').textContent = `${Math.ceil(p.hunger)}/${p.maxHunger}`;
        // 时间
        document.getElementById('time-text').textContent = this.dayNight.getTimeString();
        document.getElementById('time-icon').textContent = this.dayNight.getTimeIcon();

        // 物品栏
        this.updateHotbar();

        // 提示
        const mb = document.getElementById('message-box');
        if (this.message) {
            mb.textContent = this.message;
            mb.classList.remove('hidden');
        } else {
            mb.classList.add('hidden');
        }
    }

    updateHotbar() {
        const container = document.getElementById('hotbar-slots');
        const inv = this.player.inventory;
        // 只在第一次或格数变化时重建
        if (container.children.length !== inv.size) {
            container.innerHTML = '';
            for (let i = 0; i < inv.size; i++) {
                const slot = document.createElement('div');
                slot.className = 'hotbar-slot';
                slot.innerHTML = `<span class="slot-key">${i + 1}</span><span class="slot-icon"></span><span class="slot-count"></span>`;
                container.appendChild(slot);
            }
        }
        for (let i = 0; i < inv.size; i++) {
            const slot = container.children[i];
            const s = inv.slots[i];
            slot.classList.toggle('active', i === inv.selected);
            const icon = slot.querySelector('.slot-icon');
            const count = slot.querySelector('.slot-count');
            if (s) {
                const data = getItemData(s.item);
                icon.textContent = data.icon || '?';
                count.textContent = s.count > 1 ? s.count : '';
            } else {
                icon.textContent = '';
                count.textContent = '';
            }
        }
    }

    updateCraftingMenu() {
        const list = document.getElementById('crafting-list');
        list.innerHTML = '';
        const inv = this.player.inventory;
        for (const recipe of RECIPES) {
            const can = inv.canCraft(recipe);
            const resultData = getItemData(recipe.result.item);
            const div = document.createElement('div');
            div.className = 'craft-item' + (can ? '' : ' cant-craft');
            div.innerHTML = `
                <div class="craft-icon">${resultData.icon}</div>
                <div class="craft-info">
                    <div class="craft-name">${resultData.name} ×${recipe.result.count}</div>
                    <div class="craft-cost">${recipe.cost.map(c => {
                        const have = inv.countItem(c.item);
                        const d = getItemData(c.item);
                        const cls = have >= c.count ? 'have' : 'need';
                        return `<span class="${cls}">${d.icon}${c.count}</span>`;
                    }).join(' ')}</div>
                </div>
            `;
            if (can) {
                div.addEventListener('click', () => {
                    if (inv.craft(recipe)) {
                        this.updateCraftingMenu();
                        this.updateHotbar();
                    }
                });
            }
            list.appendChild(div);
        }
    }

    showMessage(msg) {
        this.message = msg;
        this.messageTimer = 2.5;
    }

    onDeath() {
        document.getElementById('death-screen').classList.remove('hidden');
        document.getElementById('death-info').textContent = `生存了 ${this.dayNight.day} 天`;
    }

    respawn() {
        const spawn = this.world.findSpawnPoint();
        this.player.respawn(spawn);
        this.enemies = [];
        this.state = 'playing';
        document.getElementById('death-screen').classList.add('hidden');
    }

    quitToMenu() {
        this.state = 'menu';
        document.getElementById('death-screen').classList.add('hidden');
        document.getElementById('hud').classList.add('hidden');
        document.getElementById('main-menu').classList.remove('hidden');
    }
}