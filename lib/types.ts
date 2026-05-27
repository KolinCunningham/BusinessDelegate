// CragTrails - Core Data Types
// Designed for easy merge from OpenBeta, Mountain Project API, TheCrag, and user contributions.
// Every route/area MUST credit its primary source(s).

export type Grade = string; // "5.10a", "V5", "5.8", "6a+", etc.

export type RouteType = "Sport" | "Trad" | "Boulder" | "Mixed" | "Ice" | "Alpine" | "Toprope";

export type DifficultyColor = "green" | "yellow" | "orange" | "red" | "purple";

export interface Area {
  id: string;
  name: string;
  parent?: string; // e.g. "Yosemite National Park"
  country: string;
  lat: number;
  lng: number;
  description: string;
  approachNotes?: string;
  bestSeason: string;
  sources: string[]; // ["openbeta", "mountainproject", "user"]
  routeCount: number;
  photoUrl: string;
}

export interface Route {
  id: string;
  name: string;
  areaId: string;
  areaName: string; // denormalized for speed
  grade: Grade;
  type: RouteType;
  lengthFt?: number;
  pitches?: number;
  bolts?: number;
  protection?: string; // "10 bolts + gear to 2""
  fa: string; // First Ascent "Lynn Hill 1993"
  description: string; // Short, inspiring, beta hints. Keep friendly.
  betaNotes?: string;
  lat: number;
  lng: number;
  stars: number; // 0-5
  starVotes: number;
  ticks: number; // total sends logged
  difficultyColor: DifficultyColor;
  photoUrl: string; // primary hero
  photoUrls: string[]; // more community + stock
  hazards?: string;
  bestConditions: string;
  sources: string[]; // attribution
  lastUpdated: string;
}

export interface Tick {
  id: string;
  routeId: string;
  routeName: string;
  areaName: string;
  grade: Grade;
  date: string; // ISO
  stars: number;
  notes?: string;
  conditions?: string; // "Dry & bomber", "Pumped", "Wet rock"
  photoUrl?: string;
  sendStyle: "Flash" | "Redpoint" | "Onsight" | "Dogged" | "Attempt";
}

export interface ConditionReport {
  id: string;
  routeId: string;
  user: string;
  date: string;
  text: string;
  emoji: string;
  photoUrl?: string;
}

export interface User {
  id: string;
  name: string;
  username: string;
  location: string;
  avatarUrl: string;
  memberSince: string;
  totalSends: number;
  hardestSend: string;
  favoriteCrag: string;
  ticks: Tick[];
  wishlist: string[]; // routeIds
}

export interface Sponsor {
  name: string;
  logo: string;
  url: string;
  tier: "Founding" | "Supporting" | "Gear";
  blurb?: string;
}

// For future real DB: this structure maps cleanly to OpenBeta GraphQL + MP JSON
