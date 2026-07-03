// Optional item database. EMPTY by design: the fan-datamined item catalog for
// TBH is not bundled here, and inventing item stats would mislead players. Drop a
// real datamined list into ITEMS (matching the schema below) and the Gear
// Priority tab automatically turns on a "best item per slot at each stage"
// recommender — no other code changes needed.
//
// Schema (one object per item):
//   {
//     name:   'Dawnbreaker',        // display name
//     slot:   'sword',              // must match a GEAR_SLOTS id
//     rarity: 'Immortal',           // must match a RARITIES entry
//     minStage: 1,                  // earliest stage it realistically drops (optional)
//     stats: {                      // any subset of the STAT_DEFS keys
//       AttackDamage: 1200,
//       AttackSpeed: 0.4,
//       CritChance: 12,
//       CritDamage: 60,
//       MaxHP: 0,
//       Armor: 0,
//       ElementResist: 0,
//     },
//   }

/** @type {Array<{name:string, slot:string, rarity:string, minStage?:number, stats:object}>} */
export const ITEMS = []

export const HAS_ITEM_DB = ITEMS.length > 0
