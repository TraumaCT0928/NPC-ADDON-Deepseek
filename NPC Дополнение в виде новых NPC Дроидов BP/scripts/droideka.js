import { world, system } from "@minecraft/server";

const CONFIG = {
    SEARCH_RADIUS: 64,
    ATTACK_RADIUS: 32,
    CHECK_INTERVAL: 10
};

class DroidekaManager {
    constructor() {
        this.droidekas = new Map();
        this.init();
        this.startLoop();
    }

    init() {
        for (const player of world.getPlayers()) {
            const droidekas = player.dimension.getEntities({ type: "totr:droideka" });
            for (const d of droidekas) this.register(d);
        }
        world.afterEvents.entitySpawn.subscribe((event) => {
            if (event.entity.typeId === "totr:droideka") this.register(event.entity);
        });
    }

    register(entity) {
        if (this.droidekas.has(entity.id)) return;
        this.droidekas.set(entity.id, { entity });
        entity.setProperty("totr:is_rolled", true);
        entity.triggerEvent("totr:roll");
    }

    findNearestTarget(entity) {
        let nearest = null;
        let nearestDist = Infinity;

        const players = entity.dimension.getPlayers({
            location: entity.location,
            maxDistance: CONFIG.SEARCH_RADIUS
        });
        for (const player of players) {
            const dist = this.getDistance(entity.location, player.location);
            if (dist < nearestDist) {
                nearestDist = dist;
                nearest = player;
            }
        }

        if (!nearest) {
            const mobs = entity.dimension.getEntities({
                families: ["animal", "monster"],
                location: entity.location,
                maxDistance: CONFIG.SEARCH_RADIUS
            });
            for (const mob of mobs) {
                if (mob.id === entity.id) continue;
                const dist = this.getDistance(entity.location, mob.location);
                if (dist < nearestDist) {
                    nearestDist = dist;
                    nearest = mob;
                }
            }
        }
        return { target: nearest, distance: nearestDist };
    }

    getDistance(loc1, loc2) {
        const dx = loc1.x - loc2.x;
        const dy = loc1.y - loc2.y;
        const dz = loc1.z - loc2.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    update(data) {
        const entity = data.entity;
        if (!entity || !entity.isValid()) {
            this.droidekas.delete(entity.id);
            return;
        }

        const { target, distance } = this.findNearestTarget(entity);
        const isRolled = entity.getProperty("totr:is_rolled") === true;

        if (target && distance <= CONFIG.ATTACK_RADIUS) {
            if (isRolled) {
                entity.triggerEvent("totr:unroll");
                entity.setProperty("totr:is_rolled", false);
                entity.runCommand("effect @s slowness 5 255 true");
                entity.runCommand("effect @s weakness 5 255 true");
            }
        } else {
            if (!isRolled) {
                entity.triggerEvent("totr:roll");
                entity.setProperty("totr:is_rolled", true);
                entity.runCommand("effect @s clear");
            }
        }
    }

    startLoop() {
        system.runInterval(() => {
            for (const [, data] of this.droidekas) {
                this.update(data);
            }
        }, CONFIG.CHECK_INTERVAL);
    }
}

let manager = null;
world.afterEvents.worldInitialize.subscribe(() => {
    manager = new DroidekaManager();
    console.log("§a[Droideka] Система управления запущена");
});