"use strict"

import {
	mat4 as m4,
	//vec4 as v4,
	vec3 as v3,
} from 'https://wgpu-matrix.org/dist/3.x/wgpu-matrix.module.js';


import {
	lihat as lih,
	tsvToObj,
	frameval,
	_camsetup0,
	getAvgAxisSize
} from './helper.js'


import{
	stripmap,
}from './audio.js'







//===================
//		WASM wabt
//-------------------
let wasmstrtsv = await fetch(document.querySelector('#wasmstr').href)
wasmstrtsv = await wasmstrtsv.text()
wasmstrtsv = tsvToObj(wasmstrtsv,null,false,) //newline separated value
wasmstrtsv.forEach(([str])=>str)
let wasmani = async ()=>{
	const wabt = await WabtModule();
	const watText = await (await fetch(document.querySelector('#wasmani').href)).text();
	const strconst = {
		builtins: ["js-string"], // Enable JavaScript string builtins
		importedStringConstants: "myStrings", // Enable imported global string constants
	}
	const mod = wabt.parseWat('ini wasmani', watText, {
		multi_value: true,
		multi_memory: true,
	});
	const importobj = {
		wasmstr:Object.fromEntries( wasmstrtsv.map((str,i,)=>[
			str,
			new WebAssembly.Global({ value: 'i32', mutable: false }, i,),
		]))
	}
	const { buffer } = mod.toBinary({});
	const { instance } = await WebAssembly.instantiate(buffer,importobj,strconst,);
	mod.destroy();
	return instance.exports;
}
wasmani = await wasmani()
const wasmstrarr = wasmstrtsv//wasmani.strarr()
const anivecstriparr = wasmani.anivecstriparr
const animatstriparr = wasmani.animatstriparr
const animattargetarr = wasmani.animattargetarr
const mem0 = wasmani.mem0
const anienco = wasmani.anienco
export const enconame = timearr=>wasmstrarr[anienco(timearr)]











//===================
//		ani string
//-------------------
// 1. load file

/*
let anistr = await fetch(document.querySelector('#anistr').href)
anistr = await anistr.text()
anistr = tsvToObj(anistr)
// 2. target as group
let anistrtar = {}//targets
for(const {
	value,
	time,
	target,
} of anistr){
	if(!(target in anistrtar)){
		anistrtar[target] = {
			data:[],
			out:null,
		}
	}
	anistrtar[target].data.push([+time,value,])
}
// 3. sort times
for(const k in anistrtar){
	anistrtar[k].data.sort((aa,bb,)=>aa[0]-bb[0])
}
//
export const getstrval = group=>anistrtar[group].out
*/







//===================
//		ani vector
//-------------------
// 1. load file
let anivecdata = await fetch(document.querySelector('#anivecdata').href)
anivecdata = await anivecdata.arrayBuffer()
let anivecinfo = await fetch(document.querySelector('#anivecinfo').href)
anivecinfo = await anivecinfo.json()
// 2. ubah ke typed array
for(const k0 in anivecinfo){
	const slot = anivecinfo[k0]
	for(const k1 in slot){
		const offset0 = slot[k1][0]
		const len = slot[k1][1]
		slot[k1] = []
		for(let offset1 = offset0; offset1 < offset0+len; offset1 += 16){ //16 = (1+3)*4
			slot[k1].push({
				frame:(new Int32Array(anivecdata,offset1,1,))[0],
				vec:new Float32Array(anivecdata,offset1+4,3,),
			})
		}
	}
}
const anivecdict = anivecinfo


const fveckft = kf=>kf.frame
export const updvertex = (
	timearr,
	meshinfo,
	dv,
	vbuf,ivstart,varrbuf,
)=>{
	const stripcount = anivecstriparr(...timearr)
	
	for(let i = 0;i < stripcount;i++){
		let [
			show,
			slot,
			bone,
			time,
			mesh,
			index,
			attr,
		] = new Int32Array(mem0.buffer,i*7*4,7,)
		if(!show){continue}
		slot = wasmstrarr[slot]
		bone = wasmstrarr[bone]
		mesh = wasmstrarr[mesh]
		attr = wasmstrarr[attr]
		const arr = anivecdict[slot][bone]
		const i1 = frameval(arr,time,fveckft,)
		const src = arr[i1].vec
		const target = meshinfo[mesh].varr[index][attr]
		target.set(src)
	}
	
	//dv.queue.writeBuffer(vbuf,0,varrbuf,) //ASLI
	dv.queue.writeBuffer(vbuf,ivstart,varrbuf,ivstart,)
}






//===================
//		ani matrix
//-------------------
const matide = m4.identity()

// 1. load file
let animatdata = await fetch(document.querySelector('#animatdata').href)
animatdata = await animatdata.arrayBuffer()
let animatinfo = await fetch(document.querySelector('#animatinfo').href)
animatinfo = await animatinfo.json()
// 2. ubah ke typed array
for(const k0 in animatinfo){
	const slot = animatinfo[k0]
	for(const k1 in slot){
		const offset0 = slot[k1][0]
		const len = slot[k1][1]
		slot[k1] = []
		for(let offset1 = offset0; offset1 < offset0+len; offset1 += 68){ // = (1+16)*4
			slot[k1].push({
				frame:(new Int32Array(animatdata,offset1+0,1,))[0],
				mat:new Float32Array(animatdata,offset1+4,16,),
			})
		}
	}
}
const animatdict = lih(animatinfo)




const micbone = m4.create()
const fmatkft = kf=>kf.frame

export const updmatrix = (
	timearr,
	stost,
	armdict,
	meshinfo,
	cammic,
)=>{
	
	//strip
	const striparr = []
	const stripcount = animatstriparr(...timearr)
	for(let i = 0;i < stripcount;i++){
		let [
			show,
			slot,
			time,
		] = new Int32Array(mem0.buffer,i*3*4,3,)
		const fcurvedict = {} //hasil hitung
		if(show){
			slot = wasmstrarr[slot]
			const animat = animatdict[slot]
			for(const k in animat){
				const arr = animat[k]
				const i1 = frameval(arr,time,fmatkft,)
				fcurvedict[k] = arr[i1].mat
			}
		}
		striparr.push(fcurvedict)
	}
	
	//target
	//local*ani*local*ani*local*ani*.....*inv
	const targetcount = animattargetarr(...timearr)
	let targetmap = new Map()
	
	//store target map
	for(let i = 0;i < targetcount;i++){
		let [
			show,
			strip,
			mesh,
			index,
		] = new Int32Array(mem0.buffer,i*4*4,4,)
		
		if(!show){continue}
		mesh = wasmstrarr[mesh]
		
		const stobonedict = stost[mesh][index]
		const restarm = armdict[meshinfo[mesh].arm]
		
		
		//target set
		targetmap.set(stobonedict,restarm,)
	}
	
	//reset jadi inpar_mat
	for(let [stobonedict,restarm,] of targetmap){
		for(const {name:k} of restarm.bonearr){
			const bone = stobonedict[k] //target
			const {
				par,
				inpar_mat,
				inv_inarm_mat,
			} = restarm.bonedict[k]
			m4.copy(inpar_mat,bone,)
		}
	}
	
	//bone
	//local*ani
	for(let i = 0;i < targetcount;i++){
		let [
			show,
			strip,
			mesh,
			index,
		] = new Int32Array(mem0.buffer,i*4*4,4,)
		
		if(!show){continue}
		mesh = wasmstrarr[mesh]
		
		const stobonedict = stost[mesh][index]
		const restarm = armdict[meshinfo[mesh].arm]
		
		const fcurvedict = striparr[strip]
		for(const {name:k} of restarm.bonearr){
			if(!(k in fcurvedict)){continue}
			const fcurve = fcurvedict[k]
			const bone = stobonedict[k] //target
			const {
				par,
				inpar_mat,
				inv_inarm_mat,
			} = restarm.bonedict[k]
			
			//anipar*inpar_mat*fcurve
			m4.mul(inpar_mat,fcurve,bone,)
		}
	}
	
	//hitung parent
	//.....*local*ani*local*ani*local*ani
	for(let [stobonedict,restarm,] of targetmap){
		
		//anipar*inpar_mat*fcurve
		//const fcurvedict = striparr[strip]
		for(const {name:k} of restarm.bonearr){
			//if(!(k in fcurvedict)){continue}
			const bone = stobonedict[k] //target
			const {
				par,
				inpar_mat,
				inv_inarm_mat,
			} = restarm.bonedict[k]
		
			const anipar = par ?stobonedict[par.name] :matide //parent loc_ani
			m4.mul(anipar,bone,bone,)
			//store ani ke storage, trus storage dipakai lagi untuk hitung parent
			
			//camera
			;(
				_camsetup0.mode.constructor  === Object
				&& _camsetup0.mode.src === bone
			) && m4.copy(
				_camsetup0.mode.src, //aku set dari ui.js berupa stost[mesh][instance][bone]
				_camsetup0.mode.dst, //matrix global di dalam ui.js
			)
			
			//audio
			if(stripmap.has(bone)){
				const striparr = stripmap.get(bone)
				m4.mul(cammic,bone,micbone,)
				const dist = v3.len(m4.getTranslation(micbone))
				for(const {gain,volume,radius,} of striparr){
					const distrad = +radius*getAvgAxisSize(micbone)
					const d_per_r = dist/distrad//dist per radius
					const distvol = 1/(1+d_per_r*d_per_r)
					gain.gain.value = +volume*distvol
				}
			}
		}
	}
	
	//hitung inverter
	//mat * inverter
	for(let [stobonedict,restarm,] of targetmap){
		for(const {name:k} of restarm.bonearr){
			const bone = stobonedict[k] //target
			const {
				par,
				inpar_mat,
				inv_inarm_mat,
			} = restarm.bonedict[k]
			m4.mul(bone,inv_inarm_mat,bone,)
		}
	}
}
/* ASLI
export const updmatrix = (
	timearr,
	stost,
	armdict,
	meshinfo,
	cammic,
)=>{
	
	//strip
	const striparr = []
	const stripcount = animatstriparr(...timearr)
	for(let i = 0;i < stripcount;i++){
		let [
			show,
			slot,
			time,
		] = new Int32Array(mem0.buffer,i*3*4,3,)
		const fcurvedict = {} //hasil hitung
		if(show){
			slot = wasmstrarr[slot]
			const animat = animatdict[slot]
			for(const k in animat){
				const arr = animat[k]
				const i1 = frameval(arr,time,fmatkft,)
				fcurvedict[k] = arr[i1].mat
			}
		}
		striparr.push(fcurvedict)
	}
	
	//lih(striparr)
	//throw striparr
	//target
	const targetcount = animattargetarr(...timearr)
	for(let i = 0;i < targetcount;i++){
		let [
			show,
			strip,
			mesh,
			index,
		] = new Int32Array(mem0.buffer,i*4*4,4,)
		
		if(!show){continue}
		mesh = wasmstrarr[mesh]
		
		//local*ani*local*ani*local*ani*.....*inv
		const stobonedict = stost[mesh][index]
		const restarm = armdict[meshinfo[mesh].arm]
		for(const {name:k} of restarm.bonearr){
			const fcurvedict = striparr[strip]
			if(!(k in fcurvedict)){continue}
			const fcurve = fcurvedict[k]
			const bone = stobonedict[k] //target
			const {
				par,
				inpar_mat,
				inv_inarm_mat,
			} = restarm.bonedict[k]
			const anipar = par ?stobonedict[par.name] :matide //parent loc_ani
			
			//anipar*inpar_mat*fcurve
			m4.mul(inpar_mat,fcurve,bone,)
			m4.mul(anipar,bone,bone,)
			//store ani ke storage, trus storage dipakai lagi untuk hitung parent
			;(
				_camsetup0.mode.constructor  === Object
				&& _camsetup0.mode.src === bone
			) && m4.copy(
				_camsetup0.mode.src, //aku set dari ui.js berupa stost[mesh][instance][bone]
				_camsetup0.mode.dst, //matrix global di dalam ui.js
			)
			//audio
			if(stripmap.has(bone)){
				const striparr = stripmap.get(bone)
				m4.mul(cammic,bone,micbone,)
				const dist = v3.len(m4.getTranslation(micbone))
				for(const {gain,volume,radius,} of striparr){
					const distrad = +radius*getAvgAxisSize(micbone)
					const d_per_r = dist/distrad//dist per radius
					const distvol = 1/(1+d_per_r*d_per_r)
					gain.gain.value = +volume*distvol
				}
			}
		}
		
		//mat * inverter
		for(const {name:k} of restarm.bonearr){
			const bone = stobonedict[k] //target
			const {
				par,
				inpar_mat,
				inv_inarm_mat,
			} = restarm.bonedict[k]
			m4.mul(bone,inv_inarm_mat,bone,)
		}
	}
}
*/






/*
//gts -> get time stamp
const fgts = stamp=>stamp[0]
export const updani = env_t=>{
	const ms = env_t*1000
	
	
	//anistr
	for(const k in anistrtar){
		const group = anistrtar[k]
		const i = frameval(group.data,ms,fgts,)
		group.out = group.data[i][1]
	}
	
	
	
}
*/