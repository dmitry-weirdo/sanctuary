import { game, type Sprite } from '../engine.js';
import { syncIso } from '../iso.js';

export const MONSTER_RADIUS = 14;
export const MONSTER_SPEED = 95;
export const MONSTER_ATTACK_RANGE = 44;
export const MONSTER_ATTACK_CD = 0.9;

export type MonsterData = {
    kind: 'monster';
    lx: number;
    ly: number;
    level: number;
    life: number;
    lifeMax: number;
    damageMin: number;
    damageMax: number;
    defense: number;
    attackCd: number;
};

export type MonsterSprite = Sprite<MonsterData>;

export function spawnMonster(lx: number, ly: number, level: number): MonsterSprite
{
    const life = 18 + level * 10;
    const demon = game.spawn({
        id: 'demon',
        texture: 'demon',
        x: 0,
        y: 0,
        layer: 'world',
        tags: ['monster', 'enemy'],
        anims: { idle: { strip: 'demon', fps: 4 } },
        data: {
            kind: 'monster' as const,
            lx,
            ly,
            level,
            life,
            lifeMax: life,
            damageMin: 3 + level * 2,
            damageMax: 6 + level * 2,
            defense: level,
            attackCd: 0,
        },
    });
    syncIso(demon, lx, ly);
    demon.play('idle');
    game.bars.create({
        follow: demon,
        width: 36,
        height: 5,
        style: 'flat',
        max: life,
        value: life,
        ghost: true,
        fill: '#c02020',
        track: '#200808',
    });
    return demon as MonsterSprite;
}
