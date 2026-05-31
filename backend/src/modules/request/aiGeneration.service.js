import pool from "../../db/connection.js";

// ══════════════════════════════════════════════════════════════
//  AI Generation Service — Gemini + Meshy AI Pipeline
//  Supports versioned refinement for iterative design workflow
// ══════════════════════════════════════════════════════════════

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
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
 * Generate images using Meshy AI text-to-image API.
 * @param {string} prompt - The enhanced prompt
 * @returns {Promise<{taskId: string, imageUrls: string[]}|null>}
 */
export async function generateImagesWithMeshy(prompt) {
  const apiKey = process.env.MESHY_API_KEY;
  if (!apiKey) {
    console.error("[AI Pipeline] MESHY_API_KEY not configured");
    return null;
  }

  try {
    // Step 1: Create the generation task
    console.log("[AI Pipeline] Submitting to Meshy AI...");
    const createRes = await fetch(MESHY_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ai_model: "nano-banana",
        prompt: prompt,
        aspect_ratio: "1:1",
        generate_multi_view: false,
      }),
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      console.error(`[AI Pipeline] Meshy create error ${createRes.status}:`, errText);
      return null;
    }

    const createData = await createRes.json();
    const taskId = createData.result;

    if (!taskId) {
      console.error("[AI Pipeline] Meshy returned no task ID:", createData);
      return null;
    }

    console.log(`[AI Pipeline] Meshy task created: ${taskId}`);

    // Step 2: Poll for completion (5s intervals, max 2 minutes)
    const maxAttempts = 24; // 24 * 5s = 120s = 2 minutes
    const pollInterval = 5000;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, pollInterval));

      const statusRes = await fetch(`${MESHY_API_URL}/${taskId}`, {
        headers: { "Authorization": `Bearer ${apiKey}` },
      });

      if (!statusRes.ok) {
        console.warn(`[AI Pipeline] Meshy poll error (attempt ${attempt + 1}):`, statusRes.status);
        continue;
      }

      const statusData = await statusRes.json();
      const status = statusData.status;

      console.log(`[AI Pipeline] Meshy poll ${attempt + 1}/${maxAttempts}: ${status}`);

      if (status === "SUCCEEDED" || status === "completed") {
        // Extract exactly ONE image URL from the response to prevent duplication/excess token display
        let imageUrl = null;
        if (statusData.output?.image_url) {
          imageUrl = statusData.output.image_url;
        } else if (statusData.image_url) {
          imageUrl = statusData.image_url;
        } else if (statusData.output?.image_urls && Array.isArray(statusData.output.image_urls) && statusData.output.image_urls.length > 0) {
          imageUrl = statusData.output.image_urls[0];
        } else if (statusData.image_urls && Array.isArray(statusData.image_urls) && statusData.image_urls.length > 0) {
          imageUrl = statusData.image_urls[0];
        }

        if (!imageUrl) {
          console.warn("[AI Pipeline] Meshy succeeded but no image URL found:", JSON.stringify(statusData).slice(0, 500));
          return { taskId, imageUrls: [] };
        }

        console.log(`[AI Pipeline] ✅ Meshy generated image: ${imageUrl}`);
        return { taskId, imageUrls: [imageUrl] };
      }

      if (status === "FAILED" || status === "failed" || status === "EXPIRED") {
        console.error(`[AI Pipeline] Meshy task failed: ${statusData.error || status}`);
        return { taskId, imageUrls: [], error: statusData.error || "Generation failed" };
      }
    }

    console.error("[AI Pipeline] Meshy polling timed out after 2 minutes");
    return { taskId, imageUrls: [], error: "Generation timed out" };
  } catch (err) {
    console.error("[AI Pipeline] Meshy generation failed:", err.message);
    return null;
  }
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
    const promptForImage = enhancedPrompt || originalPrompt;

    // ── Step 2: Update generation status ──
    await pool.query(
      "UPDATE RequestAIGeneration SET GenerationStatus = 'Processing' WHERE Generation_id = ?",
      [generationId]
    );

    // ── Step 3: Meshy Image Generation ──
    const meshyResult = await generateImagesWithMeshy(promptForImage);

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

    if (meshyResult.imageUrls.length === 0) {
      await pool.query(
        "UPDATE RequestAIGeneration SET GenerationStatus = 'Failed', ErrorMessage = ?, CompletedAt = NOW() WHERE Generation_id = ?",
        [meshyResult.error || "No images generated", generationId]
      );
      console.error(`[AI Pipeline] ❌ No images for request #${requestId}`);
      return;
    }

    // ── Step 4: Save images ──
    // Update first record with first image
    await pool.query(
      "UPDATE RequestAIGeneration SET GeneratedImageUrl = ?, GenerationStatus = 'Completed', CompletedAt = NOW() WHERE Generation_id = ?",
      [meshyResult.imageUrls[0], generationId]
    );

    // Insert additional images as separate records (same version)
    for (let i = 1; i < meshyResult.imageUrls.length; i++) {
      await pool.query(
        "INSERT INTO RequestAIGeneration (Request_id, MeshyTaskId, GeneratedImageUrl, GenerationStatus, CompletedAt, VersionNumber, EnhancedPrompt) VALUES (?, ?, ?, 'Completed', NOW(), ?, ?)",
        [requestId, meshyResult.taskId, meshyResult.imageUrls[i], versionNumber, enhancedPrompt || originalPrompt]
      );
    }

    console.log(`[AI Pipeline] ═══ ✅ Complete for request #${requestId} — v${versionNumber}, ${meshyResult.imageUrls.length} image(s) saved ═══\n`);
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

    const meshyResult = await generateImagesWithMeshy(request.EnhancedPrompt);

    if (!meshyResult || meshyResult.imageUrls.length === 0) {
      await pool.query(
        "UPDATE RequestAIGeneration SET GenerationStatus = 'Failed', ErrorMessage = ?, CompletedAt = NOW() WHERE Generation_id = ?",
        [meshyResult?.error || "No images generated", genResult.insertId]
      );
      return { success: false, error: meshyResult?.error || "Generation failed" };
    }

    await pool.query(
      "UPDATE RequestAIGeneration SET GeneratedImageUrl = ?, GenerationStatus = 'Completed', MeshyTaskId = ?, CompletedAt = NOW() WHERE Generation_id = ?",
      [meshyResult.imageUrls[0], meshyResult.taskId, genResult.insertId]
    );

    for (let i = 1; i < meshyResult.imageUrls.length; i++) {
      await pool.query(
        "INSERT INTO RequestAIGeneration (Request_id, MeshyTaskId, GeneratedImageUrl, GenerationStatus, CompletedAt, VersionNumber, EnhancedPrompt) VALUES (?, ?, ?, 'Completed', NOW(), ?, ?)",
        [requestId, meshyResult.taskId, meshyResult.imageUrls[i], versionNumber, request.EnhancedPrompt]
      );
    }

    return { success: true, imageCount: meshyResult.imageUrls.length, versionNumber };
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
    const meshyResult = await generateImagesWithMeshy(finalPrompt);

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

    if (meshyResult.imageUrls.length === 0) {
      await pool.query(
        "UPDATE RequestAIGeneration SET GenerationStatus = 'Failed', ErrorMessage = ?, CompletedAt = NOW() WHERE Generation_id = ?",
        [meshyResult.error || "No images generated", generationId]
      );
      return { success: false, error: meshyResult.error || "No images generated", versionNumber };
    }

    // ── Step 3: Save images ──
    await pool.query(
      "UPDATE RequestAIGeneration SET GeneratedImageUrl = ?, GenerationStatus = 'Completed', CompletedAt = NOW() WHERE Generation_id = ?",
      [meshyResult.imageUrls[0], generationId]
    );

    for (let i = 1; i < meshyResult.imageUrls.length; i++) {
      await pool.query(
        "INSERT INTO RequestAIGeneration (Request_id, MeshyTaskId, GeneratedImageUrl, GenerationStatus, CompletedAt, VersionNumber, RefinementPrompt, EnhancedPrompt) VALUES (?, ?, ?, 'Completed', NOW(), ?, ?, ?)",
        [requestId, meshyResult.taskId, meshyResult.imageUrls[i], versionNumber, refinementPrompt, finalPrompt]
      );
    }

    console.log(`[AI Pipeline] ═══ ✅ Refinement complete for request #${requestId} — v${versionNumber}, ${meshyResult.imageUrls.length} image(s) ═══\n`);
    return { success: true, versionNumber, imageCount: meshyResult.imageUrls.length };
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
