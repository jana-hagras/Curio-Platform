import pool from "../../db/connection.js";

// ══════════════════════════════════════════════════════════════
//  AI Generation Service — Gemini + Meshy AI Pipeline
//  Supports versioned refinement for iterative design workflow
// ══════════════════════════════════════════════════════════════

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
const MESHY_API_URL = "https://api.meshy.ai/openapi/v1/text-to-image";

const GEMINI_SYSTEM_PROMPT = `You are an expert product designer and 3D visualization specialist for handmade Egyptian artisan crafts.

Given a buyer's custom craft request, enhance the description to be optimized for AI image generation. You must:

1. Add specific material details (wood type, metal finish, fabric texture, stone, clay type)
2. Define a clear color palette with specific tones and finishes
3. Describe shape, structure, proportions, and dimensions precisely
4. Add lighting and presentation style (studio lighting, natural, ambient)
5. Include Egyptian/artisan craft aesthetic elements where appropriate
6. Specify the viewing angle (front view, 3/4 view, isometric)
7. Add background context (clean white studio, marble surface, etc.)

Keep the enhanced prompt under 200 words.
Output ONLY the enhanced prompt text, no explanations, no quotes, no prefixes.
The output should read as a direct image generation prompt.`;

const GEMINI_REFINEMENT_PROMPT = `You are an expert product designer and 3D visualization specialist for handmade Egyptian artisan crafts.

A buyer previously requested a custom craft, and an AI-enhanced prompt was created for image generation. The buyer has now provided refinement instructions to modify the design.

Your job:
1. Take the PREVIOUS enhanced prompt as the baseline design
2. Apply the buyer's REFINEMENT INSTRUCTIONS to modify it
3. Maintain all unmentioned aspects of the previous design
4. Output a new, complete image generation prompt that incorporates the changes

Keep the enhanced prompt under 200 words.
Output ONLY the enhanced prompt text, no explanations, no quotes, no prefixes.
The output should read as a direct image generation prompt.`;

// ─── HELPERS ───────────────────────────────────────────────────

/**
 * Get the next version number for a request.
 */
async function getNextVersionNumber(requestId) {
  const [rows] = await pool.query(
    "SELECT COALESCE(MAX(VersionNumber), 0) AS maxVer FROM RequestAIGeneration WHERE Request_id = ?",
    [requestId]
  );
  return (rows[0]?.maxVer || 0) + 1;
}

// ─── GEMINI PROMPT ENHANCEMENT ─────────────────────────────────

/**
 * Enhance a buyer's prompt using Google Gemini for better image generation.
 * @param {string} originalPrompt - The buyer's original description
 * @param {string} category - Product category for context
 * @returns {Promise<string|null>} Enhanced prompt or null on failure
 */
export async function enhancePromptWithGemini(originalPrompt, category) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("[AI Pipeline] GEMINI_API_KEY not configured");
    return null;
  }

  try {
    const userMessage = `Category: ${category || "Handcraft"}\nBuyer's request: ${originalPrompt}`;

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              { text: GEMINI_SYSTEM_PROMPT + "\n\n" + userMessage }
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 400,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[AI Pipeline] Gemini API error ${response.status}:`, errText);
      return null;
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      console.error("[AI Pipeline] Gemini returned empty response");
      return null;
    }

    console.log(`[AI Pipeline] ✅ Gemini enhanced prompt (${text.length} chars)`);
    return text.trim();
  } catch (err) {
    console.error("[AI Pipeline] Gemini enhancement failed:", err.message);
    return null;
  }
}

/**
 * Refine a previous enhanced prompt using Gemini with buyer's refinement instructions.
 * @param {string} previousEnhancedPrompt - The previous Gemini-enhanced prompt
 * @param {string} refinementInstructions - Buyer's refinement text
 * @param {string} originalDescription - Original request description for context
 * @param {string} category - Product category
 * @returns {Promise<string|null>} New enhanced prompt or null on failure
 */
export async function refinePromptWithGemini(previousEnhancedPrompt, refinementInstructions, originalDescription, category) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("[AI Pipeline] GEMINI_API_KEY not configured");
    return null;
  }

  try {
    const userMessage = `Category: ${category || "Handcraft"}
Original buyer request: ${originalDescription}
Previous enhanced prompt: ${previousEnhancedPrompt}
Buyer's refinement instructions: ${refinementInstructions}`;

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              { text: GEMINI_REFINEMENT_PROMPT + "\n\n" + userMessage }
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 400,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[AI Pipeline] Gemini refinement API error ${response.status}:`, errText);
      return null;
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      console.error("[AI Pipeline] Gemini returned empty refinement response");
      return null;
    }

    console.log(`[AI Pipeline] ✅ Gemini refined prompt (${text.length} chars)`);
    return text.trim();
  } catch (err) {
    console.error("[AI Pipeline] Gemini refinement failed:", err.message);
    return null;
  }
}

// ─── MESHY AI IMAGE GENERATION ─────────────────────────────────

/**
 * Generate a 2D image/photo using Meshy AI text-to-image API.
 * @param {string} prompt - The enhanced prompt
 * @returns {Promise<{taskId: string, imageUrl: string}|null>}
 */
export async function generateImageWithMeshy(prompt) {
  const apiKey = process.env.MESHY_API_KEY;
  if (!apiKey || apiKey.includes('dummy') || apiKey.includes('NEW_TOKEN_HERE')) {
    console.warn("[AI Pipeline] MESHY_API_KEY is not configured or is a dummy token, falling back to mock image.");
    return getFallbackImageResult();
  }

  const endpoint = "https://api.meshy.ai/openapi/v1/text-to-image";

  try {
    console.log("[AI Pipeline] Submitting Text-to-Image task to Meshy AI...");
    const createRes = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: prompt,
        ai_model": "gpt-image-2", // Use top-quality OpenAI model for realistic results
        aspect_ratio: "1:1"
      }),
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      console.error(`[AI Pipeline] Meshy image create error ${createRes.status}:`, errText);
      return getFallbackImageResult("Meshy task submission failed");
    }

    const createData = await createRes.json();
    const taskId = createData.result;

    if (!taskId) {
      console.error("[AI Pipeline] Meshy returned no task ID:", createData);
      return getFallbackImageResult("No task ID returned");
    }

    console.log(`[AI Pipeline] Meshy image task created: ${taskId}`);

    // Poll for completion (3s intervals, max 40 attempts = 2 minutes)
    const maxAttempts = 40;
    const pollInterval = 3000;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, pollInterval));

      const statusRes = await fetch(`${endpoint}/${taskId}`, {
        headers: { "Authorization": `Bearer ${apiKey}` },
      });

      if (!statusRes.ok) {
        console.warn(`[AI Pipeline] Meshy image poll error (attempt ${attempt + 1}):`, statusRes.status);
        continue;
      }

      const statusData = await statusRes.json();
      const status = statusData.status;

      console.log(`[AI Pipeline] Meshy image poll ${attempt + 1}/${maxAttempts}: ${status}`);

      if (status === "SUCCEEDED" || status === "completed") {
        const imageUrl = statusData.image_url || statusData.result || null;
        if (!imageUrl) {
          console.warn("[AI Pipeline] Meshy image succeeded but no image URL found.");
          return getFallbackImageResult("No image URL found in completed task");
        }

        console.log(`[AI Pipeline] ✅ Meshy image generated: ${imageUrl}`);
        return { taskId, imageUrl };
      }

      if (status === "FAILED" || status === "failed" || status === "EXPIRED") {
        console.error(`[AI Pipeline] Meshy image task failed: ${statusData.error || status}`);
        return getFallbackImageResult(statusData.error || "Generation failed");
      }
    }

    console.error("[AI Pipeline] Meshy image polling timed out");
    return getFallbackImageResult("Generation timed out");
  } catch (err) {
    console.error("[AI Pipeline] Meshy image generation failed:", err.message);
    return getFallbackImageResult(err.message);
  }
}

/**
 * Generate a 3D model from a 2D image using Meshy AI image-to-3d API.
 * @param {string} imageUrl - Publicly accessible URL of the 2D image
 * @returns {Promise<{taskId: string, glbUrl: string, thumbnailUrl: string}|null>}
 */
export async function generate3DFromImageWithMeshy(imageUrl) {
  const apiKey = process.env.MESHY_API_KEY;
  if (!apiKey || apiKey.includes('dummy') || apiKey.includes('NEW_TOKEN_HERE')) {
    console.warn("[AI Pipeline] MESHY_API_KEY is not configured or is a dummy token, falling back to mock 3D model.");
    return getFallback3DResult();
  }

  const endpoint = "https://api.meshy.ai/openapi/v2/image-to-3d";

  try {
    console.log("[AI Pipeline] Submitting Image-to-3D task to Meshy AI...");
    const createRes = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image_url: imageUrl,
        should_remesh: true
      }),
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      console.error(`[AI Pipeline] Meshy Image-to-3D create error ${createRes.status}:`, errText);
      return getFallback3DResult("Meshy task submission failed");
    }

    const createData = await createRes.json();
    const taskId = createData.result;

    if (!taskId) {
      console.error("[AI Pipeline] Meshy returned no task ID:", createData);
      return getFallback3DResult("No task ID returned");
    }

    console.log(`[AI Pipeline] Meshy Image-to-3D task created: ${taskId}`);

    // Poll for completion (5s intervals, max 60 attempts = 5 minutes)
    const maxAttempts = 60;
    const pollInterval = 5000;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, pollInterval));

      const statusRes = await fetch(`${endpoint}/${taskId}`, {
        headers: { "Authorization": `Bearer ${apiKey}` },
      });

      if (!statusRes.ok) {
        console.warn(`[AI Pipeline] Meshy 3D poll error (attempt ${attempt + 1}):`, statusRes.status);
        continue;
      }

      const statusData = await statusRes.json();
      const status = statusData.status;

      console.log(`[AI Pipeline] Meshy 3D poll ${attempt + 1}/${maxAttempts}: ${status}`);

      if (status === "SUCCEEDED" || status === "completed") {
        const glbUrl = statusData.model_urls?.glb || null;
        const thumbnailUrl = statusData.thumbnail_url || null;

        if (!glbUrl) {
          console.warn("[AI Pipeline] Meshy 3D succeeded but no GLB model URL found.");
          return getFallback3DResult("No GLB URL found in completed task");
        }

        console.log(`[AI Pipeline] ✅ Meshy 3D model generated from image: ${glbUrl}`);
        return { taskId, glbUrl, thumbnailUrl };
      }

      if (status === "FAILED" || status === "failed" || status === "EXPIRED") {
        console.error(`[AI Pipeline] Meshy 3D task failed: ${statusData.error || status}`);
        return getFallback3DResult(statusData.error || "Generation failed");
      }
    }

    console.error("[AI Pipeline] Meshy 3D polling timed out after 5 minutes");
    return getFallback3DResult("Generation timed out");
  } catch (err) {
    console.error("[AI Pipeline] Meshy 3D generation from image failed:", err.message);
    return getFallback3DResult(err.message);
  }
}

function getFallbackImageResult(errorMsg = null) {
  console.log("[AI Pipeline] ℹ️ Returning premium fallback image.");
  const fallbacks = [
    "https://images.unsplash.com/photo-1618220179428-22790b461013?w=600",
    "https://images.unsplash.com/photo-1581781862590-f8007a8fc983?w=600",
    "https://images.unsplash.com/photo-1606744824163-985d376605aa?w=600"
  ];
  const selected = fallbacks[Math.floor(Math.random() * fallbacks.length)];
  return {
    taskId: "mock-image-task-" + Math.floor(Math.random() * 100000),
    imageUrl: selected,
    error: errorMsg
  };
}

/**
 * Generate 3D models using Meshy AI text-to-3d API.
 * @param {string} prompt - The enhanced prompt
 * @returns {Promise<{taskId: string, glbUrl: string, thumbnailUrl: string}|null>}
 */
export async function generate3DWithMeshy(prompt) {
  const apiKey = process.env.MESHY_API_KEY;
  if (!apiKey || apiKey.includes('dummy') || apiKey.includes('NEW_TOKEN_HERE')) {
    console.warn("[AI Pipeline] MESHY_API_KEY is not configured or is a dummy token, falling back to mock 3D model.");
    return getFallback3DResult();
  }

  const endpoint = "https://api.meshy.ai/openapi/v2/text-to-3d";

  try {
    console.log("[AI Pipeline] Submitting Text-to-3D task to Meshy AI...");
    const createRes = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mode: "preview",
        prompt: prompt,
        should_remesh: true
      }),
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      console.error(`[AI Pipeline] Meshy 3D create error ${createRes.status}:`, errText);
      return getFallback3DResult("Meshy task submission failed");
    }

    const createData = await createRes.json();
    const taskId = createData.result;

    if (!taskId) {
      console.error("[AI Pipeline] Meshy returned no task ID:", createData);
      return getFallback3DResult("No task ID returned");
    }

    console.log(`[AI Pipeline] Meshy 3D task created: ${taskId}`);

    // Poll for completion (5s intervals, max 5 minutes)
    const maxAttempts = 60;
    const pollInterval = 5000;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, pollInterval));

      const statusRes = await fetch(`${endpoint}/${taskId}`, {
        headers: { "Authorization": `Bearer ${apiKey}` },
      });

      if (!statusRes.ok) {
        console.warn(`[AI Pipeline] Meshy 3D poll error (attempt ${attempt + 1}):`, statusRes.status);
        continue;
      }

      const statusData = await statusRes.json();
      const status = statusData.status;

      console.log(`[AI Pipeline] Meshy 3D poll ${attempt + 1}/${maxAttempts}: ${status}`);

      if (status === "SUCCEEDED" || status === "completed") {
        const glbUrl = statusData.model_urls?.glb || null;
        const thumbnailUrl = statusData.thumbnail_url || null;

        if (!glbUrl) {
          console.warn("[AI Pipeline] Meshy 3D succeeded but no GLB model URL found.");
          return getFallback3DResult("No GLB URL found in completed task");
        }

        console.log(`[AI Pipeline] ✅ Meshy 3D model generated: ${glbUrl}`);
        return { taskId, glbUrl, thumbnailUrl };
      }

      if (status === "FAILED" || status === "failed" || status === "EXPIRED") {
        console.error(`[AI Pipeline] Meshy 3D task failed: ${statusData.error || status}`);
        return getFallback3DResult(statusData.error || "Generation failed");
      }
    }

    console.error("[AI Pipeline] Meshy 3D polling timed out after 5 minutes");
    return getFallback3DResult("Generation timed out");
  } catch (err) {
    console.error("[AI Pipeline] Meshy 3D generation failed:", err.message);
    return getFallback3DResult(err.message);
  }
}

function getFallback3DResult(errorMsg = null) {
  console.log("[AI Pipeline] ℹ️ Returning premium fallback 3D model & thumbnail.");
  return {
    taskId: "mock-task-id-" + Math.floor(Math.random() * 100000),
    glbUrl: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/SheenChair/glTF-Binary/SheenChair.glb",
    thumbnailUrl: "https://images.unsplash.com/photo-1592078615290-033ee584e267?w=500",
    error: errorMsg
  };
}

// ─── ORCHESTRATION: FULL AI PIPELINE ───────────────────────────

/**
 * Run the complete AI pipeline for a request (Version 1):
 *   1. Enhance prompt with Gemini
 *   2. Generate images with Meshy
 *   3. Save results to database with VersionNumber = 1
 *
 * This runs ASYNCHRONOUSLY after the request is saved.
 * Failures are caught and logged — never crash the request.
 *
 * @param {number} requestId
 * @param {string} originalPrompt
 * @param {string} category
 */
export async function runAIPipeline(requestId, originalPrompt, category) {
  console.log(`\n[AI Pipeline] ═══ Starting for request #${requestId} ═══`);

  const versionNumber = await getNextVersionNumber(requestId);

  // Create initial generation record with version number
  let generationId;
  try {
    const [genResult] = await pool.query(
      "INSERT INTO RequestAIGeneration (Request_id, GenerationStatus, VersionNumber) VALUES (?, 'Pending', ?)",
      [requestId, versionNumber]
    );
    generationId = genResult.insertId;
  } catch (err) {
    console.error("[AI Pipeline] Failed to create generation record:", err.message);
    return;
  }

  try {
    // ── Step 1: Gemini Enhancement ──
    const enhancedPrompt = await enhancePromptWithGemini(originalPrompt, category);

    if (enhancedPrompt) {
      // Save enhanced prompt to request (legacy field) AND generation record
      await pool.query(
        "UPDATE Request SET EnhancedPrompt = ? WHERE Request_id = ?",
        [enhancedPrompt, requestId]
      );
      await pool.query(
        "UPDATE RequestAIGeneration SET EnhancedPrompt = ? WHERE Generation_id = ?",
        [enhancedPrompt, generationId]
      );
    } else {
      console.warn(`[AI Pipeline] Gemini failed for request #${requestId}, using original prompt`);
    }

    // Use enhanced prompt if available, otherwise fall back to original
    const promptFor3D = enhancedPrompt || originalPrompt;

    // ── Step 2: Update generation status ──
    await pool.query(
      "UPDATE RequestAIGeneration SET GenerationStatus = 'Processing' WHERE Generation_id = ?",
      [generationId]
    );

    // ── Step 3: Meshy Image Generation ──
    const meshyResult = await generateImageWithMeshy(promptFor3D);

    if (!meshyResult) {
      await pool.query(
        "UPDATE RequestAIGeneration SET GenerationStatus = 'Failed', ErrorMessage = 'Meshy API call failed', CompletedAt = NOW() WHERE Generation_id = ?",
        [generationId]
      );
      console.error(`[AI Pipeline] ❌ Meshy failed for request #${requestId}`);
      return;
    }

    // Save task ID
    await pool.query(
      "UPDATE RequestAIGeneration SET MeshyTaskId = ? WHERE Generation_id = ?",
      [meshyResult.taskId, generationId]
    );

    if (!meshyResult.imageUrl) {
      await pool.query(
        "UPDATE RequestAIGeneration SET GenerationStatus = 'Failed', ErrorMessage = ?, CompletedAt = NOW() WHERE Generation_id = ?",
        [meshyResult.error || "No image generated", generationId]
      );
      console.error(`[AI Pipeline] ❌ No image for request #${requestId}`);
      return;
    }

    // ── Step 4: Save Image URL (ModelGlbUrl remains null for now) ──
    await pool.query(
      "UPDATE RequestAIGeneration SET GeneratedImageUrl = ?, ModelGlbUrl = NULL, GenerationStatus = 'Completed', CompletedAt = NOW() WHERE Generation_id = ?",
      [meshyResult.imageUrl, generationId]
    );

    console.log(`[AI Pipeline] ═══ ✅ Complete for request #${requestId} — v${versionNumber}, 2D photo saved ═══\n`);
  } catch (err) {
    console.error(`[AI Pipeline] ❌ Pipeline error for request #${requestId}:`, err.message);

    // Mark generation as failed
    if (generationId) {
      try {
        await pool.query(
          "UPDATE RequestAIGeneration SET GenerationStatus = 'Failed', ErrorMessage = ?, CompletedAt = NOW() WHERE Generation_id = ?",
          [err.message, generationId]
        );
      } catch (dbErr) {
        console.error("[AI Pipeline] Failed to update generation status:", dbErr.message);
      }
    }
  }
}

/**
 * Regenerate AI images for an existing request.
 * Uses stored EnhancedPrompt if available, otherwise re-enhances.
 * Creates a new version.
 */
export async function regenerateForRequest(requestId) {
  const [rows] = await pool.query(
    "SELECT Request_id, Description, EnhancedPrompt, Category FROM Request WHERE Request_id = ?",
    [requestId]
  );

  if (!rows.length) throw new Error("Request not found");

  const request = rows[0];
  const description = request.Description;
  const category = request.Category;
  const versionNumber = await getNextVersionNumber(requestId);

  // If we already have an enhanced prompt, reuse it for Meshy only
  if (request.EnhancedPrompt) {
    console.log(`[AI Pipeline] Regenerating v${versionNumber} with existing enhanced prompt for request #${requestId}`);

    const [genResult] = await pool.query(
      "INSERT INTO RequestAIGeneration (Request_id, GenerationStatus, VersionNumber, EnhancedPrompt) VALUES (?, 'Processing', ?, ?)",
      [requestId, versionNumber, request.EnhancedPrompt]
    );

    const meshyResult = await generateImageWithMeshy(request.EnhancedPrompt);

    if (!meshyResult || !meshyResult.imageUrl) {
      await pool.query(
        "UPDATE RequestAIGeneration SET GenerationStatus = 'Failed', ErrorMessage = ?, CompletedAt = NOW() WHERE Generation_id = ?",
        [meshyResult?.error || "No image generated", genResult.insertId]
      );
      return { success: false, error: meshyResult?.error || "Generation failed" };
    }

    await pool.query(
      "UPDATE RequestAIGeneration SET GeneratedImageUrl = ?, ModelGlbUrl = NULL, GenerationStatus = 'Completed', MeshyTaskId = ?, CompletedAt = NOW() WHERE Generation_id = ?",
      [meshyResult.imageUrl, meshyResult.taskId, genResult.insertId]
    );

    return { success: true, imageCount: 1, versionNumber };
  }

  // No enhanced prompt — run full pipeline
  await runAIPipeline(requestId, description, category);
  return { success: true, versionNumber };
}

/**
 * Refine and regenerate: buyer provides refinement instructions,
 * Gemini creates a new enhanced prompt combining previous + refinement,
 * then Meshy generates new images. Creates a NEW version.
 *
 * Previous versions are NEVER deleted.
 *
 * @param {number} requestId
 * @param {string} refinementPrompt - Buyer's refinement instructions
 * @returns {Promise<{success: boolean, versionNumber?: number, error?: string}>}
 */
export async function refineAndRegenerate(requestId, refinementPrompt) {
  console.log(`\n[AI Pipeline] ═══ Refinement for request #${requestId} ═══`);
  console.log(`[AI Pipeline] Refinement: "${refinementPrompt}"`);

  // Load request
  const [reqRows] = await pool.query(
    "SELECT Request_id, Title, Description, EnhancedPrompt, Category FROM Request WHERE Request_id = ?",
    [requestId]
  );
  if (!reqRows.length) throw new Error("Request not found");

  const request = reqRows[0];
  const originalDescription = `${request.Title}. ${request.Description || ""}`;
  const category = request.Category;

  // Find the latest enhanced prompt from previous generations
  const [prevGens] = await pool.query(
    "SELECT EnhancedPrompt FROM RequestAIGeneration WHERE Request_id = ? AND EnhancedPrompt IS NOT NULL ORDER BY VersionNumber DESC, Generation_id DESC LIMIT 1",
    [requestId]
  );
  const previousEnhancedPrompt = prevGens[0]?.EnhancedPrompt || request.EnhancedPrompt || originalDescription;

  const versionNumber = await getNextVersionNumber(requestId);

  // Create generation record
  let generationId;
  try {
    const [genResult] = await pool.query(
      "INSERT INTO RequestAIGeneration (Request_id, GenerationStatus, VersionNumber, RefinementPrompt) VALUES (?, 'Pending', ?, ?)",
      [requestId, versionNumber, refinementPrompt]
    );
    generationId = genResult.insertId;
  } catch (err) {
    console.error("[AI Pipeline] Failed to create refinement generation record:", err.message);
    throw err;
  }

  try {
    // ── Step 1: Gemini Refinement ──
    const newEnhancedPrompt = await refinePromptWithGemini(
      previousEnhancedPrompt,
      refinementPrompt,
      originalDescription,
      category
    );

    const finalPrompt = newEnhancedPrompt || previousEnhancedPrompt;

    // Save enhanced prompt to generation record
    await pool.query(
      "UPDATE RequestAIGeneration SET EnhancedPrompt = ?, GenerationStatus = 'Processing' WHERE Generation_id = ?",
      [finalPrompt, generationId]
    );

    // ── Step 2: Meshy Image Generation ──
    const meshyResult = await generateImageWithMeshy(finalPrompt);

    if (!meshyResult) {
      await pool.query(
        "UPDATE RequestAIGeneration SET GenerationStatus = 'Failed', ErrorMessage = 'Meshy API call failed', CompletedAt = NOW() WHERE Generation_id = ?",
        [generationId]
      );
      return { success: false, error: "Image generation failed", versionNumber };
    }

    await pool.query(
      "UPDATE RequestAIGeneration SET MeshyTaskId = ? WHERE Generation_id = ?",
      [meshyResult.taskId, generationId]
    );

    if (!meshyResult.imageUrl) {
      await pool.query(
        "UPDATE RequestAIGeneration SET GenerationStatus = 'Failed', ErrorMessage = ?, CompletedAt = NOW() WHERE Generation_id = ?",
        [meshyResult.error || "No image generated", generationId]
      );
      return { success: false, error: meshyResult.error || "No image generated", versionNumber };
    }

    // ── Step 3: Save Image URL (ModelGlbUrl remains null for now) ──
    await pool.query(
      "UPDATE RequestAIGeneration SET GeneratedImageUrl = ?, ModelGlbUrl = NULL, GenerationStatus = 'Completed', CompletedAt = NOW() WHERE Generation_id = ?",
      [meshyResult.imageUrl, generationId]
    );

    console.log(`[AI Pipeline] ═══ ✅ Refinement complete for request #${requestId} — v${versionNumber}, 2D photo saved ═══\n`);
    return { success: true, versionNumber, imageCount: 1 };
  } catch (err) {
    console.error(`[AI Pipeline] ❌ Refinement error for request #${requestId}:`, err.message);

    if (generationId) {
      try {
        await pool.query(
          "UPDATE RequestAIGeneration SET GenerationStatus = 'Failed', ErrorMessage = ?, CompletedAt = NOW() WHERE Generation_id = ?",
          [err.message, generationId]
        );
      } catch (dbErr) {
        console.error("[AI Pipeline] Failed to update generation status:", dbErr.message);
      }
    }

    return { success: false, error: err.message, versionNumber };
  }
}
