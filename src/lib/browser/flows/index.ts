export { tohoFlow, TOHO_BASE_URL, type BookingFlowStep } from "./toho";
export { aeonFlow, AEON_BASE_URL } from "./aeon";
export { cinema109Flow, CINEMA109_BASE_URL } from "./cinema109";

import type { TheaterChain } from "@/types/theater";
import type { BookingFlowStep } from "./toho";
import { tohoFlow } from "./toho";
import { aeonFlow } from "./aeon";
import { cinema109Flow } from "./cinema109";

export function getBookingFlow(chain: TheaterChain): BookingFlowStep[] | null {
  switch (chain) {
    case "toho":
      return tohoFlow;
    case "aeon":
      return aeonFlow;
    case "cinema109":
      return cinema109Flow;
    default:
      return null;
  }
}
