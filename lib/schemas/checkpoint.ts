import { z } from 'zod';

const comprehensionQuestionSchema = z.object({
  questionPt: z.string().min(1),
  options: z.array(z.string()).min(2).max(4),
  correctIndex: z.number().int().min(0),
  explanationPt: z.string().min(1),
});

export const checkpointSessionSchema = z.object({
  briefing: z.string().min(1),
  dialogueAudio: z.string().min(10),
  comprehensionQuestions: z.array(comprehensionQuestionSchema).min(1).max(3),
  productionExercises: z.array(z.object({ type: z.string(), data: z.record(z.string(), z.unknown()) })).min(1).max(3),
  coveredTopics: z.array(z.string()).min(1),
});

export type CheckpointSessionPayload = z.infer<typeof checkpointSessionSchema>;
