"use strict"

import {
	mat4 as m4,
	//vec4 as v4,
	vec3 as v3,
} from 'https://wgpu-matrix.org/dist/3.x/wgpu-matrix.module.js';

const pi = Math.PI


const strnewline = /\r\n|\r|\n/
export const tsvToObj = (
	tsv,
	key = null,
	use_header = true,
) => {
	if(!use_header){
		return tsv
		.trim()
		.split(strnewline)
		.map(r => r
			.split('\t')
		)
	}
	
	//
	const [header, ...rows] =
		tsv.trim()
			.split(strnewline)
			.map(r => r.split('\t'));

	if (key === null) {
		// Return an array of objects
		return rows.map(row =>
			Object.fromEntries(
				header.map((col, i) => [col, row[i]])
			)
		);
	} else {
		// Return an object keyed by the given column name
		const keyIndex = header.indexOf(key);
		if (keyIndex === -1)
			throw new Error(`Key "${key}" not found in header`);

		return rows.reduce((out, row) => {
			out[row[keyIndex]] = Object.fromEntries(
				header
					.map((col, i) => [col, row[i]])
					.filter(([col]) => col !== key)
			);
			return out;
		}, {});
	}
};



export const lihat = a=>{
	console.groupCollapsed(a)
	console.trace(a)
	console.groupEnd()
	return a
}
const lih = lihat



export let showfetch = fetchinfo=>{ // DETECT FETCHES
	//console.log(fetchinfo)
	let show = (mes,color,)=>{
		//console.log(mes)
		let div = document.createElement('div')
		div.textContent = mes
		div.style.color = color
		fetchinfo.appendChild(div)
		fetchinfo.scroll(0,Number.MAX_SAFE_INTEGER,)
	}
	new PerformanceObserver((list) => {
		list.getEntries().forEach((entry) => {
			if (entry.initiatorType === "fetch") {
				show(
					'+-+- fetching.... '+entry.name,
					'#77ff77ff',
				)
			}
		});
	}).observe({ entryTypes: ["resource"] });
	addEventListener("unhandledrejection",e=>{
		lih(e)
		show(e.reason,'#ff7777ff',)
	},)
	
	showfetch = 'single use'
}



//frame value
export const frameval = (arr,t,gts,)=>{ //func gts -> get time stamp
	let size = arr.length
	let l = 0
	let m = 0
	let r = size
	for(let i = 0;i < size;i++){
		m = Math.floor((l+r)/2)
		if(l === m){break}
		;(gts(arr[m]) <= t)
		?(l = m)
		:(r = m)
	}
	return l
}






export class Deferred {
	constructor() {
		this.promise = new Promise(resolve => {
			this.run = resolve;
		});
	}

	// Make the instance awaitable: await d	=== await d.promise
	then(...args) { return this.promise.then(...args); }
	catch(...args) { return this.promise.catch(...args); }
	finally(...args) { return this.promise.finally(...args); }
}





//=========================
//
//		CAMERA SETUP 0
//
//=========================
export let _camsetup0 = class{
	static mode = null //anicam{ mesh, instance, bone,  }, rotate, move, pan,
	static pointermoving = false
	
	static instarr = []
	static activecam = null
	static init = ()=>{
		let _c = _camsetup0
		//pake e=> agar this tidak berupa window
		addEventListener('pointermove',e=>{ if(!_c.pointermoving){return} switch(_c.mode){// horizon
			case 'rotate':_c.activecam.fcamrotxy(e); break
			case 'move':_c.activecam.fcammovexy(e); break
			case 'pan':_c.activecam.fcampanxy(e); break
		}},{ passive: false },)
		addEventListener('wheel',e=>{ switch(_c.mode){// depth
			case 'rotate':_c.activecam.fcamrotde(e); break
			case 'move':_c.activecam.fcammovede(e); break
			case 'pan':_c.activecam.fcampande(e); break
		}},)
		_c.init = 'single use'
	}
	
	constructor(camout,cammic,){
		
		this.pan = m4.identity()
		this.hor = m4.identity() //horizontal
		this.camrx = -.5
		this.zoom = m4.scaling(Array(3).fill(55))
		this.camout = camout
		this.mic = cammic
		_camsetup0.instarr.push(this)
	}
	
	
	
	fcamrotxy(e){
		this.camrx -= e.movementY/99
		this.camrx = Math.min(this.camrx,pi/2,)
		this.camrx = Math.max(this.camrx,-pi/2,)
		let camry = -e.movementX/99
		m4.rotateY(this.hor,camry,this.hor,)
	}
	fcamrotde(e){
		let s = Math.pow(1.001,e.deltaY,)
		m4.scale(this.zoom,[s,s,s,],this.zoom,)
	}
	fcammovexy(e){
		let x = e.movementX/222
		let z = e.movementY/222
		
		m4.mul(this.hor,this.zoom,this.hor,)
		m4.translate(this.hor,[x,0,z,],this.hor,)
		m4.invert(this.zoom,this.zoom,)
			m4.mul(this.hor,this.zoom,this.hor,)
		m4.invert(this.zoom,this.zoom,)
	}
	fcammovede(e){
		let y = e.deltaY/999
		
		m4.mul(this.hor,this.zoom,this.hor,)
		m4.translate(this.hor,[0,y,0,],this.hor,)
		m4.invert(this.zoom,this.zoom,)
			m4.mul(this.hor,this.zoom,this.hor,)
		m4.invert(this.zoom,this.zoom,)
	}
	fcampanxy(e){
		let x = e.movementX/222
		let y = -e.movementY/222
		
		m4.translate(this.pan,[x,y,0,],this.pan,)
	}
	fcampande(e){
		let s = Math.pow(1.001,e.deltaY,)
		m4.scale(this.pan,[s,s,s,],this.pan,)
	}
	
	fcamreset(){
		let _c = _camsetup0
		
		lih('reset '+_c.mode)
		switch (_c.mode){
			case 'rotate':
				m4.translation(m4.getTranslation(this.hor),this.hor,)
				m4.scaling(Array(3).fill(55),this.zoom,)
				this.camrx = -.5
			break
			case 'move':
				let m = this.hor
				;[m[12],m[13],m[14],] = [0,0,0,]
			break
			case 'pan':
				m4.identity(this.pan)
			break
		}
	}
	
	
	fcam(persp){//pos
		let _c = _camsetup0
		
		if(_c.mode.constructor  === Object){
			//m4.identity(this.camout)
			m4.copy(_c.mode.dst,this.camout,)
			
			//sampe sini, harus _c.mode hindari inverter
			
		}else{
			m4.copy(this.hor,this.camout,)
				m4.rotateX(this.camout,this.camrx,this.camout,)
				m4.mul(this.camout,this.zoom,this.camout,)
				m4.translate(this.camout,[0,0,1,],this.camout,)
				m4.invert(this.zoom,this.zoom,)
					m4.mul(this.camout,this.zoom,this.camout,) //kembali ke scale awal
				m4.invert(this.zoom,this.zoom,)
		}
		m4.invert(this.camout,this.camout,)
		m4.copy(this.camout,this.mic,)
		
		//persp
		m4.mul(persp,this.camout,this.camout,)
		//pan
		m4.invert(this.pan,this.pan,)
			m4.mul(this.pan,this.camout,this.camout,)
		m4.invert(this.pan,this.pan,)
	}
}

// https://chat.deepseek.com/share/6g0b4oqdl6vuzm3yhy
export const padTo4 = buffer=>{ //pad arrayBuffer byteelngth
	const remainder = buffer.byteLength % 4;
	if (remainder === 0) return buffer;
	
	const padding = 4 - remainder;
	const padded = new Uint8Array(buffer.byteLength + padding);
	// Uint8Array is zero-initialized, but set explicitly for clarity
	padded.set(new Uint8Array(buffer));
	return padded.buffer;
}




export const getAvgAxisSize = m=>(
	Math.hypot(m[0],m[1],m[2])
	+Math.hypot(m[4],m[5],m[6])
	+Math.hypot(m[8],m[9],m[10])
)/3

lihat('helper0')