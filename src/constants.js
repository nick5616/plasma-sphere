export const SPHERE_R = 1.0;
export const SPHERE_Y = 1.72; // Center of glass sphere in world space

// Base dimensions
export const BASE_RINGS      = 8;
export const BASE_BOTTOM_R   = 1.48;
export const BASE_TOP_R      = 0.54;
export const BASE_RING_H_BOT = 0.13;  // height of bottom ring
export const BASE_RING_H_TOP = 0.065; // height of top ring

// Arc settings
export const NUM_ARCS        = 7;  // main arcs
export const NUM_THIN_ARCS   = 4;  // accent arcs
export const TOTAL_ARCS      = NUM_ARCS + NUM_THIN_ARCS;      // 11
export const ATTRACTED_COUNT = Math.round(TOTAL_ARCS * 0.8);  // 9 when holding
export const ARC_PTS         = 22; // sample points per arc line
export const ARCS_PER_FRAME  = 2;  // how many arcs to refresh each frame (staggered)
