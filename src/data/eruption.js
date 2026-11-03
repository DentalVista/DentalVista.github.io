// Eruption chronology (years). Permanent: emergence age. Primary: emergence (months -> years) and exfoliation.
// Values are mid-range averages (AAPD / Wheeler's).
export const PERMANENT_ERUPTION = {
  U1: 7.5, U2: 8.5, U3: 11.5, U4: 10.5, U5: 11, U6: 6.3, U7: 12.5, U8: 18.5,
  L1: 6.5, L2: 7.5, L3: 9.5, L4: 11, L5: 11.5, L6: 6.0, L7: 12, L8: 18.5,
};
export const PRIMARY_ERUPTION = {
  UA: { erupt: 10 / 12, shed: 6.8 }, UB: { erupt: 11 / 12, shed: 7.8 }, UC: { erupt: 19 / 12, shed: 11 }, UD: { erupt: 16 / 12, shed: 10 }, UE: { erupt: 29 / 12, shed: 11 },
  LA: { erupt: 8 / 12, shed: 6.3 }, LB: { erupt: 13 / 12, shed: 7.3 }, LC: { erupt: 20 / 12, shed: 10.5 }, LD: { erupt: 16 / 12, shed: 10 }, LE: { erupt: 27 / 12, shed: 11.3 },
};
// Permanent successor of each primary position (slot index 1..5 -> permanent slot)
export const SUCCESSOR_SLOT = { A: 1, B: 2, C: 3, D: 4, E: 5 };

/** Milestones displayed on the timeline. */
export const MILESTONES = [
  { age: 0.6, zh: '第一颗乳牙萌出（下颌乳中切牙）', en: 'First primary tooth (lower central incisor)' },
  { age: 2.5, zh: '乳牙列完成：20 颗', en: 'Primary dentition complete: 20 teeth' },
  { age: 6, zh: '六龄牙萌出，替牙期开始', en: 'First permanent molars erupt; mixed dentition begins' },
  { age: 9, zh: '替牙间歇期', en: 'Intertransitional period' },
  { age: 12, zh: '乳牙全部脱落，第二磨牙萌出', en: 'All primary teeth shed; second molars erupt' },
  { age: 18, zh: '第三磨牙（智齿）开始萌出', en: 'Third molars (wisdom teeth) begin to erupt' },
  { age: 21, zh: '恒牙列完成：32 颗', en: 'Permanent dentition complete: 32 teeth' },
];
