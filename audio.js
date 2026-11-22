"use strict"

import {
	mat4 as m4,
	vec3 as v3,
} from 'https://wgpu-matrix.org/dist/3.x/wgpu-matrix.module.js';

import {
	tsvToObj,
	lihat as lih,
}from './helper.js'

import{
	stost,
	//cammic,
} from './render.js'



lih('audio0')
// ─── module root state ──────────────────────────────────────────────────────
let globalTime = 0;
let globalSpeed = 1;
//let strips = []

let ctx = new AudioContext()
const active = new Map();	 // stripId -> { source, gain }

let paused = true;
let anchorGlobal = 0;
let anchorContext = 0;

// ─── helpers ────────────────────────────────────────────────────────────────
const now = () => ctx.currentTime;

export const getGlobalTime = () => {
	if (paused) return globalTime;
	return anchorGlobal + (ctx.currentTime - anchorContext) * globalSpeed;
};
export const getGlobalSpeed = ()=>globalSpeed



// ─── scheduling ─────────────────────────────────────────────────────────────
const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
const playStrip = (buffer, opts) => {
	let {
		id,
		volume = 1,
		buftrimstart:loopStart,
		buftrimend:loopEnd,
		bufscale:stripScale,
		start,
		end,
		gain,
	} = opts;
	
	
	
	if(loopEnd === 'src') loopEnd = buffer.duration
	const endMode =
		end === 'trimmed' ? 'trimmed' :
		end === 'endless' ? 'endless' :
		isNum(end = +end)		? 'number'	:
		null;
	
	// ---- validation ---------------------------------------------------------
	const errs = [];

	if (!(buffer instanceof AudioBuffer)) errs.push('buffer must be an AudioBuffer');
	//if (!isNum(loopStart))	errs.push('loopStart must be a finite number');
	loopStart = +loopStart
	//if (!isNum(loopEnd))		errs.push('loopEnd must be a finite number or \'src\'');
	loopEnd = +loopEnd
	//if (!isNum(stripScale)) errs.push('stripScale must be a finite number');
	stripScale = +stripScale
	//if (!isNum(start))			errs.push('start must be a finite number');
	start = +start
	if (endMode === null)	errs.push("end must be a finite number, 'trimmed', or 'endless'");
	if (endMode === 'number' && isNum(start) && end <= start)	errs.push('start must be < end (when end is a number)')
	//if (!isNum(volume))		 errs.push('volume must be a finite number');
	volume = +volume

	if (isNum(loopStart) && loopStart < 0)
		errs.push('loopStart must be >= 0');
	if (isNum(loopEnd) && isNum(loopStart) && loopEnd <= loopStart)
		errs.push('loopStart must be < loopEnd');
	if (isNum(loopEnd) && buffer instanceof AudioBuffer && loopEnd > buffer.duration)
		errs.push(`loopEnd must be <= buffer.duration (${buffer.duration})`);
	if (isNum(stripScale) && stripScale <= 0)
		errs.push('stripScale must be > 0');
	if (isNum(start) && isNum(end) && end <= start)
		errs.push('start must be < end');
	if (isNum(volume) && volume < 0)
		errs.push('volume must be >= 0');

	if (!isNum(globalTime))	errs.push('module globalTime must be a finite number');
	if (!isNum(globalSpeed)) errs.push('module globalSpeed must be a finite number');
	if (isNum(globalSpeed) && globalSpeed <= 0)
		errs.push('module globalSpeed must be > 0');

	if (errs.length) {
		throw new Error('playStrip validation failed:\n	- ' + errs.join('\n	- '));
	}
	
	const looping = endMode !== 'trimmed';   // 'trimmed' plays once, everything else loops

	// ---- implicit anchor: (globalTime, now) --------------------------------
	const t0 = now();
	const globalScale = 1/globalSpeed
	/*
	let startWhen
//glo
	startWhen = start
//glo -> seek
	startWhen -= globalTime
	startWhen *= globalScale
//seek -> cx
	startWhen += t0
//cx
	*/
	const startWhen		 = t0 + (start - globalTime) *globalScale;
	/*
	let stopWhen
//glo
	stopWhen = end
//glo -> seek
	stopWhen -= globalTime
	stopWhen *= globalScale
//seek -> cx
	stopWhen += t0
//cx
	*/
	const stopWhen = t0 + (end	 - globalTime) *globalScale;

	// ---- loop-aware offset --------------------------------------------------
	
	/*
	let offset;
	const loopLenBuffer = loopEnd - loopStart;
	const loopLenGlobal = loopLenBuffer * stripScale; //buf -> glo
	const elapsedGlobal = globalTime - start;
	if (endMode === 'trimmed') {
		// no loop; if playhead is already past start, seek straight into the buffer
		offset = elapsedGlobal <= 0
			? 0
			: Math.min(elapsedGlobal / stripScale, buffer.duration)
		lih(offset)
	} else {
		// looping: loop-aware seek
		offset = elapsedGlobal <= 0
			? loopStart
			: loopStart + (elapsedGlobal % loopLenGlobal) / stripScale;
	}
	*/
	let loopLen, loopLenGlo
//buf
	loopLen = loopEnd
	loopLen -= loopStart
	loopLenGlo = loopLen
//buf -> glo
	loopLen *= stripScale
//glo
	
	
	let offset
//glo
	offset = globalTime
	offset -= start
//glo -> buf
	offset /= stripScale
//buf
	offset %= loopLenGlo
	offset += loopStart
	offset = Math.max(offset,loopStart,)
	

	const startAt = Math.max(startWhen, t0);
	//const stopAt = Math.max(stopWhen, startAt);

	// ---- schedule -----------------------------------------------------------
	const source = ctx.createBufferSource();
	source.buffer	 = buffer;
	source.loop		 = true;
	source.loopStart = loopStart; //aktif saat loop = true
	source.loopEnd	 = loopEnd; //aktif saat loop = true
	source.playbackRate.value = 1/(globalScale*stripScale);

	//gain.gain.value = volume //volume diupdate setiap animationframe, coba kalo 0

	source.connect(gain).connect(ctx.destination);
	offset = Math.max(offset,0,)
	offset = Math.min(offset,loopEnd,)
	source.start(startAt, offset,);
	// ---- stop ---------------------------------------------------------------
	if (endMode === 'number') {
		const stopWhen = t0 + (end - globalTime) *globalScale;
		source.stop(Math.max(stopWhen, startAt));
	}
	// 'trimmed'	-> no explicit stop; source ends naturally at buffer end
	// 'endless'	-> no stop at all; lives until stopAll()

	// ---- cleanup on natural end --------------------------------------------
	source.onended = () => {
		try { source.disconnect(); } catch (_) {}
		try { gain.disconnect(); }	 catch (_) {}
		if (id != null && active.get(id)?.source === source) {
			active.delete(id);
		}
	};

	if (id != null) active.set(id, { source, gain ,});
	return { source, gain,};
};

// ─── stop all ───────────────────────────────────────────────────────────────
const stopAll = () => {
	for (const { source, gain } of active.values()) {
		try { source.onended = null; } catch (_) {}
		try { source.stop(); }				catch (_) {}
		try { source.disconnect(); }	catch (_) {}
		try { gain.disconnect(); }		catch (_) {}
	}
	active.clear();
};

// ─── pause / resume ─────────────────────────────────────────────────────────
export const pause = () => {
	if (paused) return;
	globalTime = getGlobalTime();
	paused = true;
	stopAll();
};

export const resume = () => {
	ctx.resume()
	if (!paused) return;
	paused = false;
	anchorGlobal = globalTime;
	anchorContext = ctx.currentTime;
	for (const s of strips) playStrip(s.buffer, s);
};

// ─── seek ───────────────────────────────────────────────────────────────────
export const seek = (newGlobalTime) => {
	globalTime	 = newGlobalTime;
	anchorGlobal = newGlobalTime;
	anchorContext = ctx.currentTime;

	stopAll();
	if (!paused) {
		for (const s of strips) playStrip(s.buffer, s);
	}
};

// ─── speed change ───────────────────────────────────────────────────────────
export const setGlobalSpeed = (newSpeed,) => {
	if (!(newSpeed > 0)) throw new Error('globalSpeed must be > 0');

	globalTime	 = getGlobalTime();
	anchorGlobal = globalTime;
	anchorContext = ctx.currentTime;

	globalSpeed = newSpeed;

	stopAll();
	if (!paused) {
		for (const s of strips) playStrip(s.buffer, s);
	}
};


/*
// ─── live volume change ─────────────────────────────────────────────────────
const setStripVolume = (id, v) => {
	if (!(v >= 0)) throw new Error('volume must be >= 0');
	const entry = active.get(id);
	if (entry) entry.gain.gain.value = v //setValueAtTime(v, ctx.currentTime);
};
*/





let loadfile = async (query,key,)=>{
	let url = document.querySelector(query).href
	let a = await fetch(url)
	a = await a.text()
	return {
		data:tsvToObj(a,key,),
		url,
	}
}

let newaubuf = async srcstr=>{
	let buf = await fetch(new URL(srcstr,aubufurl,))
	buf = await buf.arrayBuffer()
	buf = await ctx.decodeAudioData(buf)
	return buf
}





let {
	data:aubufdata,
	url:aubufurl,
} = await loadfile('#audiosrc','name',)
let aubuf = {}
for(let k in aubufdata){
	aubuf[k] = await newaubuf(aubufdata[k].url)
}

let {data:strips} = await loadfile('#audiostrip',)


export const stripmap = new Map() //berdasarkan sto mesh->instance->bone sebagai ref
let i = 0
for(let s of strips){
	s.buffer = aubuf[s.buffer]
	s.id = i++
	s.gain = ctx.createGain()
	const matref = stost[s.mesh][s.instance][s.bone] //hanya ref
	if(!stripmap.has(matref)){
		stripmap.set(matref,[],)
	}
	stripmap.get(matref).push(s)
}

lih(stripmap)