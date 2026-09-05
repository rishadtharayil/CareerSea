import { Hono } from 'hono';
import { Env, RoadmapStep, ChatMessage } from '../types';
import { getSupabase } from '../services/db';
import { getStepDeepDive, getStepChat } from '../services/ai';

const steps = new Hono<{ Bindings: Env }>();

/**
 * GET /api/steps/:id/
 * Retrieves step details, generating deep-dive guide on demand if null
 */
steps.get('/:id/', async (c) => {
  const stepId = parseInt(c.req.param('id'), 10);
  if (isNaN(stepId)) {
    return c.json({ error: 'Invalid step ID' }, 400);
  }

  const supabase = getSupabase(c.env);

  // Fetch step with its parent career and user response answers
  const { data: step, error: stepErr } = await supabase
    .from('api_roadmapstep')
    .select(`
      id, order, title, description, duration, resources, deep_dive, career_id,
      career:api_careersuggestion (
        id, title,
        user_response:api_userresponse (
          id, answers
        )
      )
    `)
    .eq('id', stepId)
    .maybeSingle();

  if (stepErr || !step) {
    return c.json({ error: 'RoadmapStep not found' }, 404);
  }

  let deepDive = step.deep_dive;

  // Generate deep dive on demand if it doesn't exist yet
  if (!deepDive) {
    try {
      const careerTitle = (step.career as any)?.title || 'Career Path';
      const userAnswers = (step.career as any)?.user_response?.answers || null;

      deepDive = await getStepDeepDive(
        careerTitle,
        step.title,
        step.description,
        step.duration,
        step.resources || [],
        userAnswers,
        c.env
      );

      // Save deep dive to DB
      await supabase
        .from('api_roadmapstep')
        .update({ deep_dive: deepDive })
        .eq('id', stepId);
    } catch (aiErr: any) {
      console.error('Error generating deep dive:', aiErr);
      return c.json({ error: 'Failed to generate deep dive: ' + (aiErr?.message || String(aiErr)) }, 500);
    }
  }

  // Fetch chat messages
  const { data: chatMessages } = await supabase
    .from('api_chatmessage')
    .select('id, sender, text, created_at')
    .eq('step_id', stepId)
    .order('created_at', { ascending: true });

  return c.json(
    {
      id: step.id,
      order: step.order,
      title: step.title,
      description: step.description,
      duration: step.duration,
      resources: step.resources || [],
      deep_dive: deepDive,
      chat_messages: chatMessages || [],
    },
    200
  );
});

/**
 * POST /api/steps/:id/chat/
 * Interactive chat with AI mentor for a specific milestone
 */
steps.post('/:id/chat/', async (c) => {
  const stepId = parseInt(c.req.param('id'), 10);
  if (isNaN(stepId)) {
    return c.json({ error: 'Invalid step ID' }, 400);
  }

  const body = await c.req.json<{ text?: string }>();
  const userText = body.text?.trim();
  if (!userText) {
    return c.json({ error: 'Message text is required' }, 400);
  }

  const supabase = getSupabase(c.env);

  // Fetch step with career and user response
  const { data: step, error: stepErr } = await supabase
    .from('api_roadmapstep')
    .select(`
      id, title, description, deep_dive,
      career:api_careersuggestion (
        title,
        user_response:api_userresponse (
          answers
        )
      )
    `)
    .eq('id', stepId)
    .maybeSingle();

  if (stepErr || !step) {
    return c.json({ error: 'RoadmapStep not found' }, 404);
  }

  // 1. Fetch chat history (before saving new message)
  const { data: historyData } = await supabase
    .from('api_chatmessage')
    .select('sender, text')
    .eq('step_id', stepId)
    .order('created_at', { ascending: true });

  const chatHistory = (historyData || []) as Array<{ sender: 'user' | 'ai'; text: string }>;

  // 2. Call AI mentor
  try {
    const careerTitle = (step.career as any)?.title || 'Career Path';
    const userAnswers = (step.career as any)?.user_response?.answers || null;

    const aiResponse = await getStepChat(
      careerTitle,
      step.title,
      step.description,
      step.deep_dive || 'No study guide available.',
      chatHistory,
      userText,
      userAnswers,
      c.env
    );

    const now = new Date().toISOString();

    // 3. Save both user message and AI response
    await supabase.from('api_chatmessage').insert([
      {
        step_id: stepId,
        sender: 'user',
        text: userText,
        created_at: now,
      },
      {
        step_id: stepId,
        sender: 'ai',
        text: aiResponse,
        created_at: new Date(Date.now() + 50).toISOString(),
      },
    ]);

    // 4. Return updated chat history
    const { data: updatedHistory } = await supabase
      .from('api_chatmessage')
      .select('id, sender, text, created_at')
      .eq('step_id', stepId)
      .order('created_at', { ascending: true });

    return c.json(updatedHistory || [], 200);
  } catch (err: any) {
    console.error('Mentor chat error:', err);
    return c.json({ error: 'Failed to get mentor response: ' + (err?.message || String(err)) }, 500);
  }
});

export default steps;
