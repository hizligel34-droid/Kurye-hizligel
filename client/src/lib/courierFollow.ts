export type CourierFollowState = "following" | "free";

export function followStateAfterUserDrag(): CourierFollowState {
  return "free";
}

export function followStateAfterRecenter(): CourierFollowState {
  return "following";
}

export function shouldAutoCenter(state: CourierFollowState, hasLocation: boolean): boolean {
  return state === "following" && hasLocation;
}
