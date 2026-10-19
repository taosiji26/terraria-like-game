// 粒子系统：挖掘碎屑、攻击效果、死亡效果
class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    // 添加方块破碎粒子
    emitBlockBreak(x, y, color) {
        const cx = x + 0.5;
        const cy = y + 0.5;
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: cx,
                y: cy,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4 - 2,
                life: 0.6 + Math.random() * 0.3,
                maxLife: 0.9,
                color: color,
                size: 2 + Math.random() * 2,
                gravity: true,
            });
        }
    }

    // 攻击击中粒子
    emitHit(x, y, color = '#ef4444') {
        for (let i = 0; i < 6; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 5,
                vy: (Math.random() - 0.5) * 5 - 1,
                life: 0.4,
                maxLife: 0.4,
                color: color,
                size: 2,
                gravity: false,
            });
        }
    }

    // 伤害数字
    emitDamageText(x, y, amount) {
        this.particles.push({
            x: x,
            y: y,
            vx: 0,
            vy: -1.5,
            life: 1.0,
            maxLife: 1.0,
            text: Math.ceil(amount).toString(),
            color: '#fbbf24',
            size: 14,
            gravity: false,
        });
    }

    // 走路尘土
    emitDust(x, y) {
        this.particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 1,
            vy: -Math.random() * 0.5,
            life: 0.4,
            maxLife: 0.4,
            color: 'rgba(150,130,90,0.6)',
            size: 2,
            gravity: false,
        });
    }

    update(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            if (p.gravity) p.vy += 8 * dt;
            p.life -= dt;
            if (p.life <= 0) this.particles.splice(i, 1);
        }
    }

    clear() {
        this.particles.length = 0;
    }
}