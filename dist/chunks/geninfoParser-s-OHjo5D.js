//#region ui/components/sidebar/parsers/a1111ParamsParser.ts
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
//#region ui/components/sidebar/parsers/comfyWorkflowParser.ts
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
//#region ui/components/sidebar/parsers/geninfoParser.ts
var r = /^(?:[a-z]:[\\/]|[\\/]{1,2}|\.{1,2}[\\/]|~[\\/]).+?[\\/][^\\/\n]+\.(?:png|jpe?g|webp|gif|bmp|tiff?|avif|heic|heif|apng|hdr|svg|mp4|webm|mov|mkv|avi|m4v|mp3|wav|flac|ogg|glb|gltf|obj|fbx|ply|stl|ckpt|safetensors|pt|pth|bin|gguf|json|ya?ml)$/i, i = /^(?!.*[,;])(?!.*\b(?:cinematic|portrait|landscape|lighting|style|detailed|masterpiece|photo|render)\b).*(?:[\\/][^\\/\n]+){2,}\.(?:png|jpe?g|webp|gif|bmp|tiff?|avif|heic|heif|apng|hdr|svg|mp4|webm|mov|mkv|avi|m4v|mp3|wav|flac|ogg|glb|gltf|obj|fbx|ply|stl|ckpt|safetensors|pt|pth|bin|gguf|json|ya?ml)$/i;
function a(r) {
	if (!r) return null;
	if (typeof r == "object") {
		let i = r.geninfo || r.GenInfo || r.generation || null;
		if (i && typeof i == "object") {
			let e = {}, t = /* @__PURE__ */ new Set(), n = (e, n) => {
				if (!(!n || typeof n != "object") && !(n.confidence !== "override" && n.source !== "majoor_geninfo")) for (let n of Array.isArray(e) ? e : [e]) t.add(n);
			}, r = i.positive?.value ?? i.positive?.text ?? null, a = i.negative?.value ?? i.negative?.text ?? null;
			typeof r == "string" && r.trim() && (e.prompt = r), typeof a == "string" && a.trim() && (e.negative_prompt = a), n("prompt", i.positive), n("negative_prompt", i.negative);
			let o = i.checkpoint?.name ?? i.checkpoint ?? null;
			typeof o == "string" && o.trim() && (e.model = o), n(["model", "checkpoint"], i.checkpoint);
			let s = i.clip?.name ?? i.clip ?? null;
			typeof s == "string" && s.trim() && (e.clip = s), n("clip", i.clip);
			let c = i.vae?.name ?? i.vae ?? null;
			typeof c == "string" && c.trim() && (e.vae = c), n("vae", i.vae);
			let l = i.models;
			l && typeof l == "object" && (e.models = l);
			let u = Array.isArray(i.model_groups) ? i.model_groups : null;
			u && u.length && (e.model_groups = u);
			let d = Array.isArray(i.loras) ? i.loras : null;
			d && (e.loras = d), d?.some((e) => e?.confidence === "override" || e?.source === "majoor_geninfo") && t.add("loras");
			let f = i.sampler?.name ?? i.sampler ?? null;
			typeof f == "string" && f.trim() && (e.sampler = f), n("sampler", i.sampler);
			let p = i.scheduler?.name ?? i.scheduler ?? null;
			typeof p == "string" && p.trim() && (e.scheduler = p), n("scheduler", i.scheduler);
			let m = i.steps?.value ?? i.steps ?? null;
			m != null && (e.steps = m), n("steps", i.steps);
			let h = i.cfg?.value ?? i.cfg ?? null;
			h != null && (e.cfg = h), n(["cfg", "cfg_scale"], i.cfg);
			let g = i.cfg_high_noise?.value ?? i.cfg_high_noise ?? null;
			g != null && (e.cfg_high_noise = g);
			let _ = i.cfg_low_noise?.value ?? i.cfg_low_noise ?? null;
			_ != null && (e.cfg_low_noise = _);
			let v = i.seed?.value ?? i.seed ?? null;
			v != null && (e.seed = v), n("seed", i.seed);
			let y = i.voice?.name ?? i.voice?.value ?? i.voice ?? null;
			y != null && String(y).trim() && (e.voice = String(y).trim());
			let b = i.language?.value ?? i.language ?? null;
			b != null && String(b).trim() && (e.language = String(b).trim());
			let x = i.temperature?.value ?? i.temperature ?? null;
			x != null && (e.temperature = x);
			let S = i.top_k?.value ?? i.top_k ?? null;
			S != null && (e.top_k = S);
			let C = i.top_p?.value ?? i.top_p ?? null;
			C != null && (e.top_p = C);
			let w = i.repetition_penalty?.value ?? i.repetition_penalty ?? null;
			w != null && (e.repetition_penalty = w);
			let T = i.max_new_tokens?.value ?? i.max_new_tokens ?? null;
			T != null && (e.max_new_tokens = T);
			let E = i.device?.value ?? i.device ?? null;
			E != null && String(E).trim() && (e.device = String(E).trim());
			let D = i.voice_preset?.value ?? i.voice_preset ?? null;
			D != null && String(D).trim() && (e.voice_preset = String(D).trim());
			let O = i.instruct?.value ?? i.instruct ?? null;
			O != null && String(O).trim() && (e.instruct = String(O).trim());
			let k = i.dtype?.value ?? i.dtype ?? null;
			k != null && String(k).trim() && (e.dtype = String(k).trim());
			let A = i.attn_implementation?.value ?? i.attn_implementation ?? null;
			A != null && String(A).trim() && (e.attn_implementation = String(A).trim());
			let j = i.x_vector_only_mode?.value ?? i.x_vector_only_mode ?? null;
			j != null && (e.x_vector_only_mode = j);
			let M = i.use_torch_compile?.value ?? i.use_torch_compile ?? null;
			M != null && (e.use_torch_compile = M);
			let N = i.use_cuda_graphs?.value ?? i.use_cuda_graphs ?? null;
			N != null && (e.use_cuda_graphs = N);
			let P = i.compile_mode?.value ?? i.compile_mode ?? null;
			P != null && String(P).trim() && (e.compile_mode = String(P).trim());
			let F = i.enable_chunking?.value ?? i.enable_chunking ?? null;
			F != null && (e.enable_chunking = F);
			let I = i.max_chars_per_chunk?.value ?? i.max_chars_per_chunk ?? null;
			I != null && (e.max_chars_per_chunk = I);
			let L = i.chunk_combination_method?.value ?? i.chunk_combination_method ?? null;
			L != null && String(L).trim() && (e.chunk_combination_method = String(L).trim());
			let R = i.silence_between_chunks_ms?.value ?? i.silence_between_chunks_ms ?? null;
			R != null && (e.silence_between_chunks_ms = R);
			let z = i.enable_audio_cache?.value ?? i.enable_audio_cache ?? null;
			z != null && (e.enable_audio_cache = z);
			let B = i.batch_size?.value ?? i.batch_size ?? null;
			B != null && (e.batch_size = B);
			let V = i.denoise?.value ?? i.denoise ?? null;
			V != null && (e.denoise = V), n(["denoise", "denoising"], i.denoise);
			let H = i.clip_skip?.value ?? i.clip_skip ?? i.clipSkip ?? null;
			H != null && (e.clip_skip = H);
			let U = i.inputs;
			Array.isArray(U) && (e.inputs = U);
			let W = i.lyrics?.value ?? i.lyrics ?? null;
			typeof W == "string" && W.trim() && (e.lyrics = W);
			let G = i.lyrics_strength?.value ?? i.lyrics_strength ?? null;
			G != null && (e.lyrics_strength = G);
			let K = i.notes?.value ?? i.workflow_notes?.value ?? i.notes ?? i.workflow_notes ?? null;
			typeof K == "string" && K.trim() && (e.workflow_notes = K.trim()), n(["workflow_notes", "notes"], i.notes ?? i.workflow_notes), Array.isArray(i.custom_info) && (e.custom_info = i.custom_info), Array.isArray(i.custom_info) && i.engine?.mode === "override" && t.add("custom_info"), Array.isArray(i.all_positive_prompts) && i.all_positive_prompts.length > 1 && (e.all_positive_prompts = i.all_positive_prompts), Array.isArray(i.all_negative_prompts) && i.all_negative_prompts.length > 1 && (e.all_negative_prompts = i.all_negative_prompts), Array.isArray(i.all_samplers) && i.all_samplers.length > 1 && (e.all_samplers = i.all_samplers), Array.isArray(i.chained_passes) && i.chained_passes.length > 1 && (e.chained_passes = i.chained_passes), Array.isArray(i.all_checkpoints) && i.all_checkpoints.length > 1 && (e.all_checkpoints = i.all_checkpoints);
			let q = i.size || null;
			if (q && typeof q == "object" && (q.width !== void 0 && (e.width = q.width), q.height !== void 0 && (e.height = q.height)), i.engine && typeof i.engine == "object" && (e.engine = i.engine, (i.engine.mode === "override" || i.engine.parser_version === "geninfo-override-v1" || i.engine.source === "majoor_geninfo") && (e.is_override = !0)), t.size && (e.override_fields = Array.from(t)), Object.keys(e).length) return e;
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
