import { Mastra } from "@mastra/core/mastra";
import { orchestratorAgent } from "./agents/orchestrator";
import { movieSearchAgent } from "./agents/movie-search";
import { schedulerAgent } from "./agents/scheduler";
import { reservationAgent } from "./agents/reservation";

export const mastra = new Mastra({
  agents: {
    orchestrator: orchestratorAgent,
    movieSearch: movieSearchAgent,
    scheduler: schedulerAgent,
    reservation: reservationAgent,
  },
});
