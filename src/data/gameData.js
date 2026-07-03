// Core game data for TBH: Task Bar Hero.
// All values are fan-datamined and may shift with patches. Costs marked "approx"
// are community estimates; only Rune of War / Command I / Command II are confirmed.

export const ROLES = {
  TANK: 'Tank',
  BRUISER: 'Bruiser',
  HEALER: 'Healer / Support',
  RANGED_DPS: 'Ranged DPS',
  BURST_DPS: 'Burst DPS',
}

export const FORMATION = {
  FRONT: 'Front',
  MID: 'Mid',
  BACK: 'Back',
}

// stats listed in rough priority order for the hero's role
export const HEROES = [
  {
    id: 'knight',
    name: 'Knight',
    baseHp: 130,
    role: ROLES.TANK,
    formation: FORMATION.FRONT,
    delivery: 'Melee',
    blurb: 'Frontline tank. Soaks hits so your squishy DPS can keep firing from the back.',
    priorityStats: ['MaxHP', 'Armor', 'AttackDamage'],
    abilities: [
      'Aegis Field',
      'Base Attack',
      'Dash Attack',
      'Revenge Attack',
      'Sacred Blade',
      'Strong Attack',
      'Unyielding Will',
    ],
    // recommended loadout (ability name -> why)
    recommended: {
      'Aegis Field': 'Damage shield for the whole front — top survival pick.',
      'Unyielding Will': 'Survive-a-lethal-hit / sustain; keeps the wall standing.',
      'Strong Attack': 'Reliable single-target damage so the Knight still contributes.',
    },
  },
  {
    id: 'slayer',
    name: 'Slayer',
    baseHp: 115,
    role: ROLES.BRUISER,
    formation: FORMATION.FRONT,
    delivery: 'Melee (AoE)',
    blurb: 'Melee AoE bruiser. Self-sustaining frontliner that thins packs of enemies.',
    priorityStats: ['AttackDamage', 'MaxHP', 'AttackSpeed', 'Armor'],
    abilities: [
      'Axe Spin',
      'Base Attack',
      'Bloodlust',
      'Commander Cry',
      'Crushing Blow',
      'Ground Slam',
      'Slam Jump',
    ],
    recommended: {
      'Axe Spin': 'Spin-to-win AoE — clears trash packs fast.',
      'Bloodlust': 'Lifesteal/sustain so the Slayer can solo the front line.',
      'Commander Cry': 'Party attack buff — value scales with squad size.',
    },
  },
  {
    id: 'priest',
    name: 'Priest',
    baseHp: 95,
    role: ROLES.HEALER,
    formation: FORMATION.MID,
    delivery: 'Projectile',
    dlc: true,
    blurb: 'Healer + party damage buffer (DLC). The single biggest force-multiplier in any comp.',
    priorityStats: ['AttackDamage', 'MaxHP', 'Armor'],
    abilities: [
      'Base Attack',
      'Blessing of Might',
      'Blessing of Warding',
      'Heal',
      'Resurrection',
      'Sanctuary',
      'Wrath of Heaven',
    ],
    recommended: {
      'Blessing of Might': 'TOP-TIER: buffs the ENTIRE party\'s damage. Always slot first.',
      'Heal': 'Keeps the front line alive past the survival threshold.',
      'Blessing of Warding': 'Party-wide mitigation for spike-damage stages.',
    },
  },
  {
    id: 'hunter',
    name: 'Hunter',
    baseHp: 70,
    role: ROLES.RANGED_DPS,
    formation: FORMATION.BACK,
    delivery: 'Summon / Projectile',
    blurb: 'Trap & turret ranged. Places persistent damage sources — great passive idle DPS.',
    priorityStats: ['AttackSpeed', 'CritChance', 'AttackDamage', 'CritDamage'],
    abilities: [
      'Base Attack',
      'Charge Trap',
      'Crossbow Turret',
      'Explosive Bolt',
      'Frost Bolt',
      'Quick Loader',
      'Shock Bolt',
    ],
    recommended: {
      'Crossbow Turret': 'Persistent summoned DPS — ideal for hands-off idle play.',
      'Quick Loader': 'Attack-speed steroid; multiplies everything else.',
      'Explosive Bolt': 'AoE finisher for clustered enemies.',
    },
  },
  {
    id: 'ranger',
    name: 'Ranger',
    baseHp: 60,
    role: ROLES.RANGED_DPS,
    formation: FORMATION.BACK,
    delivery: 'Projectile',
    blurb: 'Fast projectile DPS. Highest sustained single-target output — keep it protected.',
    priorityStats: ['AttackSpeed', 'CritChance', 'AttackDamage', 'CritDamage'],
    abilities: [
      'Arrow Rain',
      'Barrage',
      'Base Attack',
      'Base Projectile',
      'Piercing Arrow',
      'Skewer Shot',
      'Spread Shot',
      'Swift Surge',
    ],
    recommended: {
      'Swift Surge': 'Attack-speed burst — the Ranger\'s DPS scales hardest with AS.',
      'Piercing Arrow': 'Line-piercing single-target/row damage.',
      'Arrow Rain': 'AoE for waves; rounds out the kit.',
    },
  },
  {
    id: 'sorcerer',
    name: 'Sorcerer',
    baseHp: 50,
    role: ROLES.BURST_DPS,
    formation: FORMATION.BACK,
    delivery: 'AoE (Elemental)',
    blurb: 'Elemental burst/AoE. Glass cannon — biggest screen-clears, lowest HP. Park it at the back.',
    priorityStats: ['AttackDamage', 'CritDamage', 'CritChance', 'AttackSpeed'],
    abilities: [
      'Base Attack',
      'Fireball',
      'Flame Hydra',
      'Ice Orb',
      'Lightning',
      'Meteor Strike',
      'Snowstorm',
    ],
    recommended: {
      'Meteor Strike': 'Heavy AoE nuke — premier wave-clear.',
      'Lightning': 'Chains across packs for consistent multi-target damage.',
      'Flame Hydra': 'Persistent summoned burn for idle uptime.',
    },
  },
]

export const HERO_BY_ID = Object.fromEntries(HEROES.map((h) => [h.id, h]))

// Recommended unlock order — ORDER MATTERS MOST. Costs in gold.
// confirmed: true means the cost is from the spec; otherwise it's a community estimate.
export const RUNES = [
  {
    id: 'rune_of_war',
    name: 'Rune of War',
    cost: 100,
    confirmed: true,
    category: 'Gateway',
    effect: 'Unlocks the rune system entirely.',
    why: 'The gateway. Nothing else can be bought until this is owned — grab it immediately.',
  },
  {
    id: 'command_1',
    name: 'Rune of Command I',
    cost: 2000,
    confirmed: true,
    category: 'Hero Slots',
    effect: 'Unlocks your 2nd hero slot.',
    why: 'Biggest early power spike in the game — a second hero roughly doubles party output.',
    grantsHeroSlot: 2,
  },
  {
    id: 'command_2',
    name: 'Rune of Command II',
    cost: 150000,
    confirmed: true,
    category: 'Hero Slots',
    effect: 'Unlocks your 3rd (final) hero slot.',
    why: 'Third hero = full comp (tank + support + DPS). Save aggressively for this.',
    grantsHeroSlot: 3,
  },
  {
    id: 'awakening',
    name: 'Rune of Awakening',
    cost: 25000,
    confirmed: false,
    category: 'Skills',
    effect: 'Unlocks a 2nd skill slot for ALL heroes.',
    why: 'A second active per hero is a global combat upgrade across your whole roster.',
  },
  {
    id: 'auto_open_common',
    name: 'Auto-Open Common Chests',
    cost: 5000,
    confirmed: false,
    category: 'Automation',
    effect: 'Common chests open automatically.',
    why: 'Idle automation — removes the busywork so loot accrues while you are away.',
  },
  {
    id: 'auto_open_boss',
    name: 'Auto-Open Boss Chests',
    cost: 40000,
    confirmed: false,
    category: 'Automation',
    effect: 'Boss chests open automatically.',
    why: 'Best gear comes from boss chests; automate them once commons are handled.',
  },
  {
    id: 'wealth_gold_kill',
    name: 'Wealth: Gold per Kill',
    cost: 8000,
    confirmed: false,
    category: 'Wealth',
    effect: '+gold from every enemy killed.',
    why: 'Compounds your farm income — funds every later rune faster.',
  },
  {
    id: 'wealth_boss_gold',
    name: 'Wealth: Boss Gold',
    cost: 30000,
    confirmed: false,
    category: 'Wealth',
    effect: '+gold from boss kills.',
    why: 'Boss gold is lumpy and large; scales your big paydays.',
  },
  {
    id: 'wealth_gold_mult',
    name: 'Wealth: Gold Multiplier',
    cost: 60000,
    confirmed: false,
    category: 'Wealth',
    effect: 'Multiplies all gold income.',
    why: 'A multiplier on top of the flat wealth runes — the engine of your economy.',
  },
  {
    id: 'growth_xp',
    name: 'Growth / XP Rune',
    cost: 15000,
    confirmed: false,
    category: 'Growth',
    effect: '+hero EXP gain.',
    why: 'Speeds leveling so you out-scale stages instead of grinding them.',
  },
  {
    id: 'offline_gold',
    name: 'Offline Reward: Gold',
    cost: 12000,
    confirmed: false,
    category: 'Offline',
    effect: '+10% offline gold (additive, stacks).',
    why: 'Only worth it for idle-heavy players — pays off if you bank the full 8h cap often.',
  },
  {
    id: 'offline_xp',
    name: 'Offline Reward: EXP',
    cost: 12000,
    confirmed: false,
    category: 'Offline',
    effect: '+10% offline EXP (additive, stacks).',
    why: 'Idle leveling. Same caveat — only if you regularly collect a full offline session.',
  },
  {
    id: 'expansion_inventory',
    name: 'Expansion: Inventory / Stash',
    cost: 10000,
    confirmed: false,
    category: 'Expansion',
    effect: '+inventory and stash capacity.',
    why: 'Quality-of-life so auto-opened loot does not overflow and get wasted.',
  },
  {
    id: 'combat_stat',
    name: 'Combat Stat Runes',
    cost: 5000,
    confirmed: false,
    category: 'Combat',
    effect: 'Flat/percent combat stats (ATK, crit, etc).',
    why: 'Nice, but gear out-scales these — buy them last once the structure is in place.',
  },
  {
    id: 'drop_explore',
    name: 'Drop-Rate / Exploration Runes',
    cost: 5000,
    confirmed: false,
    category: 'Combat',
    effect: '+item drop chance / exploration rewards.',
    why: 'Marginal early; valuable only once you are farm-stable and chasing specific drops.',
  },
]

export const RUNE_BY_ID = Object.fromEntries(RUNES.map((r) => [r.id, r]))

// Acts & difficulty tiers (stage level 1-120 within each).
export const ACTS = [
  { id: 'act1', name: 'Act 1', tiers: ['Normal', 'Hard', 'Hell'] },
  { id: 'act2', name: 'Act 2', tiers: ['Normal', 'Hard', 'Hell'] },
  { id: 'act3', name: 'Act 3', tiers: ['Normal', 'Hard', 'Hell'] },
]

// Rarity ladder (low -> high) for gear context.
export const RARITIES = [
  'Common',
  'Uncommon',
  'Rare',
  'Legendary',
  'Immortal',
  'Arcana',
  'Beyond',
  'Celestial',
  'Divine',
  'Cosmic',
]

// Equipment slots. dps:true slots weight offensive stats more heavily in Gear Compare.
export const GEAR_SLOTS = [
  { id: 'sword', name: 'Sword', dps: true, group: 'Weapon' },
  { id: 'bow', name: 'Bow', dps: true, group: 'Weapon' },
  { id: 'staff', name: 'Staff', dps: true, group: 'Weapon' },
  { id: 'scepter', name: 'Scepter', dps: true, group: 'Weapon' },
  { id: 'crossbow', name: 'Crossbow', dps: true, group: 'Weapon' },
  { id: 'axe', name: 'Axe', dps: true, group: 'Weapon' },
  { id: 'shield', name: 'Shield', dps: false, group: 'Off-hand' },
  { id: 'arrow', name: 'Arrow', dps: true, group: 'Off-hand' },
  { id: 'orb', name: 'Orb', dps: true, group: 'Off-hand' },
  { id: 'tome', name: 'Tome', dps: true, group: 'Off-hand' },
  { id: 'bolt', name: 'Bolt', dps: true, group: 'Off-hand' },
  { id: 'hatchet', name: 'Hatchet', dps: true, group: 'Off-hand' },
  { id: 'helmet', name: 'Helmet', dps: false, group: 'Armor' },
  { id: 'armor', name: 'Armor', dps: false, group: 'Armor' },
  { id: 'gloves', name: 'Gloves', dps: false, group: 'Armor' },
  { id: 'boots', name: 'Boots', dps: false, group: 'Armor' },
  { id: 'amulet', name: 'Amulet', dps: false, group: 'Jewelry' },
  { id: 'earring', name: 'Earring', dps: false, group: 'Jewelry' },
  { id: 'ring', name: 'Ring', dps: false, group: 'Jewelry' },
  { id: 'bracer', name: 'Bracer', dps: false, group: 'Jewelry' },
]

// The Cube's 8 operations.
export const CUBE_OPERATIONS = [
  {
    name: 'Synthesis',
    summary: 'Combine gear to push rarity upward.',
    detail:
      'Crafting an Immortal item unlocks Cube Lv10; a Celestial unlocks Cube Lv50. Your main long-term rarity ladder.',
    tier: 'late',
  },
  {
    name: 'Alchemy',
    summary: 'Sell / transmute duplicate gear for rune gold.',
    detail:
      'STRONGEST EARLY: turns the flood of duplicate drops into gold that buys your priority runes. Feed Alchemy constantly.',
    tier: 'early',
  },
  {
    name: 'Crafting',
    summary: 'Build new gear from materials.',
    detail: 'Targeted way to fill an empty slot. There is no gear lock — always stat-compare before crafting over an equip.',
    tier: 'mid',
  },
  {
    name: 'Decoration',
    summary: 'Cosmetic / minor stat embellishment.',
    detail: 'Low priority — flavor and small bonuses. Skip until your core build is settled.',
    tier: 'late',
  },
  {
    name: 'Engraving',
    summary: 'Add engraved bonuses to gear.',
    detail: 'Per-item power boosts. Worthwhile on keeper items you have confirmed you will not replace soon.',
    tier: 'mid',
  },
  {
    name: 'Inscription',
    summary: 'Inscribe additional affixes.',
    detail: 'Extra rolled stats. Best spent on high-rarity items that are already winners in Gear Compare.',
    tier: 'mid',
  },
  {
    name: 'Extraction',
    summary: 'Pull stats/affixes out of an item.',
    detail: 'Salvage useful rolls before sacrificing or selling gear. Pairs with Alchemy to avoid losing good affixes.',
    tier: 'mid',
  },
  {
    name: 'Offering',
    summary: 'Sacrifice items for rewards.',
    detail: 'Convert surplus gear into materials/buffs. A sink for the leftovers Alchemy and Extraction do not want.',
    tier: 'late',
  },
]

// Offline economy constants.
export const OFFLINE_CAP_SECONDS = 28800 // 8 hours
export const OFFLINE_RUNE_BONUS = 0.1 // +10% each, additive
export const ANTI_TAMPER_DAYS = 30 // ~30+ days away => 0

// Level 100 XP requirement (top of the 1-100 table; no prestige/rebirth).
export const LEVEL_100_XP = 1997771834
export const MAX_HERO_LEVEL = 100
export const MAX_STAGE_LEVEL = 120
