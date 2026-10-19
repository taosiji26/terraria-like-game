// 昼夜交替系统
class DayNightCycle {
    constructor() {
        this.time = 0; // 当天已过秒数
        this.day = 1;
        this.dayLength = CONFIG.DAY_LENGTH;
        this.dayRatio = CONFIG.DAY_RATIO;
        this.isNight = false;
        this.justChangedToNight = false;
        this.justChangedToDay = false;
        this.zombieSpawnTimer = 0;
    }

    update(dt) {
        this.justChangedToNight = false;
        this.justChangedToDay = false;

        const wasNight = this.isNight;
        this.time += dt;

        if (this.time >= this.dayLength) {
            this.time -= this.dayLength;
            this.day++;
            this.justChangedToDay = true;
        }

        // 判断是否夜晚
        const dayDuration = this.dayLength * this.dayRatio;
        this.isNight = this.time >= dayDuration;

        if (this.isNight && !wasNight) {
            this.justChangedToNight = true;
            this.zombieSpawnTimer = 0;
        }
        if (!this.isNight && wasNight) {
            this.justChangedToDay = true;
            this.zombieSpawnTimer = 0;
        }
    }

    // 获取天空亮度 0~1
    getSkyBrightness() {
        const dayDuration = this.dayLength * this.dayRatio;
        const nightDuration = this.dayLength - dayDuration;
        if (this.time < dayDuration) {
            // 白天
            const t = this.time / dayDuration;
            // 日出渐亮 -> 中午最亮 -> 日落渐暗
            if (t < 0.15) return 0.3 + (t / 0.15) * 0.7; // 日出
            if (t > 0.85) return 0.3 + ((1 - t) / 0.15) * 0.7; // 日落
            return 1.0;
        } else {
            // 夜晚
            const nt = (this.time - dayDuration) / nightDuration;
            // 入夜渐暗 -> 半夜最暗 -> 黎明渐亮
            if (nt < 0.15) return 0.3 - (nt / 0.15) * 0.25;
            if (nt > 0.85) return 0.05 + ((nt - 0.85) / 0.15) * 0.25;
            return 0.05;
        }
    }

    // 获取天空颜色 [r,g,b] 0~1
    getSkyColor() {
        const b = this.getSkyBrightness();
        const dayDuration = this.dayLength * this.dayRatio;
        let r, g, bl;
        if (this.time < dayDuration) {
            // 白天：天蓝
            const t = this.time / dayDuration;
            if (t < 0.15) {
                // 日出：橙红 -> 蓝
                const k = t / 0.15;
                r = 0.9 - k * 0.5;
                g = 0.6 + k * 0.2;
                bl = 0.4 + k * 0.5;
            } else if (t > 0.85) {
                // 日落：蓝 -> 橙红
                const k = (t - 0.85) / 0.15;
                r = 0.4 + k * 0.5;
                g = 0.8 - k * 0.2;
                bl = 0.9 - k * 0.5;
            } else {
                r = 0.4; g = 0.7; bl = 0.95;
            }
        } else {
            // 夜晚：深蓝
            r = 0.05; g = 0.05; bl = 0.15;
        }
        return [r, g, bl];
    }

    // 环境光强度（用于方块光照）
    getAmbientLight() {
        const b = this.getSkyBrightness();
        return CONFIG.AMBIENT_LIGHT_NIGHT + (CONFIG.AMBIENT_LIGHT_DAY - CONFIG.AMBIENT_LIGHT_NIGHT) * b;
    }

    // 是否到了生成僵尸的时间
    shouldSpawnZombie(dt) {
        if (!this.isNight) return false;
        this.zombieSpawnTimer += dt;
        if (this.zombieSpawnTimer >= CONFIG.ZOMBIE_SPAWN_INTERVAL) {
            this.zombieSpawnTimer = 0;
            return true;
        }
        return false;
    }

    // 时间显示文字
    getTimeString() {
        const dayDuration = this.dayLength * this.dayRatio;
        const isDay = this.time < dayDuration;
        let phase;
        if (isDay) {
            const t = this.time / dayDuration;
            if (t < 0.15) phase = '日出';
            else if (t > 0.85) phase = '日落';
            else phase = '白天';
        } else {
            const nt = (this.time - dayDuration) / (this.dayLength - dayDuration);
            if (nt < 0.15) phase = '入夜';
            else if (nt > 0.85) phase = '黎明';
            else phase = '深夜';
        }
        return `第${this.day}天 ${phase}`;
    }

    getTimeIcon() {
        return this.isNight ? '🌙' : '☀';
    }
}