// 入口：初始化游戏、绑定UI、加载流程
(function() {
    const canvas = document.getElementById('game-canvas');
    const game = new Game(canvas);

    // ===== UI 绑定 =====
    const loadingScreen = document.getElementById('loading-screen');
    const mainMenu = document.getElementById('main-menu');
    const hud = document.getElementById('hud');

    // 显示主菜单
    function showMainMenu() {
        loadingScreen.classList.add('hidden');
        mainMenu.classList.remove('hidden');
        hud.classList.add('hidden');
    }

    // 开始新游戏（带加载动画）
    function startNewGame() {
        mainMenu.classList.add('hidden');
        loadingScreen.classList.remove('hidden');
        const progress = document.getElementById('loading-progress');

        // 分步加载（让加载条动起来）
        let step = 0;
        const steps = [
            { label: '生成地形...', pct: 30, fn: () => { game.world = new World(); } },
            { label: '放置玩家...', pct: 60, fn: () => {
                const spawn = game.world.findSpawnPoint();
                game.player = new Player(game.world, spawn);
            }},
            { label: '准备物品...', pct: 80, fn: () => {
                game.player.inventory.addItem(ITEM.WOOD_PICKAXE, 1);
                game.player.inventory.addItem(ITEM.WOOD_AXE, 1);
                game.player.inventory.addItem(ITEM.WOOD_SWORD, 1);
                game.player.inventory.addItem(ITEM.TORCH, 10);
                game.player.inventory.addItem(ITEM.APPLE, 5);
                game.renderer.camX = game.player.x;
                game.renderer.camY = game.player.centerY;
            }},
            { label: '开始游戏...', pct: 100, fn: () => {
                game.enemies = [];
                game.dayNight = new DayNightCycle();
                game.particles.clear();
                game.state = 'playing';
            }},
        ];

        function nextStep() {
            if (step >= steps.length) {
                loadingScreen.classList.add('hidden');
                hud.classList.remove('hidden');
                return;
            }
            const s = steps[step];
            progress.style.width = s.pct + '%';
            setTimeout(() => {
                s.fn();
                step++;
                nextStep();
            }, 150);
        }
        nextStep();
    }

    // 按钮事件
    document.getElementById('btn-new-game').addEventListener('click', startNewGame);
    document.getElementById('btn-how-to-play').addEventListener('click', () => {
        document.getElementById('how-to-play').classList.remove('hidden');
    });
    document.getElementById('btn-close-help').addEventListener('click', () => {
        document.getElementById('how-to-play').classList.add('hidden');
    });
    document.getElementById('btn-close-crafting').addEventListener('click', () => {
        game.craftingOpen = false;
        document.getElementById('crafting-menu').classList.add('hidden');
    });
    document.getElementById('btn-respawn').addEventListener('click', () => game.respawn());
    document.getElementById('btn-quit').addEventListener('click', () => game.quitToMenu());

    // 防止右键菜单
    document.addEventListener('contextmenu', (e) => e.preventDefault());

    // 启动游戏循环
    showMainMenu();
    game.start();
})();