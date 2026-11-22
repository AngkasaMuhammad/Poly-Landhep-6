"use strict"


import {
	lihat as lih,
	tsvToObj,
	frameval,
} from './helper.js'








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
export const wasmstrarr = wasmstrtsv//wasmani.strarr()
export const anivecstriparr = wasmani.anivecstriparr
export const animatstriparr = wasmani.animatstriparr
export const animattargetarr = wasmani.animattargetarr
export const mem0 = wasmani.mem0
const anienco = wasmani.anienco
export const enconame = timearr=>wasmstrarr[anienco(timearr)]











//===================
//		ani string
//-------------------
// 1. load file
//sampe sini, coba ganti dari anistr.tsv ke func wasm
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
export const anivecdict = anivecinfo







//===================
//		ani matrix
//-------------------
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
export const animatdict = lih(animatinfo)






//gts -> get time stamp
const fgts = stamp=>stamp[0]
export const updani = env_t=>{
	const ms = env_t*1000
	
	/*
	//anistr
	for(const k in anistrtar){
		const group = anistrtar[k]
		const i = frameval(group.data,ms,fgts,)
		group.out = group.data[i][1]
	}
	*/
	
	
}