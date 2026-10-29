import type { CombatProvider, Fighter, HitResult } from '../bridge/types.js';

/** Default hit math — replace with your fighting model via setProviders({ combat }). */
export const stubCombat: CombatProvider = {
    fighterFromHero(sheet) {
        return {
            id: 'hero',
            side: 'hero',
            level: sheet.level,
            life: sheet.life,
            lifeMax: sheet.lifeMax,
            damageMin: sheet.damageMin,
            damageMax: sheet.damageMax,
            defense: sheet.defense,
        };
    },

    fighterFromMonster(m) {
        return {
            id: m.id,
            side: 'monster',
            level: m.level,
            life: m.life,
            lifeMax: m.lifeMax,
            damageMin: m.damageMin,
            damageMax: m.damageMax,
            defense: m.defense,
        };
    },

    resolveHit(attacker, defender, roll01): HitResult {
        const t = Math.max(0, Math.min(1, roll01));
        const span = Math.max(0, attacker.damageMax - attacker.damageMin);
        const raw = attacker.damageMin + Math.floor(t * (span + 1));
        const damage = Math.max(1, Math.floor(raw - defender.defense * 0.15));
        const defenderLife = Math.max(0, defender.life - damage);
        return { damage, defenderLife };
    },
};

export function rollFighterDamage(f: Fighter, roll01: number): number
{
    const t = Math.max(0, Math.min(1, roll01));
    const span = Math.max(0, f.damageMax - f.damageMin);
    return f.damageMin + Math.floor(t * (span + 1));
}
