import { game } from './engine.js';

function diamond(ctx: CanvasRenderingContext2D, cx: number, cy: number, w: number, h: number, fill: string, stroke?: string): void
{
    ctx.beginPath();
    ctx.moveTo(cx, cy - h / 2);
    ctx.lineTo(cx + w / 2, cy);
    ctx.lineTo(cx, cy + h / 2);
    ctx.lineTo(cx - w / 2, cy);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

/** Painted isometric tiles + layered hero kit (replace textures later for custom art). */
export function paintArt(): void
{
    game.paint('iso-floor', 64, 32, ctx => {
        diamond(ctx, 32, 16, 62, 30, '#2a1c18', '#1a100c');
        diamond(ctx, 32, 14, 40, 18, '#33221c');
        ctx.fillStyle = '#3a2820';
        ctx.fillRect(30, 12, 3, 3);
    });

    game.paint('iso-wall', 64, 56, ctx => {
        // top diamond
        diamond(ctx, 32, 14, 60, 28, '#4a4048', '#1a1418');
        // left face
        ctx.fillStyle = '#2a242c';
        ctx.beginPath();
        ctx.moveTo(2, 14);
        ctx.lineTo(32, 28);
        ctx.lineTo(32, 52);
        ctx.lineTo(2, 38);
        ctx.closePath();
        ctx.fill();
        // right face
        ctx.fillStyle = '#3a343c';
        ctx.beginPath();
        ctx.moveTo(62, 14);
        ctx.lineTo(32, 28);
        ctx.lineTo(32, 52);
        ctx.lineTo(62, 38);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#0c080a';
        ctx.lineWidth = 2;
        ctx.stroke();
    });

    // Layered hero — swap these keys for your own art
    game.paint('hero-body', 40, 52, ctx => {
        ctx.fillStyle = '#1a0c08';
        ctx.beginPath();
        ctx.ellipse(20, 48, 12, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        const cloak = ctx.createLinearGradient(0, 10, 0, 48);
        cloak.addColorStop(0, '#6a1a1a');
        cloak.addColorStop(1, '#2a0808');
        ctx.fillStyle = cloak;
        ctx.beginPath();
        ctx.moveTo(20, 14);
        ctx.lineTo(32, 46);
        ctx.lineTo(8, 46);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#e8c090';
        ctx.beginPath();
        ctx.arc(20, 12, 7, 0, Math.PI * 2);
        ctx.fill();
    });

    game.paint('hero-armor', 40, 52, ctx => {
        ctx.fillStyle = '#5a6878aa';
        ctx.beginPath();
        ctx.moveTo(20, 18);
        ctx.lineTo(30, 42);
        ctx.lineTo(10, 42);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#c0d0e0';
        ctx.lineWidth = 2;
        ctx.stroke();
    });

    game.paint('hero-helm', 40, 52, ctx => {
        ctx.fillStyle = '#808890';
        ctx.beginPath();
        ctx.arc(20, 11, 8, Math.PI, 0);
        ctx.lineTo(28, 14);
        ctx.lineTo(12, 14);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#202428';
        ctx.fillRect(14, 10, 12, 4);
    });

    game.paint('hero-belt', 40, 52, ctx => {
        ctx.fillStyle = '#8a6030';
        ctx.fillRect(10, 34, 20, 6);
        ctx.fillStyle = '#ffd080';
        ctx.fillRect(18, 34, 4, 6);
    });

    game.paint('hero-weapon-basic', 40, 52, ctx => {
        ctx.fillStyle = '#c0c8d0';
        ctx.fillRect(30, 16, 3, 22);
        ctx.fillStyle = '#ffd080';
        ctx.fillRect(28, 14, 7, 4);
    });

    game.paint('hero-weapon-magic', 40, 52, ctx => {
        ctx.fillStyle = '#80c0ff';
        ctx.fillRect(30, 14, 3, 24);
        ctx.fillStyle = '#e0ffff';
        ctx.beginPath();
        ctx.moveTo(31.5, 10);
        ctx.lineTo(36, 16);
        ctx.lineTo(27, 16);
        ctx.closePath();
        ctx.fill();
    });

    game.paint('demon', 44, 48, (ctx, i) => {
        const pulse = i === 1 ? 1.04 : 1;
        ctx.save();
        ctx.translate(22, 24);
        ctx.scale(pulse, pulse);
        ctx.translate(-22, -24);
        ctx.fillStyle = '#5a1018';
        ctx.beginPath();
        ctx.moveTo(22, 8);
        ctx.lineTo(36, 42);
        ctx.lineTo(8, 42);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#ff4020';
        ctx.beginPath();
        ctx.arc(17, 18, 2.5, 0, Math.PI * 2);
        ctx.arc(27, 18, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#3a0808';
        ctx.beginPath();
        ctx.moveTo(12, 10);
        ctx.lineTo(6, 2);
        ctx.lineTo(16, 8);
        ctx.moveTo(32, 10);
        ctx.lineTo(38, 2);
        ctx.lineTo(28, 8);
        ctx.fill();
        ctx.restore();
    }, { frames: 2 });

    game.paint('loot', 28, 28, (ctx, i) => {
        const colors = ['#a0a0a0', '#4080ff', '#ffd040', '#ff8040'];
        diamond(ctx, 14, 14, 24, 20, colors[i] ?? '#fff', '#ffffffaa');
    }, { frames: 4 });

    game.paint('portal', 64, 48, (ctx, i) => {
        const g = ctx.createRadialGradient(32, 24, 4, 32, 24, 28);
        g.addColorStop(0, i === 0 ? '#80ffe0' : '#a0fff0');
        g.addColorStop(0.55, '#2060a0');
        g.addColorStop(1, '#00000000');
        ctx.fillStyle = g;
        diamond(ctx, 32, 24, 56, 40, '#00000000');
        ctx.beginPath();
        ctx.ellipse(32, 24, 22, 16, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#c0fff0';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(32, 24, 18, 12, 0, 0, Math.PI * 2);
        ctx.stroke();
    }, { frames: 2 });

    game.paint('npc', 36, 48, ctx => {
        ctx.fillStyle = '#2a4060';
        ctx.beginPath();
        ctx.moveTo(18, 14);
        ctx.lineTo(30, 44);
        ctx.lineTo(6, 44);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#e0c8a0';
        ctx.beginPath();
        ctx.arc(18, 12, 7, 0, Math.PI * 2);
        ctx.fill();
    });

    game.paint('marker', 28, 16, ctx => {
        ctx.strokeStyle = '#80ffc0cc';
        ctx.lineWidth = 2;
        diamond(ctx, 14, 8, 24, 12, '#80ffc033', '#80ffc0');
    });

    // Inventory icons
    const icon = (name: string, draw: (ctx: CanvasRenderingContext2D) => void) => {
        game.paint(name, 40, 40, ctx => {
            ctx.fillStyle = '#1a1418';
            ctx.fillRect(0, 0, 40, 40);
            ctx.strokeStyle = '#4a4048';
            ctx.strokeRect(1, 1, 38, 38);
            draw(ctx);
        });
    };
    icon('icon-weapon', ctx => {
        ctx.fillStyle = '#c0c8d0';
        ctx.fillRect(18, 6, 4, 28);
        ctx.fillStyle = '#ffd080';
        ctx.fillRect(14, 4, 12, 6);
    });
    icon('icon-helm', ctx => {
        ctx.fillStyle = '#808890';
        ctx.beginPath();
        ctx.arc(20, 18, 12, Math.PI, 0);
        ctx.fill();
        ctx.fillStyle = '#202428';
        ctx.fillRect(12, 18, 16, 6);
    });
    icon('icon-armor', ctx => {
        ctx.fillStyle = '#5a6878';
        ctx.fillRect(10, 10, 20, 24);
        ctx.strokeStyle = '#c0d0e0';
        ctx.strokeRect(10, 10, 20, 24);
    });
    icon('icon-belt', ctx => {
        ctx.fillStyle = '#8a6030';
        ctx.fillRect(6, 16, 28, 10);
        ctx.fillStyle = '#ffd080';
        ctx.fillRect(18, 16, 4, 10);
    });
    icon('icon-amulet', ctx => {
        ctx.strokeStyle = '#c0a060';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(20, 12, 10, 0.2, Math.PI - 0.2);
        ctx.stroke();
        ctx.fillStyle = '#40c0ff';
        ctx.beginPath();
        ctx.arc(20, 26, 7, 0, Math.PI * 2);
        ctx.fill();
    });
    icon('icon-ring', ctx => {
        ctx.strokeStyle = '#ffd040';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(20, 20, 10, 0, Math.PI * 2);
        ctx.stroke();
    });
    // Empty inventory / equip slot frame
    game.paint('slot-frame', 64, 64, ctx => {
        ctx.fillStyle = '#1a141888';
        ctx.fillRect(2, 2, 60, 60);
        ctx.strokeStyle = '#6a6058';
        ctx.lineWidth = 3;
        ctx.strokeRect(3, 3, 58, 58);
        ctx.strokeStyle = '#2a2420';
        ctx.lineWidth = 1;
        ctx.strokeRect(8, 8, 48, 48);
    });
    game.paint('slot-frame-hot', 64, 64, ctx => {
        ctx.fillStyle = '#3a302088';
        ctx.fillRect(2, 2, 60, 60);
        ctx.strokeStyle = '#ffd060';
        ctx.lineWidth = 3;
        ctx.strokeRect(3, 3, 58, 58);
    });

    game.sound.defineAll({
        hit: { type: 'noise', duration: 0.18, filter: { type: 'lowpass', freq: 2200, freqEnd: 400 }, volume: 0.7 },
        swing: { type: 'square', freq: 180, freqEnd: 90, duration: 0.08, volume: 0.35 },
        hurt: { type: 'sawtooth', freq: 140, freqEnd: 60, duration: 0.22, volume: 0.55 },
        pickup: { notes: [660, 880, 1180], duration: 0.22, type: 'triangle', volume: 0.5 },
        levelup: { notes: [392, 523, 659, 784], duration: 0.45, type: 'square', volume: 0.45 },
        death: { type: 'noise', duration: 0.7, filter: { type: 'lowpass', freq: 900, freqEnd: 80 }, volume: 0.85 },
        portal: { type: 'sine', freq: 220, freqEnd: 440, duration: 0.35, volume: 0.4 },
        ui: { type: 'square', freq: 440, freqEnd: 660, duration: 0.06, volume: 0.25 },
        equip: { notes: [520, 780], duration: 0.15, type: 'triangle', volume: 0.4 },
    });
}
