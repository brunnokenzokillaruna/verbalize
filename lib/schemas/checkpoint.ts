import { z } from 'zod';

const comprehensionQuestionSchema = z.object({
  questionPt: z.string().min(1),
  options: z.array(z.string()).min(2).max(4),
  correctIndex: z.number().int().min(0),
  explanationPt: z.string().min(1),
  topicFocus: z.string().min(1).optional(),
});

export const checkpointSessionSchema = z.object({
  briefing: z.string().min(1),
  dialogueAudio: z.string().min(10),
  comprehensionQuestions: z.array(comprehensionQuestionSchema).min(2).max(4),
  productionExercises: z
    .array(
      z.object({
        type: z.string(),
        data: z.record(z.string(), z.unknown()),
        topicFocus: z.string().min(1).optional(),
      }),
    )
    .min(2)
    .max(4),
  coveredTopics: z.array(z.string()).min(1),
  assessedTopics: z.array(z.string()).min(1).optional(),
});

export type CheckpointSessionPayload = z.infer<typeof checkpointSessionSchema>;
