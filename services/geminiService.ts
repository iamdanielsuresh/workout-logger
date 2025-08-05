
import { GoogleGenAI, Type } from "@google/genai";
import type { GeneratedPlan } from '../types';

// Check if API key is available
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const isAIEnabled = !!API_KEY;

let ai: GoogleGenAI | null = null;

if (isAIEnabled) {
    ai = new GoogleGenAI({ apiKey: API_KEY });
}

const workoutPlanSchema = {
  type: Type.OBJECT,
  properties: {
    planName: {
      type: Type.STRING,
      description: 'A creative and motivating name for the workout plan.',
    },
    days: {
      type: Type.ARRAY,
      description: 'An array of workout days, typically 3 to 5.',
      items: {
        type: Type.OBJECT,
        properties: {
          day: {
            type: Type.STRING,
            description: 'The focus for the day, e.g., "Day 1: Push (Chest, Shoulders, Triceps)"',
          },
          exercises: {
            type: Type.ARRAY,
            description: 'A list of exercises for the day.',
            items: {
              type: Type.OBJECT,
              required: ["name", "sets", "reps"],
              properties: {
                name: {
                  type: Type.STRING,
                  description: 'The name of the exercise.',
                },
                sets: {
                  type: Type.STRING,
                  description: 'The recommended number of sets, e.g., "3-4".',
                },
                reps: {
                  type: Type.STRING,
                  description: 'The recommended rep range, e.g., "8-12".',
                },
              },
            },
          },
        },
      },
    },
  },
  required: ['planName', 'days'],
};


export const generateWorkoutPlan = async (prompt: string): Promise<GeneratedPlan> => {
    // Check if AI is enabled
    if (!isAIEnabled || !ai) {
        throw new Error("AI features are not available. Please configure the Gemini API key to use AI-powered workout generation.");
    }

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash-exp",
            contents: `Generate a workout plan based on the following user request: "${prompt}". Ensure the plan is well-structured, safe, and effective.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: workoutPlanSchema,
            },
        });
        
        const jsonText = response.text.trim();
        const plan = JSON.parse(jsonText);
        return plan;
    } catch (error) {
        console.error("Error generating workout plan:", error);
        throw new Error("Failed to generate a workout plan. The AI service may be busy. Please try again later.");
    }
};

export const generateWorkoutInsights = async (context: any): Promise<string> => {
    // Check if AI is enabled
    if (!isAIEnabled || !ai) {
        return "AI insights are not available. Configure the Gemini API key to get personalized workout recommendations.";
    }

    try {
        const prompt = `
You are an expert fitness coach AI. Analyze the following workout context and provide personalized insights and recommendations for today's session.

Context:
- User: ${context.userProfile.name}
- Total workouts completed: ${context.userProfile.totalWorkouts}
- Today's focus: ${context.todaysWorkout.focus}
- Planned exercises: ${context.todaysWorkout.exercises?.map((ex: any) => ex.name).join(', ')}

Previous Performance Analysis:
${context.previousWorkouts?.map((pw: any) => {
    if (!pw.lastSession) return `- ${pw.exercise}: No previous data`;
    const lastSet = pw.lastSession.sets?.filter((s: any) => !s.isWarmup)?.sort((a: any, b: any) => b.weight - a.weight)[0];
    return `- ${pw.exercise}: Last session ${new Date(pw.lastSession.date).toLocaleDateString()} - Best set: ${lastSet?.reps || 'N/A'} reps @ ${lastSet?.weight || 'N/A'}kg${pw.lastSession.notes ? ` (Note: ${pw.lastSession.notes})` : ''}`;
}).join('\n')}

Instructions:
1. Provide a motivational greeting that acknowledges their progress
2. Give specific recommendations for today's workout based on their previous performance
3. If they had any issues in previous sessions (mentioned in notes), provide guidance to address them
4. Suggest realistic progression targets (weight increases, rep improvements)
5. Include any form cues or technique reminders if relevant
6. Keep the tone encouraging but professional
7. Limit response to 2-3 sentences maximum for quick reading

Focus on being practical and actionable rather than generic.
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash-exp",
            contents: prompt,
        });
        
        return response.text.trim();
    } catch (error) {
        console.error("Error generating workout insights:", error);
        return "Ready for your workout! Focus on proper form and progressive overload today.";
    }
};

// Helper function to check if AI features are available
export const isAIAvailable = (): boolean => {
    return isAIEnabled;
};