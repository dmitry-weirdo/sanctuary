import { game } from '../engine.js';
import { listen, tapped } from '../input.js';
import { getProviders } from '../bridge/providers.js';
import type { DialogueTurn } from '../bridge/types.js';
import { buildRoomView } from '../dungeon/roomView.js';
import { toWorld, syncIso } from '../iso.js';
import {
    ATTACK_COOLDOWN,
    MELEE_RANGE,
    PLAYER_RADIUS,
    PLAYER_SPEED,
    clearHeroOverlays,
    setMoveTarget,
    spawnPlayer,
    syncPlayerIso,
} from '../entities/Player.js';
import {
    MONSTER_ATTACK_CD,
    MONSTER_ATTACK_RANGE,
    MONSTER_RADIUS,
    MONSTER_SPEED,
    spawnMonster,
    type MonsterSprite,
} from '../entities/Monster.js';
import { spawnLoot, type LootSprite } from '../entities/LootDrop.js';
import { spawnNpc } from '../entities/Npc.js';
import { rollStubDrop } from '../systems/stubItems.js';
import { createHud } from '../ui/Hud.js';
import { addToBag, resetRun, run } from '../run.js';

export const PLAY_ZOOM = 1.7;
const FIELD_REBUILD = 0.2;
const PICKUP_RANGE = 48;
const LOOT_HIT = 32;
const TALK_RANGE = 90;
const PORTAL_RANGE = 48;
const MONSTERS_PER_FLOOR = 5;
const MAX_FLOOR = 3;

let stopListening = (): void => {};

function dist(ax: number, ay: number, bx: number, by: number): number
{
    return Math.hypot(ax - bx, ay - by);
}

function openTalk(lines: DialogueTurn[], onDone?: () => void): void
{
    if (lines.length === 0) {
        onDone?.();
        return;
    }
    run.talking = true;
    const portrait = game.spawn({
        id: 'akara-portrait',
        texture: 'portrait-akara',
        x: 150,
        y: 560,
        width: 200,
        height: 250,
        layer: 'overlay',
        z: 20,
        visible: false,
    });
    const backdrop = game.spawn({
        id: 'talk-panel',
        texture: 'ui-sheet',
        x: 820,
        y: 575,
        width: 860,
        height: 210,
        layer: 'overlay',
        z: 5,
        visible: true,
    });
    game.dialogue.open({
        lines,
        speed: 40,
        reveal: 'typewriter',
        rect: { x: 300, y: 490, width: 940, height: 190 },
        onLine: (_i, turn) => {
            portrait.visible = Boolean(turn.speaker);
        },
        onComplete: () => {
            run.talking = false;
            portrait.destroy();
            backdrop.destroy();
            onDone?.();
        },
    });
}

export const Play = {
    name: 'play',
    enter(): void {
        clearHeroOverlays();
        const providers = getProviders();
        if (!run.hero || run.dead || run.won) {
            resetRun(providers.stats.createHero('Wanderer'));
        }
        const hero = run.hero!;
        run.dead = false;
        run.won = false;
        run.talking = false;
        run.menuOpen = false;
        providers.stats.recalc(hero);

        game.background.color('#0a0608');
        game.lights.ambient('#3a2a22');
        game.lights.modulate(0.55);
        game.post.add('vignette', { strength: 0.42, radius: 0.85, color: '#0a0608' });

        const room = game.arenaLayout.generate({
            seed: 1000 + run.floor * 97,
            cols: 14,
            rows: 18,
            cell: 40,
            style: 'ruins',
            obstacles: 11,
            start: 'bottom',
            exit: 'top',
        });
        const { width, height } = buildRoomView(room);

        const player = spawnPlayer(room.start.x, room.start.y, hero);
        const npc = spawnNpc(room.start.x + 56, room.start.y - 20, 'Akara');

        const spawns = game.arenaLayout.spawns(room, MONSTERS_PER_FLOOR + run.floor, room.seed + 3, 160);
        for (const p of spawns) {
            spawnMonster(p.x, p.y, run.floor);
        }

        const marker = game.spawn({
            id: 'marker',
            texture: 'marker',
            x: player.x,
            y: player.y,
            layer: 'floor',
            visible: false,
            z: -10,
        });

        game.camera.bounds = { x: 0, y: 0, w: width, h: height };
        game.rig.follow(player);
        game.camera.zoom = PLAY_ZOOM;

        const hud = createHud(hero);
        hud.setFloor(run.floor);
        game.ui.pauseButton();
        game.ui.muteButton();

        stopListening = listen();

        const logical = { x: player.data.lx, y: player.data.ly };
        let playerField = game.arenaLayout.field(room, logical);
        let chaseField = game.arenaLayout.field(room, logical);
        let fieldAge = 0;

        const rebuildFields = (): void => {
            if (player.data.hasTarget) {
                playerField = game.arenaLayout.field(room, {
                    x: player.data.targetX,
                    y: player.data.targetY,
                });
            }
            chaseField = game.arenaLayout.field(room, { x: player.data.lx, y: player.data.ly });
            fieldAge = 0;
        };
        rebuildFields();

        const killMonster = (monster: MonsterSprite): void => {
            const xp = providers.stats.xpForKill({
                monsterId: monster.id,
                monsterLevel: monster.data.level,
                heroLevel: hero.level,
            });
            const leveled = providers.stats.applyXp(hero, xp);
            run.kills += 1;
            game.sound.play('hit');
            game.feel.shake(5, 0.15);
            game.particles.burst({
                x: monster.x,
                y: monster.y,
                count: 22,
                layer: 'fx',
                frame: 'particle:spark',
                blend: 'add',
                speed: [60, 180],
                lifespan: [0.25, 0.55],
                color: ['#ff8060', '#801010'],
            });
            const drop = rollStubDrop(
                monster.data.level,
                game.rng.between(0, 1),
                game.rng.between(0, 1),
                game.rng.between(0, 1),
            );
            spawnLoot(monster.data.lx, monster.data.ly, drop);
            monster.destroy();
            hud.sync(hero);
            if (leveled) {
                game.sound.play('levelup');
                game.feel.flash('#ffd080', 0.25);
                const lines = providers.dialogue.onLevelUp(hero.level);
                if (lines) openTalk(lines);
            }
        };

        const tryAttack = (target: MonsterSprite): void => {
            if (player.data.attackCd > 0 || run.talking) return;
            if (dist(player.data.lx, player.data.ly, target.data.lx, target.data.ly) > MELEE_RANGE) {
                setMoveTarget(player, target.data.lx, target.data.ly);
                syncIso(marker, target.data.lx, target.data.ly);
                marker.visible = true;
                rebuildFields();
                return;
            }
            player.data.attackCd = ATTACK_COOLDOWN;
            game.sound.play('swing');
            const atk = providers.combat.fighterFromHero(hero);
            const def = providers.combat.fighterFromMonster({
                id: target.id,
                level: target.data.level,
                life: target.data.life,
                lifeMax: target.data.lifeMax,
                damageMin: target.data.damageMin,
                damageMax: target.data.damageMax,
                defense: target.data.defense,
            });
            const hit = providers.combat.resolveHit(atk, def, game.rng.between(0, 1));
            target.data.life = hit.defenderLife;
            const bar = game.bars.of(target);
            if (bar) bar.value = target.data.life;
            game.feel.hitstop(0.04);
            target.tint = '#ff8080';
            game.after(0.12, () => { if (target.alive) target.tint = '#ffffff'; });
            if (target.data.life <= 0) killMonster(target);
        };

        let seekLoot: LootSprite | null = null;

        const takeLoot = (drop: LootSprite): void => {
            if (!drop.alive || drop.data.hold) return;
            if (!addToBag(drop.data.item)) {
                hud.setLootHint('Bag full — drag something onto Drop to ground');
                return;
            }
            hud.showPickup(drop.data.item);
            hud.setLootHint('Click move · click loot · C character · E talk');
            game.sound.play('pickup');
            const lines = providers.dialogue.onPickup(drop.data.item);
            drop.destroy();
            if (lines) openTalk(lines);
        };

        const approachLoot = (drop: LootSprite): void => {
            seekLoot = drop;
            if (dist(player.data.lx, player.data.ly, drop.data.lx, drop.data.ly) <= PICKUP_RANGE) {
                takeLoot(drop);
                seekLoot = null;
                player.data.hasTarget = false;
                marker.visible = false;
                return;
            }
            setMoveTarget(player, drop.data.lx, drop.data.ly);
            syncIso(marker, drop.data.lx, drop.data.ly);
            marker.visible = true;
            rebuildFields();
        };

        const enterPortal = (): void => {
            if (dist(player.data.lx, player.data.ly, room.exit.x, room.exit.y) > PORTAL_RANGE) return;
            game.sound.play('portal');
            if (run.floor >= MAX_FLOOR) {
                run.won = true;
                game.scenes.go('gameover');
                return;
            }
            run.floor += 1;
            game.scenes.go('play');
        };

        game.step('play', dt => {
            if (run.menuOpen) return;
            if (game.input.keyPressed('Escape') || game.input.keyPressed('KeyP')) {
                if (!run.talking) game.scenes.push('pause');
                return;
            }
            if (game.input.keyPressed('KeyC') || game.input.keyPressed('KeyI')) {
                if (!run.talking) {
                    game.sound.play('ui');
                    game.scenes.push('character');
                }
                return;
            }
            if (run.talking || run.dead) return;

            player.data.attackCd = Math.max(0, player.data.attackCd - dt);
            fieldAge += dt;
            if (fieldAge >= FIELD_REBUILD) rebuildFields();

            const tapScreen = tapped();
            if (tapScreen) {
                // taps are camera world (iso screen space) → logical
                const tap = toWorld(tapScreen.x, tapScreen.y);
                let foe: MonsterSprite | undefined;
                for (const m of game.roster.tagged('monster')) {
                    const mon = m as MonsterSprite;
                    if (dist(mon.data.lx, mon.data.ly, tap.x, tap.y) <= 36) {
                        foe = mon;
                        break;
                    }
                }
                let lootHit: LootSprite | undefined;
                for (const raw of game.roster.tagged('loot')) {
                    const drop = raw as LootSprite;
                    if (dist(drop.data.lx, drop.data.ly, tap.x, tap.y) <= LOOT_HIT) {
                        lootHit = drop;
                        break;
                    }
                }
                const talkHit = dist(npc.data.lx, npc.data.ly, tap.x, tap.y) <= 36;
                if (foe?.alive && lootHit?.alive) {
                    const toFoe = dist(foe.data.lx, foe.data.ly, tap.x, tap.y);
                    const toLoot = dist(lootHit.data.lx, lootHit.data.ly, tap.x, tap.y);
                    if (toLoot <= toFoe) foe = undefined;
                    else lootHit = undefined;
                }
                if (foe?.alive) {
                    seekLoot = null;
                    tryAttack(foe);
                }
                else if (lootHit?.alive) {
                    approachLoot(lootHit);
                }
                else if (talkHit && dist(player.data.lx, player.data.ly, npc.data.lx, npc.data.ly) <= TALK_RANGE) {
                    seekLoot = null;
                    openTalk(providers.dialogue.intro());
                }
                else {
                    seekLoot = null;
                    setMoveTarget(player, tap.x, tap.y);
                    syncIso(marker, tap.x, tap.y);
                    marker.visible = true;
                    rebuildFields();
                }
            }

            if (game.input.keyPressed('KeyE')
                && dist(player.data.lx, player.data.ly, npc.data.lx, npc.data.ly) <= TALK_RANGE) {
                openTalk(providers.dialogue.intro());
            }

            if (player.data.hasTarget) {
                const toGo = dist(player.data.lx, player.data.ly, player.data.targetX, player.data.targetY);
                if (toGo < 10) {
                    player.data.hasTarget = false;
                    marker.visible = false;
                }
                else {
                    const v = game.arenaLayout.steer(
                        playerField,
                        { x: player.data.lx, y: player.data.ly },
                        room.cell,
                    );
                    logical.x = player.data.lx;
                    logical.y = player.data.ly;
                    game.arenaLayout.move(
                        room,
                        logical,
                        v.x * PLAYER_SPEED * dt,
                        v.y * PLAYER_SPEED * dt,
                        PLAYER_RADIUS,
                    );
                    player.data.lx = logical.x;
                    player.data.ly = logical.y;
                    if (Math.abs(v.x) > 0.05) player.sx = v.x < 0 ? -1 : 1;
                    syncPlayerIso(player);
                }
            }

            for (const raw of [...game.roster.tagged('monster')]) {
                const monster = raw as MonsterSprite;
                if (!monster.alive) continue;
                monster.data.attackCd = Math.max(0, monster.data.attackCd - dt);
                const d = dist(monster.data.lx, monster.data.ly, player.data.lx, player.data.ly);
                if (d <= MONSTER_ATTACK_RANGE) {
                    if (monster.data.attackCd <= 0) {
                        monster.data.attackCd = MONSTER_ATTACK_CD;
                        const atk = providers.combat.fighterFromMonster({
                            id: monster.id,
                            level: monster.data.level,
                            life: monster.data.life,
                            lifeMax: monster.data.lifeMax,
                            damageMin: monster.data.damageMin,
                            damageMax: monster.data.damageMax,
                            defense: monster.data.defense,
                        });
                        const def = providers.combat.fighterFromHero(hero);
                        const hit = providers.combat.resolveHit(atk, def, game.rng.between(0, 1));
                        hero.life = hit.defenderLife;
                        game.sound.play('hurt');
                        game.feel.shake(6, 0.2);
                        player.tint = '#ff6060';
                        game.after(0.1, () => { if (player.alive) player.tint = '#ffffff'; });
                        hud.sync(hero);
                        if (hero.life <= 0) {
                            run.dead = true;
                            game.sound.play('death');
                            game.feel.flash('#400010', 0.4);
                            game.after(0.6, () => game.scenes.go('gameover'));
                            return;
                        }
                    }
                }
                else {
                    const v = game.arenaLayout.steer(
                        chaseField,
                        { x: monster.data.lx, y: monster.data.ly },
                        room.cell,
                    );
                    logical.x = monster.data.lx;
                    logical.y = monster.data.ly;
                    game.arenaLayout.move(
                        room,
                        logical,
                        v.x * MONSTER_SPEED * dt,
                        v.y * MONSTER_SPEED * dt,
                        MONSTER_RADIUS,
                    );
                    monster.data.lx = logical.x;
                    monster.data.ly = logical.y;
                    syncIso(monster, monster.data.lx, monster.data.ly);
                }
            }

            if (seekLoot) {
                if (!seekLoot.alive || seekLoot.data.hold) seekLoot = null;
                else if (dist(player.data.lx, player.data.ly, seekLoot.data.lx, seekLoot.data.ly) <= PICKUP_RANGE) {
                    takeLoot(seekLoot);
                    seekLoot = null;
                    player.data.hasTarget = false;
                    marker.visible = false;
                }
            }
            if (!game.input.pointer?.down) {
                for (const raw of game.roster.tagged('loot')) {
                    const drop = raw as LootSprite;
                    if (drop.data.hold) drop.data.hold = false;
                }
            }
            enterPortal();
            hud.sync(hero);
        });
    },
    exit(): void {
        stopListening();
        clearHeroOverlays();
    },
};
