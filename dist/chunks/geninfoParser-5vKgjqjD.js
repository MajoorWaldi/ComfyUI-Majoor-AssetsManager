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
	let t = {}, n = [], o = r(e), l = [];
	for (let r of u(e)) {
		if (!r || typeof r != "object") continue;
		let e = m(r);
		if (!e || typeof e != "object") continue;
		let u = String(r?.class_type || r?.type || "").toLowerCase(), d = String(r?.title || r?._meta?.title || "").toLowerCase(), f = (e, n) => {
			if (t[e] || typeof n != "string") return;
			let r = n.trim();
			r && (/^[\d\s.,+-]+$/.test(r) || (t[e] = r));
		};
		if ((u.includes("cliptextencode") || u.includes("clip_text_encode") || d.includes("clip text encode")) && typeof e.text == "string") {
			let t = d.includes("negative");
			d.includes("positive") || d.includes("(prompt)") || d.includes("prompt"), f(t ? "negative_prompt" : "prompt", e.text);
		}
		if (f("negative_prompt", e.negative_prompt), f("negative_prompt", e.negative), !t.prompt && typeof e.text == "string") {
			let t = e.text.trim();
			(u.includes("prompt") || u.includes("encode") || u.includes("positive") || u.includes("negative") || d.includes("prompt") || d.includes("positive") || d.includes("negative")) && t.length >= 12 && /[a-zA-Z]/.test(t) && f("prompt", t);
		}
		if (e.seed !== void 0 && t.seed === void 0 && (t.seed = e.seed), e.steps !== void 0 && t.steps === void 0 && (t.steps = e.steps), e.cfg !== void 0 && t.cfg === void 0 && (t.cfg = e.cfg), e.sampler_name && !t.sampler && (t.sampler = e.sampler_name), e.scheduler && !t.scheduler && (t.scheduler = e.scheduler), e.denoise !== void 0 && t.denoise === void 0 && (t.denoise = e.denoise), i(u)) {
			let t = a(r, o), n = s(r, o), i = c(r?.inputs?.model, o);
			l.push({
				sampler_name: e.sampler_name || n.sampler_name || e.sampler,
				scheduler: e.scheduler || n.scheduler,
				steps: e.steps ?? n.steps,
				cfg: e.cfg,
				denoise: e.denoise ?? n.denoise,
				seed: e.seed ?? e.noise_seed,
				model: i,
				pass_stage: t
			});
		}
		e.width !== void 0 && t.width === void 0 && (t.width = e.width), e.height !== void 0 && t.height === void 0 && (t.height = e.height);
		let p = (e, n) => {
			if (t[e] || typeof n != "string") return;
			let r = n.trim();
			r && (t[e] = r);
		}, h = [
			e.ckpt_name,
			e.checkpoint,
			e.checkpoint_name,
			e.model_name,
			e.model
		];
		for (let e of h) t.model || p("model", e);
		if (p("vae", e.vae_name || e.vae), p("clip", e.clip_name || e.clip), p("unet", e.unet_name || e.unet), p("diffusion", e.diffusion_name || e.diffusion_model || e.diffusion), u.includes("lora") || u.includes("loraloader")) {
			let t = e.lora_name || e.lora || e.name || null, r = e.strength_model ?? e.strength ?? e.weight ?? e.lora_strength ?? null;
			t && n.push({
				name: t,
				weight: r
			});
		}
	}
	return n.length && (t.loras = n), l.length > 1 && (t.all_samplers = l), Object.keys(t).length > 0 ? t : null;
}
function r(e) {
	if (!e || typeof e != "object") return null;
	let n = e.prompt && typeof e.prompt == "object" ? e.prompt : e;
	return t(n) ? n : null;
}
function i(e) {
	return e.includes("ksamplerselect") || e.includes("samplerselect") ? !1 : e.includes("ksampler") || e.includes("samplercustom") || e.includes("sampler_custom");
}
function a(e, t) {
	if (!t) return "";
	let n = c(e?.inputs?.model, t).toLowerCase();
	if (/\b(upscale|upscaler|_to_\d{3,5}|to[_-]?\d{3,5})\b/i.test(n)) return "upscale";
	let r = o(e, t).join(" ");
	if (/\b(pidconditioning|upscale|latentupscale|imageupscalewithmodel)\b/i.test(r)) return "upscale";
	let i = o(e, t, "latent_image").join(" ");
	return /\b(inpaint|vaeencodeforinpaint|setlatentnoise mask|masktoimage)\b/i.test(i) ? "inpaint" : /\b(upscale|latentupscale|imageupscalewithmodel|ultimate|supir|esrgan|realesrgan)\b/i.test(i) ? "upscale" : /\b(vaeencode|loadimage|imagebatch|imagetolatent)\b/i.test(i) ? "img2img" : /\b(emptylatentimage|emptysd3latentimage|emptychromaradiancelatentimage|empty latent)\b/i.test(i) ? "txt2img" : "";
}
function o(e, t, n) {
	let r = n ? [e?.inputs?.[n]] : Object.values(e?.inputs || {}), i = [], a = /* @__PURE__ */ new Set(), o = (e) => {
		let n = String(e?._mjrPromptId || e?.id || "");
		if (n && a.has(n)) return;
		n && a.add(n);
		let r = String(e?.class_type || e?.type || e?._meta?.title || "");
		r && i.push(r.toLowerCase());
		let s = e?.inputs && typeof e.inputs == "object" ? e.inputs : {};
		for (let e of Object.values(s)) {
			let n = l(e, t);
			n && o(n);
		}
	};
	for (let e of r) {
		let n = l(e, t);
		n && o(n);
	}
	return i;
}
function s(e, t) {
	let n = {};
	if (!t) return n;
	let r = l(e?.inputs?.sampler, t)?.inputs || {};
	r.sampler_name && (n.sampler_name = r.sampler_name);
	let i = l(e?.inputs?.sigmas, t)?.inputs || {};
	return i.scheduler && (n.scheduler = i.scheduler), i.steps !== void 0 && (n.steps = i.steps), i.denoise !== void 0 && (n.denoise = i.denoise), n;
}
function c(e, t) {
	if (!t) return "";
	let n = /* @__PURE__ */ new Set(), r = (e) => {
		let i = l(e, t);
		if (!i) return "";
		let a = String(i?._mjrPromptId || i?.id || "");
		if (a && n.has(a)) return "";
		a && n.add(a);
		let o = i?.inputs || {}, s = o.unet_name || o.ckpt_name || o.model_name || o.model || o.checkpoint || o.checkpoint_name || "";
		if (typeof s == "string" && s.trim()) return s.trim();
		for (let e of Object.values(o)) {
			let t = r(e);
			if (t) return t;
		}
		return "";
	};
	return r(e);
}
function l(e, t) {
	if (!Array.isArray(e) || e.length < 1) return null;
	let n = String(e[0]), r = t[n];
	if (!r || typeof r != "object") return null;
	if (!r._mjrPromptId) try {
		Object.defineProperty(r, "_mjrPromptId", {
			value: n,
			enumerable: !1
		});
	} catch {}
	return r;
}
function u(e, n = /* @__PURE__ */ new WeakSet()) {
	if (!e || typeof e != "object" || n.has(e)) return [];
	n.add(e);
	let r = [], i = (e.prompt && typeof e.prompt == "object" ? e.prompt : null) || (t(e) ? e : null);
	i && r.push(...Object.values(i));
	for (let t of d(e)) {
		let e = Array.isArray(t?.nodes) ? t.nodes.filter(Boolean) : [];
		r.push(...e);
		for (let t of e) for (let e of p(t)) r.push(...u(e, n));
		for (let e of f(t)) r.push(...u(e, n));
	}
	return r;
}
function d(e) {
	if (!e || typeof e != "object") return [];
	let t = [], n = (e) => {
		e && typeof e == "object" && Array.isArray(e.nodes) && t.push(e);
	};
	n(e);
	for (let t of [
		"workflow",
		"Workflow",
		"template",
		"Template",
		"subgraph",
		"Subgraph",
		"graph",
		"lgraph"
	]) n(e?.[t]);
	return t;
}
function f(e) {
	return [
		...Array.isArray(e?.definitions?.subgraphs) ? e.definitions.subgraphs : [],
		...Array.isArray(e?.subgraphs) ? e.subgraphs : [],
		...Array.isArray(e?.rootGraph?.subgraphs) ? e.rootGraph.subgraphs : []
	].filter((e) => e && typeof e == "object" && Array.isArray(e.nodes));
}
function p(e) {
	return [
		e?.subgraph,
		e?._subgraph,
		e?.subgraph?.graph,
		e?.subgraph?.lgraph,
		e?.properties?.subgraph,
		e?.subgraph_instance,
		e?.subgraph_instance?.graph,
		e?.inner_graph,
		e?.subgraph_graph
	].filter((e) => e && typeof e == "object" && Array.isArray(e.nodes));
}
function m(e) {
	let t = e?.inputs;
	if (t && typeof t == "object" && !Array.isArray(t)) return t;
	let n = e?.widgets_values, r = {};
	if (n && typeof n == "object" && !Array.isArray(n)) {
		for (let [e, t] of Object.entries(n)) r[e] = t;
		return r;
	}
	if (!Array.isArray(t) || !Array.isArray(n)) return null;
	let i = t.filter(h);
	for (let e = 0; e < n.length; e += 1) {
		let a = i[e] || t[e] || null, o = String(a?.label || a?.localized_name || a?.name || a?.widget?.name || a?.widget?.label || "").trim();
		r[o || `param_${e + 1}`] = n[e];
	}
	return r;
}
function h(e) {
	if (!e || typeof e != "object") return !1;
	if (e.widget === !0 || e.widget && typeof e.widget == "object" || typeof e.widget == "string" && e.widget.trim()) return !0;
	if (e.link != null) return !1;
	let t = String(e.type || "").trim().toUpperCase();
	return [
		"INT",
		"FLOAT",
		"STRING",
		"BOOLEAN",
		"BOOL",
		"COMBO",
		"ENUM"
	].includes(t);
}
//#endregion
//#region ui/components/sidebar/parsers/geninfoParser.ts
var g = /^(?:[a-z]:[\\/]|[\\/]{1,2}|\.{1,2}[\\/]|~[\\/]).+?[\\/][^\\/\n]+\.(?:png|jpe?g|webp|gif|bmp|tiff?|avif|heic|heif|apng|hdr|svg|mp4|webm|mov|mkv|avi|m4v|mp3|wav|flac|ogg|glb|gltf|obj|fbx|ply|stl|ckpt|safetensors|pt|pth|bin|gguf|json|ya?ml)$/i, _ = /^(?!.*[,;])(?!.*\b(?:cinematic|portrait|landscape|lighting|style|detailed|masterpiece|photo|render)\b).*(?:[\\/][^\\/\n]+){2,}\.(?:png|jpe?g|webp|gif|bmp|tiff?|avif|heic|heif|apng|hdr|svg|mp4|webm|mov|mkv|avi|m4v|mp3|wav|flac|ogg|glb|gltf|obj|fbx|ply|stl|ckpt|safetensors|pt|pth|bin|gguf|json|ya?ml)$/i;
function v(r) {
	if (!r) return null;
	if (typeof r == "object") {
		let i = r.geninfo || r.GenInfo || r.generation || null;
		if (i && typeof i == "object") {
			let e = {}, t = /* @__PURE__ */ new Set(), n = (e, n) => {
				if (!(!n || typeof n != "object") && !(n.confidence !== "override" && n.source !== "majoor_geninfo")) for (let n of Array.isArray(e) ? e : [e]) t.add(n);
			}, a = i.positive?.value ?? i.positive?.text ?? null, o = i.negative?.value ?? i.negative?.text ?? null;
			typeof a == "string" && a.trim() && (e.prompt = a), typeof o == "string" && o.trim() && (e.negative_prompt = o), n("prompt", i.positive), n("negative_prompt", i.negative);
			let s = i.checkpoint?.name ?? i.checkpoint ?? null;
			typeof s == "string" && s.trim() && (e.model = s), n(["model", "checkpoint"], i.checkpoint);
			let c = i.clip?.name ?? i.clip ?? null;
			typeof c == "string" && c.trim() && (e.clip = c), n("clip", i.clip);
			let l = i.vae?.name ?? i.vae ?? null;
			typeof l == "string" && l.trim() && (e.vae = l), n("vae", i.vae);
			let u = i.models;
			u && typeof u == "object" && (e.models = u);
			let d = Array.isArray(i.model_groups) ? i.model_groups : null;
			d && d.length && (e.model_groups = d);
			let f = Array.isArray(i.loras) ? i.loras : null;
			f && (e.loras = f), f?.some((e) => e?.confidence === "override" || e?.source === "majoor_geninfo") && t.add("loras");
			let p = i.sampler?.name ?? i.sampler ?? null;
			typeof p == "string" && p.trim() && (e.sampler = p), n("sampler", i.sampler);
			let m = i.scheduler?.name ?? i.scheduler ?? null;
			typeof m == "string" && m.trim() && (e.scheduler = m), n("scheduler", i.scheduler);
			let h = i.steps?.value ?? i.steps ?? null;
			h != null && (e.steps = h), n("steps", i.steps);
			let g = i.cfg?.value ?? i.cfg ?? null;
			g != null && (e.cfg = g), n(["cfg", "cfg_scale"], i.cfg);
			let _ = i.cfg_high_noise?.value ?? i.cfg_high_noise ?? null;
			_ != null && (e.cfg_high_noise = _);
			let v = i.cfg_low_noise?.value ?? i.cfg_low_noise ?? null;
			v != null && (e.cfg_low_noise = v);
			let b = i.seed?.value ?? i.seed ?? null;
			b != null && (e.seed = b), n("seed", i.seed);
			let x = i.voice?.name ?? i.voice?.value ?? i.voice ?? null;
			x != null && String(x).trim() && (e.voice = String(x).trim());
			let S = i.language?.value ?? i.language ?? null;
			S != null && String(S).trim() && (e.language = String(S).trim());
			let C = i.temperature?.value ?? i.temperature ?? null;
			C != null && (e.temperature = C);
			let w = i.top_k?.value ?? i.top_k ?? null;
			w != null && (e.top_k = w);
			let T = i.top_p?.value ?? i.top_p ?? null;
			T != null && (e.top_p = T);
			let E = i.repetition_penalty?.value ?? i.repetition_penalty ?? null;
			E != null && (e.repetition_penalty = E);
			let D = i.max_new_tokens?.value ?? i.max_new_tokens ?? null;
			D != null && (e.max_new_tokens = D);
			let O = i.device?.value ?? i.device ?? null;
			O != null && String(O).trim() && (e.device = String(O).trim());
			let k = i.voice_preset?.value ?? i.voice_preset ?? null;
			k != null && String(k).trim() && (e.voice_preset = String(k).trim());
			let A = i.instruct?.value ?? i.instruct ?? null;
			A != null && String(A).trim() && (e.instruct = String(A).trim());
			let j = i.dtype?.value ?? i.dtype ?? null;
			j != null && String(j).trim() && (e.dtype = String(j).trim());
			let M = i.attn_implementation?.value ?? i.attn_implementation ?? null;
			M != null && String(M).trim() && (e.attn_implementation = String(M).trim());
			let N = i.x_vector_only_mode?.value ?? i.x_vector_only_mode ?? null;
			N != null && (e.x_vector_only_mode = N);
			let P = i.use_torch_compile?.value ?? i.use_torch_compile ?? null;
			P != null && (e.use_torch_compile = P);
			let F = i.use_cuda_graphs?.value ?? i.use_cuda_graphs ?? null;
			F != null && (e.use_cuda_graphs = F);
			let I = i.compile_mode?.value ?? i.compile_mode ?? null;
			I != null && String(I).trim() && (e.compile_mode = String(I).trim());
			let L = i.enable_chunking?.value ?? i.enable_chunking ?? null;
			L != null && (e.enable_chunking = L);
			let R = i.max_chars_per_chunk?.value ?? i.max_chars_per_chunk ?? null;
			R != null && (e.max_chars_per_chunk = R);
			let z = i.chunk_combination_method?.value ?? i.chunk_combination_method ?? null;
			z != null && String(z).trim() && (e.chunk_combination_method = String(z).trim());
			let B = i.silence_between_chunks_ms?.value ?? i.silence_between_chunks_ms ?? null;
			B != null && (e.silence_between_chunks_ms = B);
			let V = i.enable_audio_cache?.value ?? i.enable_audio_cache ?? null;
			V != null && (e.enable_audio_cache = V);
			let H = i.batch_size?.value ?? i.batch_size ?? null;
			H != null && (e.batch_size = H);
			let U = i.denoise?.value ?? i.denoise ?? null;
			U != null && (e.denoise = U), n(["denoise", "denoising"], i.denoise);
			let W = i.clip_skip?.value ?? i.clip_skip ?? i.clipSkip ?? null;
			W != null && (e.clip_skip = W);
			let G = i.inputs;
			Array.isArray(G) && (e.inputs = G);
			let K = i.lyrics?.value ?? i.lyrics ?? null;
			typeof K == "string" && K.trim() && (e.lyrics = K);
			let q = i.lyrics_strength?.value ?? i.lyrics_strength ?? null;
			q != null && (e.lyrics_strength = q);
			let J = i.notes?.value ?? i.workflow_notes?.value ?? i.notes ?? i.workflow_notes ?? null;
			typeof J == "string" && J.trim() && (e.workflow_notes = J.trim()), n(["workflow_notes", "notes"], i.notes ?? i.workflow_notes), Array.isArray(i.custom_info) && (e.custom_info = i.custom_info), Array.isArray(i.custom_info) && i.engine?.mode === "override" && t.add("custom_info"), Array.isArray(i.all_positive_prompts) && i.all_positive_prompts.length > 1 && (e.all_positive_prompts = i.all_positive_prompts), Array.isArray(i.all_negative_prompts) && i.all_negative_prompts.length > 1 && (e.all_negative_prompts = i.all_negative_prompts), Array.isArray(i.all_samplers) && i.all_samplers.length > 1 && (e.all_samplers = i.all_samplers), Array.isArray(i.chained_passes) && i.chained_passes.length > 1 && (e.chained_passes = i.chained_passes), Array.isArray(i.all_checkpoints) && i.all_checkpoints.length > 1 && (e.all_checkpoints = i.all_checkpoints);
			let Y = i.size || null;
			if (Y && typeof Y == "object" && (Y.width !== void 0 && (e.width = Y.width), Y.height !== void 0 && (e.height = Y.height)), i.engine && typeof i.engine == "object" && (e.engine = i.engine, (i.engine.mode === "override" || i.engine.parser_version === "geninfo-override-v1" || i.engine.source === "majoor_geninfo") && (e.is_override = !0)), t.size && (e.override_fields = Array.from(t)), y(e, r), Object.keys(e).length) return e;
		}
		let a = n(r);
		if (a) return a;
		if (t(r)) {
			let e = n({ prompt: r });
			if (e) return e;
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
			return v(JSON.parse(t));
		} catch {
			return null;
		}
		return { prompt: t };
	}
	return null;
}
function y(e, t) {
	let r = t?.workflow || t?.Workflow || t?.comfy_workflow || t?.comfy || t?.comfyui || t?.ComfyUI || null;
	if (!r || typeof r != "object") return;
	let i = n(r), a = Array.isArray(i?.all_samplers) ? i.all_samplers : [];
	if (a.length) {
		for (let t of ["all_samplers", "chained_passes"]) {
			let n = Array.isArray(e[t]) ? e[t] : [];
			n.length && (e[t] = n.map((e, t) => {
				let n = a[t]?.pass_stage;
				return !n || e?.pass_stage ? e : {
					...e,
					pass_stage: n
				};
			}));
		}
		!Array.isArray(e.all_samplers) && a.length > 1 && (e.all_samplers = a);
	}
}
function b(e) {
	let t = typeof e == "string" ? e.trim() : "";
	return !t || t.includes("\n") ? !1 : g.test(t) || _.test(t);
}
function x(e) {
	let t = typeof e == "string" ? e.trim() : "";
	return t ? b(t) ? "" : t : "";
}
function S(e, t) {
	let n = x(e), r = x(t);
	if (n) {
		let e = /(?:^|\n)\s*Negative prompt:\s*/i;
		if (e.test(n)) {
			let t = n.split(e), i = (t[0] || "").trim(), a = t.slice(1).join("Negative prompt:").trim(), o = a.search(/\n\s*Steps:\s*\d+/i), s = (o >= 0 ? a.slice(0, o) : a).trim();
			i && (n = x(i)), !r && s && (r = x(s));
		}
	}
	return n && r && n.trim() === r.trim() && (r = ""), {
		positive: n,
		negative: r
	};
}
function C(e) {
	if (!e) return "";
	let t = String(e).trim().replace(/\\/g, "/");
	return (t.split("/").pop() || t).replace(/\.(safetensors|ckpt|pt|pth|bin|gguf|json)$/i, "");
}
function w(e) {
	if (!e) return "";
	if (typeof e == "string") return C(e);
	let t = C(e.name || e.lora_name || "");
	if (!t) return "";
	let n = e.weight ?? e.strength ?? null, r = e.strength_model ?? null, i = e.strength_clip ?? null;
	if (r !== null || i !== null) {
		let e = [];
		return r != null && e.push(`m=${r}`), i != null && e.push(`c=${i}`), e.length ? `${t} (${e.join(", ")})` : t;
	}
	return n == null ? t : `${t} (${n})`;
}
function T(e) {
	let t = String(e || "").trim().toLowerCase();
	return t ? t === "img2vid" ? "Image-to-Video" : t === "txt2vid" ? "Text-to-Video" : t === "img2img" ? "Image-to-Image" : t === "txt2img" ? "Text-to-Image" : t === "vid2vid" ? "Video-to-Video" : t === "tts" ? "Text-to-Speech" : t === "audio" ? "Audio" : t.split(/[_\s-]+/).filter(Boolean).map((e) => e.charAt(0).toUpperCase() + e.slice(1)).join(" ") : "";
}
function E(e) {
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
function D(e) {
	let t = e?.engine && typeof e.engine == "object" ? e.engine : null, n = String(t?.type || "").trim(), r = String(t?.sampler_mode || "").trim().toLowerCase(), i = T(n) || n, a = E(t?.api_provider), o = r === "api" ? `API ${i || "Workflow"}` : i;
	return {
		workflowType: n,
		workflowLabel: String(o || n).trim(),
		workflowBadge: a
	};
}
//#endregion
export { S as a, v as i, w as n, x as o, C as r, D as t };
