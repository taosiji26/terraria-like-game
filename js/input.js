// 输入处理
class Input {
    constructor(canvas) {
        this.canvas = canvas;
        this.keys = {};
        this.mouseX = 0;
        this.mouseY = 0;
        this.mouseDown = false;
        this.rightMouseDown = false;
        this.mouseInGame = false;
        this.wheel = 0;

        // 一次性事件（在 game 中消费）
        this.justPressed = new Set();
        this.justReleased = new Set();
        this.justRightClicked = false;
        this.justLeftClicked = false;

        this.bind();
    }

    bind() {
        window.addEventListener('keydown', (e) => {
            if (e.repeat) return;
            this.keys[e.code] = true;
            this.justPressed.add(e.code);
        });
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            this.justReleased.add(e.code);
        });

        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
            this.mouseY = e.clientY - rect.top;
            this.mouseInGame = true;
        });
        this.canvas.addEventListener('mouseenter', () => { this.mouseInGame = true; });
        this.canvas.addEventListener('mouseleave', () => { this.mouseInGame = false; });

        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) {
                this.mouseDown = true;
                this.justLeftClicked = true;
            } else if (e.button === 2) {
                this.rightMouseDown = true;
                this.justRightClicked = true;
            }
        });
        window.addEventListener('mouseup', (e) => {
            if (e.button === 0) this.mouseDown = false;
            else if (e.button === 2) this.rightMouseDown = false;
        });
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.wheel += Math.sign(e.deltaY);
        }, { passive: false });
    }

    // 获取移动输入状态
    getMoveInput() {
        return {
            left: this.keys['KeyA'] || this.keys['ArrowLeft'],
            right: this.keys['KeyD'] || this.keys['ArrowRight'],
            jump: this.keys['KeyW'] || this.keys['ArrowUp'] || this.keys['Space'],
            down: this.keys['KeyS'] || this.keys['ArrowDown'],
        };
    }

    // 消费一次性事件
    consumeKey(code) {
        if (this.justPressed.has(code)) {
            this.justPressed.delete(code);
            return true;
        }
        return false;
    }

    // 帧结束时清理
    endFrame() {
        this.justPressed.clear();
        this.justReleased.clear();
        this.justLeftClicked = false;
        this.justRightClicked = false;
        this.wheel = 0;
    }
}