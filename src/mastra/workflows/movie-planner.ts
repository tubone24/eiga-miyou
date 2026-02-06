import { mastra } from "../index";

export interface MoviePlannerInput {
  userId: string;
  message: string;
}

export async function runMoviePlanner(input: MoviePlannerInput) {
  const agent = mastra.getAgent("orchestrator");

  const response = await agent.generate(input.message, {
    // RuntimeContext would be set here for userId
  });

  return {
    text: response.text,
  };
}
