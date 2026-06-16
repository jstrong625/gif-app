const axios = require('axios');

const MODEL = 'realisticVisionV51_v51VAE.safetensors';
const NEGATIVE_PROMPT = 'ugly, deformed, blurry, bad anatomy, bad hands, missing fingers, extra limbs, watermark, text, logo, cropped, low quality, jpeg artifacts, clothes, clothed, dressed';

function getApiKey() {
  const apiKey = process.env.NOVITA_API_KEY;
  if (!apiKey) throw new Error('Explicit mode requires a NovitaAI API key. Add NOVITA_API_KEY in your Render Environment settings.');
  return apiKey;
}

function authHeaders() {
  return { Authorization: `Bearer ${getApiKey()}`, 'Content-Type': 'application/json' };
}

async function pollResult(taskId) {
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const res = await axios.get(
      `https://api.novita.ai/v3/async/task-result?task_id=${taskId}`,
      { headers: authHeaders(), timeout: 15000 }
    );
    console.log('Poll status:', res.data.task.status, JSON.stringify(res.data).slice(0, 200));
    const status = res.data.task?.status;
    const images = res.data.images;
    if (status === 'TASK_STATUS_SUCCEED' && images?.length) {
      const imageUrl = images[0].image_url;
      const imgRes = await axios.get(imageUrl, { responseType: 'arraybuffer', timeout: 30000 });
      return Buffer.from(imgRes.data);
    }
    if (status === 'TASK_STATUS_FAILED') throw new Error('NovitaAI generation failed: ' + JSON.stringify(res.data));
  }
  throw new Error('NovitaAI timed out after 2 minutes');
}

async function txt2img(prompt, contentLevel) {
  const contentTag = contentLevel === 'explicit' ? ', explicit, NSFW, nude' : ', sensual, suggestive, tasteful nudity';
  const fullPrompt = `${prompt}${contentTag}, photorealistic, high quality, sharp focus, 8k`;

  const body = {
    model_name: MODEL,
    prompt: fullPrompt,
    negative_prompt: NEGATIVE_PROMPT,
    width: 512,
    height: 768,
    image_num: 1,
    steps: 30,
    seed: -1,
    guidance_scale: 7,
    sampler_name: 'DPM++ 2M Karras',
  };

  console.log('NovitaAI txt2img request:', JSON.stringify(body).slice(0, 300));
  const res = await axios.post('https://api.novita.ai/v3/async/txt2img', body, {
    headers: authHeaders(), timeout: 30000,
  }).catch((e) => { throw new Error('NovitaAI txt2img error: ' + (e.response?.data ? JSON.stringify(e.response.data) : e.message)); });

  console.log('NovitaAI txt2img response:', JSON.stringify(res.data).slice(0, 200));
  return pollResult(res.data.task_id);
}

async function img2img(imageBuffer, prompt, contentLevel) {
  const imageBase64 = imageBuffer.toString('base64');
  const contentTag = contentLevel === 'explicit' ? ', explicit, NSFW, nude' : ', sensual, suggestive, tasteful nudity';
  const fullPrompt = `${prompt}${contentTag}, photorealistic, high quality, sharp focus, 8k`;

  const body = {
    model_name: MODEL,
    prompt: fullPrompt,
    negative_prompt: NEGATIVE_PROMPT,
    image_base64: imageBase64,
    strength: 0.8,
    width: 512,
    height: 768,
    image_num: 1,
    steps: 30,
    seed: -1,
    guidance_scale: 7,
    sampler_name: 'DPM++ 2M Karras',
  };

  console.log('NovitaAI img2img request (no base64):', JSON.stringify({...body, image_base64: '[omitted]'}));
  const res = await axios.post('https://api.novita.ai/v3/async/img2img', body, {
    headers: authHeaders(), timeout: 30000,
  }).catch((e) => { throw new Error('NovitaAI img2img error: ' + (e.response?.data ? JSON.stringify(e.response.data) : e.message)); });

  console.log('NovitaAI img2img response:', JSON.stringify(res.data).slice(0, 200));
  return pollResult(res.data.task_id);
}

module.exports = { txt2img, img2img };
