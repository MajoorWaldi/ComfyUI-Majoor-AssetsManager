//#region js/components/sidebar/parsers/a1111ParamsParser.ts
function e(e) {
	if (!e || typeof e != "string") return null;
	let t = {}, n = e.split(/\nNegative prompt:\s*/i);
	if (n[0] && (t.prompt = n[0].trim()), n[1]) {
		let e = n[1].match(/^(.*?)\n?(Steps:.*)$/s);
		if (e) {
			t.negative_prompt = e[1].trim();
			let n = e[2], r = (e) => {
				let t = n.match(e);
				return t ? t[1].trim() : null;
			};
			t.steps = r(/Steps:\s*(\d+)/i), t.sampler = r(/Sampler:\s*([^,\n]+)/i), t.cfg = r(/CFG scale:\s*([\d.]+)/i), t.seed = r(/Seed:\s*(\d+)/i), t.width = r(/Size:\s*(\d+)x\d+/i), t.height = r(/Size:\s*\d+x(\d+)/i), t.model = r(/Model:\s*([^,\n]+)/i), t.denoising = r(/Denoising strength:\s*([\d.]+)/i), t.clip_skip = r(/Clip skip:\s*(\d+)/i);
		} else t.negative_prompt = n[1].trim();
	}
	return Object.keys(t).length > 0 ? t : null;
}
//#endregion
//#region js/components/sidebar/parsers/comfyWorkflowParser.ts
function t(e) {
	try {
		let t = Object.entries(e || {});
		if (!t.length) return !1;
		let n = 0;
		for (let [, e] of t.slice(0, 50)) if (!(!e || typeof e != "object") && (e.inputs && typeof e.inputs == "object" && (n += 1), n >= 2)) return !0;
		return !1;
	} catch {
		return !1;
	}
}
function n(e) {
	if (!e || typeof e != "object") return null;
	let n = {}, r = (e.prompt && typeof e.prompt == "object" ? e.prompt : null) || (t(e) ? e : null);
	if (r) {
		let e = [];
		for (let [, t] of Object.entries(r)) {
			if (!t || typeof t != "object") continue;
			let r = t.inputs;
			if (!r || typeof r != "object") continue;
			let i = String(t?.class_type || t?.type || "").toLowerCase(), a = String(t?.title || t?._meta?.title || "").toLowerCase(), o = (e, t) => {
				if (n[e] || typeof t != "string") return;
				let r = t.trim();
				r && (/^[\d\s.,+-]+$/.test(r) || (n[e] = r));
			};
			if ((i.includes("cliptextencode") || i.includes("clip_text_encode") || a.includes("clip text encode")) && typeof r.text == "string") {
				let e = a.includes("negative");
				a.includes("positive") || a.includes("(prompt)") || a.includes("prompt"), o(e ? "negative_prompt" : "prompt", r.text);
			}
			if (o("negative_prompt", r.negative_prompt), o("negative_prompt", r.negative), !n.prompt && typeof r.text == "string") {
				let e = r.text.trim();
				(i.includes("prompt") || i.includes("encode") || i.includes("positive") || i.includes("negative") || a.includes("prompt") || a.includes("positive") || a.includes("negative")) && e.length >= 12 && /[a-zA-Z]/.test(e) && o("prompt", e);
			}
			r.seed !== void 0 && n.seed === void 0 && (n.seed = r.seed), r.steps !== void 0 && n.steps === void 0 && (n.steps = r.steps), r.cfg !== void 0 && n.cfg === void 0 && (n.cfg = r.cfg), r.sampler_name && !n.sampler && (n.sampler = r.sampler_name), r.scheduler && !n.scheduler && (n.scheduler = r.scheduler), r.denoise !== void 0 && n.denoise === void 0 && (n.denoise = r.denoise), r.width !== void 0 && n.width === void 0 && (n.width = r.width), r.height !== void 0 && n.height === void 0 && (n.height = r.height);
			let s = (e, t) => {
				if (n[e] || typeof t != "string") return;
				let r = t.trim();
				r && (n[e] = r);
			}, c = [
				r.ckpt_name,
				r.checkpoint,
				r.checkpoint_name,
				r.model_name,
				r.model
			];
			for (let e of c) n.model || s("model", e);
			if (s("vae", r.vae_name || r.vae), s("clip", r.clip_name || r.clip), s("unet", r.unet_name || r.unet), s("diffusion", r.diffusion_name || r.diffusion_model || r.diffusion), i.includes("lora") || i.includes("loraloader")) {
				let t = r.lora_name || r.lora || r.name || null, n = r.strength_model ?? r.strength ?? r.weight ?? r.lora_strength ?? null;
				t && e.push({
					name: t,
					weight: n
				});
			}
		}
		e.length && (n.loras = e);
	}
	return Object.keys(n).length > 0 ? n : null;
}
//#endregion
//#region js/components/sidebar/parsers/geninfoParser.ts
var r = /^(?:[a-z]:[\\/]|[\\/]{1,2}|\.{1,2}[\\/]|~[\\/]).+?[\\/][^\\/\n]+\.(?:png|jpe?g|webp|gif|bmp|tiff?|avif|heic|heif|apng|hdr|svg|mp4|webm|mov|mkv|avi|m4v|mp3|wav|flac|ogg|glb|gltf|obj|fbx|ply|stl|ckpt|safetensors|pt|pth|bin|gguf|json|ya?ml)$/i, i = /^(?!.*[,;])(?!.*\b(?:cinematic|portrait|landscape|lighting|style|detailed|masterpiece|photo|render)\b).*(?:[\\/][^\\/\n]+){2,}\.(?:png|jpe?g|webp|gif|bmp|tiff?|avif|heic|heif|apng|hdr|svg|mp4|webm|mov|mkv|avi|m4v|mp3|wav|flac|ogg|glb|gltf|obj|fbx|ply|stl|ckpt|safetensors|pt|pth|bin|gguf|json|ya?ml)$/i;
function a(r) {
	if (!r) return null;
	if (typeof r == "object") {
		let i = r.geninfo || r.GenInfo || r.generation || null;
		if (i && typeof i == "object") {
			let e = {}, t = i.positive?.value ?? i.positive?.text ?? null, n = i.negative?.value ?? i.negative?.text ?? null;
			typeof t == "string" && t.trim() && (e.prompt = t), typeof n == "string" && n.trim() && (e.negative_prompt = n);
			let r = i.checkpoint?.name ?? i.checkpoint ?? null;
			typeof r == "string" && r.trim() && (e.model = r);
			let a = i.clip?.name ?? i.clip ?? null;
			typeof a == "string" && a.trim() && (e.clip = a);
			let o = i.vae?.name ?? i.vae ?? null;
			typeof o == "string" && o.trim() && (e.vae = o);
			let s = i.models;
			s && typeof s == "object" && (e.models = s);
			let c = Array.isArray(i.model_groups) ? i.model_groups : null;
			c && c.length && (e.model_groups = c);
			let l = Array.isArray(i.loras) ? i.loras : null;
			l && (e.loras = l);
			let u = i.sampler?.name ?? i.sampler ?? null;
			typeof u == "string" && u.trim() && (e.sampler = u);
			let d = i.scheduler?.name ?? i.scheduler ?? null;
			typeof d == "string" && d.trim() && (e.scheduler = d);
			let f = i.steps?.value ?? i.steps ?? null;
			f != null && (e.steps = f);
			let p = i.cfg?.value ?? i.cfg ?? null;
			p != null && (e.cfg = p);
			let m = i.cfg_high_noise?.value ?? i.cfg_high_noise ?? null;
			m != null && (e.cfg_high_noise = m);
			let h = i.cfg_low_noise?.value ?? i.cfg_low_noise ?? null;
			h != null && (e.cfg_low_noise = h);
			let g = i.seed?.value ?? i.seed ?? null;
			g != null && (e.seed = g);
			let _ = i.voice?.name ?? i.voice?.value ?? i.voice ?? null;
			_ != null && String(_).trim() && (e.voice = String(_).trim());
			let v = i.language?.value ?? i.language ?? null;
			v != null && String(v).trim() && (e.language = String(v).trim());
			let y = i.temperature?.value ?? i.temperature ?? null;
			y != null && (e.temperature = y);
			let b = i.top_k?.value ?? i.top_k ?? null;
			b != null && (e.top_k = b);
			let x = i.top_p?.value ?? i.top_p ?? null;
			x != null && (e.top_p = x);
			let S = i.repetition_penalty?.value ?? i.repetition_penalty ?? null;
			S != null && (e.repetition_penalty = S);
			let C = i.max_new_tokens?.value ?? i.max_new_tokens ?? null;
			C != null && (e.max_new_tokens = C);
			let w = i.device?.value ?? i.device ?? null;
			w != null && String(w).trim() && (e.device = String(w).trim());
			let T = i.voice_preset?.value ?? i.voice_preset ?? null;
			T != null && String(T).trim() && (e.voice_preset = String(T).trim());
			let E = i.instruct?.value ?? i.instruct ?? null;
			E != null && String(E).trim() && (e.instruct = String(E).trim());
			let D = i.dtype?.value ?? i.dtype ?? null;
			D != null && String(D).trim() && (e.dtype = String(D).trim());
			let O = i.attn_implementation?.value ?? i.attn_implementation ?? null;
			O != null && String(O).trim() && (e.attn_implementation = String(O).trim());
			let k = i.x_vector_only_mode?.value ?? i.x_vector_only_mode ?? null;
			k != null && (e.x_vector_only_mode = k);
			let A = i.use_torch_compile?.value ?? i.use_torch_compile ?? null;
			A != null && (e.use_torch_compile = A);
			let j = i.use_cuda_graphs?.value ?? i.use_cuda_graphs ?? null;
			j != null && (e.use_cuda_graphs = j);
			let M = i.compile_mode?.value ?? i.compile_mode ?? null;
			M != null && String(M).trim() && (e.compile_mode = String(M).trim());
			let N = i.enable_chunking?.value ?? i.enable_chunking ?? null;
			N != null && (e.enable_chunking = N);
			let P = i.max_chars_per_chunk?.value ?? i.max_chars_per_chunk ?? null;
			P != null && (e.max_chars_per_chunk = P);
			let F = i.chunk_combination_method?.value ?? i.chunk_combination_method ?? null;
			F != null && String(F).trim() && (e.chunk_combination_method = String(F).trim());
			let I = i.silence_between_chunks_ms?.value ?? i.silence_between_chunks_ms ?? null;
			I != null && (e.silence_between_chunks_ms = I);
			let L = i.enable_audio_cache?.value ?? i.enable_audio_cache ?? null;
			L != null && (e.enable_audio_cache = L);
			let R = i.batch_size?.value ?? i.batch_size ?? null;
			R != null && (e.batch_size = R);
			let z = i.denoise?.value ?? i.denoise ?? null;
			z != null && (e.denoise = z);
			let B = i.clip_skip?.value ?? i.clip_skip ?? i.clipSkip ?? null;
			B != null && (e.clip_skip = B);
			let V = i.inputs;
			Array.isArray(V) && (e.inputs = V);
			let H = i.lyrics?.value ?? i.lyrics ?? null;
			typeof H == "string" && H.trim() && (e.lyrics = H);
			let U = i.lyrics_strength?.value ?? i.lyrics_strength ?? null;
			U != null && (e.lyrics_strength = U), Array.isArray(i.all_positive_prompts) && i.all_positive_prompts.length > 1 && (e.all_positive_prompts = i.all_positive_prompts), Array.isArray(i.all_negative_prompts) && i.all_negative_prompts.length > 1 && (e.all_negative_prompts = i.all_negative_prompts), Array.isArray(i.all_samplers) && i.all_samplers.length > 1 && (e.all_samplers = i.all_samplers), Array.isArray(i.chained_passes) && i.chained_passes.length > 1 && (e.chained_passes = i.chained_passes), Array.isArray(i.all_checkpoints) && i.all_checkpoints.length > 1 && (e.all_checkpoints = i.all_checkpoints);
			let W = i.size || null;
			if (W && typeof W == "object" && (W.width !== void 0 && (e.width = W.width), W.height !== void 0 && (e.height = W.height)), i.engine && typeof i.engine == "object" && (e.engine = i.engine), Object.keys(e).length) return e;
		}
		if ([
			"prompt",
			"negative_prompt",
			"negativePrompt",
			"steps",
			"sampler",
			"sampler_name",
			"cfg",
			"cfg_scale",
			"seed",
			"width",
			"height"
		].some((e) => Object.prototype.hasOwnProperty.call(r, e))) return r;
		let a = n(r);
		if (a) return a;
		if (t(r)) {
			let e = n({ prompt: r });
			if (e) return e;
		}
		let o = r.parameters || r["PNG:Parameters"] || r["EXIF:UserComment"] || r.UserComment || r.ImageDescription || null;
		if (typeof o == "string") {
			let t = e(o);
			if (t) return t;
		}
		let s = r.workflow || r.Workflow || r.comfy || r.comfyui || r.ComfyUI || null;
		if (s && typeof s == "object") {
			let e = n(s);
			if (e) return e;
		}
		return r;
	}
	if (typeof r == "string") {
		let t = r.trim();
		if (!t) return null;
		let n = e(t);
		if (n) return n;
		if (t.startsWith("{") && t.endsWith("}") || t.startsWith("[") && t.endsWith("]")) try {
			return a(JSON.parse(t));
		} catch {
			return null;
		}
		return { prompt: t };
	}
	return null;
}
function o(e) {
	let t = typeof e == "string" ? e.trim() : "";
	return !t || t.includes("\n") ? !1 : r.test(t) || i.test(t);
}
function s(e) {
	let t = typeof e == "string" ? e.trim() : "";
	return t ? o(t) ? "" : t : "";
}
function c(e, t) {
	let n = s(e), r = s(t);
	if (n) {
		let e = /(?:^|\n)\s*Negative prompt:\s*/i;
		if (e.test(n)) {
			let t = n.split(e), i = (t[0] || "").trim(), a = t.slice(1).join("Negative prompt:").trim(), o = a.search(/\n\s*Steps:\s*\d+/i), c = (o >= 0 ? a.slice(0, o) : a).trim();
			i && (n = s(i)), !r && c && (r = s(c));
		}
	}
	return n && r && n.trim() === r.trim() && (r = ""), {
		positive: n,
		negative: r
	};
}
function l(e) {
	if (!e) return "";
	let t = String(e).trim().replace(/\\/g, "/");
	return (t.split("/").pop() || t).replace(/\.(safetensors|ckpt|pt|pth|bin|gguf|json)$/i, "");
}
function u(e) {
	if (!e) return "";
	if (typeof e == "string") return l(e);
	let t = l(e.name || e.lora_name || "");
	if (!t) return "";
	let n = e.weight ?? e.strength ?? null, r = e.strength_model ?? null, i = e.strength_clip ?? null;
	if (r !== null || i !== null) {
		let e = [];
		return r != null && e.push(`m=${r}`), i != null && e.push(`c=${i}`), e.length ? `${t} (${e.join(", ")})` : t;
	}
	return n == null ? t : `${t} (${n})`;
}
function d(e) {
	let t = String(e || "").trim().toLowerCase();
	return t ? t === "img2vid" ? "Image-to-Video" : t === "txt2vid" ? "Text-to-Video" : t === "img2img" ? "Image-to-Image" : t === "txt2img" ? "Text-to-Image" : t === "vid2vid" ? "Video-to-Video" : t === "tts" ? "Text-to-Speech" : t === "audio" ? "Audio" : t.split(/[_\s-]+/).filter(Boolean).map((e) => e.charAt(0).toUpperCase() + e.slice(1)).join(" ") : "";
}
function f(e) {
	let t = String(e || "").trim().toLowerCase();
	if (!t || t === "api") return "";
	let n = {
		happy_horse: "Happy Horse",
		google_gemini: "Google Gemini",
		google_veo: "Google Veo",
		openai: "OpenAI",
		anthropic: "Anthropic",
		black_forest_labs: "Black Forest Labs",
		stability_ai: "Stability AI",
		alibaba_wan: "Alibaba Wan",
		kling_ai: "Kling AI",
		luma_dream_machine: "Luma Dream Machine",
		minimax_hailuo: "MiniMax Hailuo",
		xai_grok: "xAI Grok",
		ltxv_api: "LTXV API",
		eleven_labs: "ElevenLabs",
		bytedance_seedance: "ByteDance Seedance"
	};
	return n[t] ? n[t] : t.split(/[_\s-]+/).filter(Boolean).map((e) => e.charAt(0).toUpperCase() + e.slice(1)).join(" ");
}
function p(e) {
	let t = e?.engine && typeof e.engine == "object" ? e.engine : null, n = String(t?.type || "").trim(), r = String(t?.sampler_mode || "").trim().toLowerCase(), i = d(n) || n, a = f(t?.api_provider), o = r === "api" ? `API ${i || "Workflow"}` : i;
	return {
		workflowType: n,
		workflowLabel: String(o || n).trim(),
		workflowBadge: a
	};
}
//#endregion
export { c as a, a as i, u as n, s as o, l as r, p as t };
