// <max
export function rdmMaxFloor(max: number): number {
  return Math.floor(Math.random() * max);
}

// <=max
export function rdmMaxRound(max: number): number {
  return Math.round(Math.random() * max);
}

// .min ≤ r ≤ max
export function rdmSpeedRound(min: number, max: number): number {
  return Math.round(Math.random() * (max - min)) + min;
}

// min﹤r ≦ max
// function Random(min, max) {
//   return Math.ceil(Math.random() * (max - min)) + min;
// }

// min≦ r ﹤ max
// function Random(min, max) {
//   return Math.floor(Math.random() * (max - min)) + min;
// }

//  min﹤ r ﹤ max
// function Random(min, max) {
//   return Math.floor(Math.random() * (max - min)) === min
//     ? min + 1
//     : Math.floor(Math.random() * (max - min)) + min;
// }
