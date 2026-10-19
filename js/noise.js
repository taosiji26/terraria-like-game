// 简单的值噪声 + 分形布朗运动，用于地形生成
class Noise {
    constructor(seed = 12345) {
        this.seed = seed;
        this.cache = new Map();
    }

    // 哈希函数，生成伪随机值 [0,1)
    hash(x) {
        let h = (x * 374761393 + this.seed * 668265263) | 0;
        h = (h ^ (h >> 13)) * 1274126177 | 0;
        h = h ^ (h >> 16);
        return ((h >>> 0) % 100000) / 100000;
    }

    hash2(x, y) {
        return this.hash(x * 73856093 + y * 19349663);
    }

    // 一维值噪声（平滑插值）
    noise1D(x) {
        const xi = Math.floor(x);
        const xf = x - xi;
        const a = this.hash(xi);
        const b = this.hash(xi + 1);
        // 平滑插值
        const t = xf * xf * (3 - 2 * xf);
        return a * (1 - t) + b * t;
    }

    // 二维值噪声
    noise2D(x, y) {
        const xi = Math.floor(x), yi = Math.floor(y);
        const xf = x - xi, yf = y - yi;
        const a = this.hash2(xi, yi);
        const b = this.hash2(xi + 1, yi);
        const c = this.hash2(xi, yi + 1);
        const d = this.hash2(xi + 1, yi + 1);
        const tx = xf * xf * (3 - 2 * xf);
        const ty = yf * yf * (3 - 2 * yf);
        return (a * (1 - tx) + b * tx) * (1 - ty) +
               (c * (1 - tx) + d * tx) * ty;
    }

    // 分形布朗运动（叠加多个八度噪声）
    fbm1D(x, octaves = 4, persistence = 0.5, scale = 0.05) {
        let total = 0, amplitude = 1, frequency = scale, maxValue = 0;
        for (let i = 0; i < octaves; i++) {
            total += this.noise1D(x * frequency) * amplitude;
            maxValue += amplitude;
            amplitude *= persistence;
            frequency *= 2;
        }
        return total / maxValue;
    }

    fbm2D(x, y, octaves = 4, persistence = 0.5, scale = 0.05) {
        let total = 0, amplitude = 1, frequency = scale, maxValue = 0;
        for (let i = 0; i < octaves; i++) {
            total += this.noise2D(x * frequency, y * frequency) * amplitude;
            maxValue += amplitude;
            amplitude *= persistence;
            frequency *= 2;
        }
        return total / maxValue;
    }
}