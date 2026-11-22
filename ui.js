'use strict'
/*
import {
	render,
	audio,
	dt,
	fstep,
	loaded,
} from './coba0.js'

import {
	lih,
	showfetch,
} from './coba0func.js'

import {
	_camsetup0,
} from './coba0class.js'

import {
	set_cam_ani,
} from './coba0art.js'
*/
//pake resize3dcanvas  https://github.com/AngkasaMuhammad/Dua_Rantai/blob/main/_html/coba0func.js


import {
	mat4 as m4,
	//vec4 as v4,
	vec3 as v3,
} from 'https://wgpu-matrix.org/dist/3.x/wgpu-matrix.module.js';

import {
	lihat as lih,
	showfetch,
	_camsetup0,
}from './helper.js'

import {
	getGlobalTime,
	getGlobalSpeed,
	seek,
	setGlobalSpeed,
	resume,
	pause as pause1,
} from './audio.js'

import {
	set_cx3d,
	draw,
	resizetexarr,
	//uniset,
	stost,
	persp,
	cammat,
	cammic,
}from './render.js'
/*
import {
	updani,
}from './ani.js'
*/

lih('ui0')

_camsetup0.init()
//const persp = m4.identity()
/*
m4.perspectiveReverseZ(
	.9, //fov (rad)
	1,//aspect ratio
	.01, //zNear
	Number.MAX_SAFE_INTEGER, //zFar
persp,)
const cammat = m4.identity()
const cammic = m4.identity()
*/
let cam = _camsetup0.activecam = new _camsetup0(cammat,cammic,)





//mousetext
let moutex	= document.querySelector('#moutex'	)
let fmoutex = e=>{
	let x = Math.min(e.clientX+11,innerWidth-moutex.clientWidth,)
	let y = Math.min(e.clientY+11,innerHeight-moutex.clientHeight,)
	moutex.style.left = x+'px'
	moutex.style.top = y+'px'
	let shows = e.target.closest('[mousedescr]')?.getAttribute('mousedescr') ?? ''
	moutex.textContent = JSON.parse(`"${shows}"`)
}
addEventListener('pointermove',fmoutex,)
addEventListener('pointerdown',fmoutex,)



//canvas
let canv3d = document.querySelector('#canv3d')
set_cx3d(canv3d)
const canvarea = 700000*6 //sekitar 1000*700
const fresize = ()=>{
	const sw = canv3d.clientWidth
	const sh = canv3d.clientHeight
	const aspect = sw / sh
	let w = canv3d.width = Math.round(Math.sqrt(canvarea * aspect))
	let h = canv3d.height = Math.round(Math.sqrt(canvarea / aspect))
	resizetexarr(w,h,)
	m4.perspectiveReverseZ(
		.9, //fov (rad)
		w/h,//aspect ratio
		.01, //zNear
		Number.MAX_SAFE_INTEGER, //zFar
	persp,)
}
addEventListener('resize',fresize, )



//menu
let menu	= document.querySelector('#menu'	)
let fmenu = e=>{
	e.target.closest('svg')?.classList.toggle('active')
}
menu.addEventListener('pointerdown',fmenu,)





//content
let content_hold = false
let fcontent = e=>{
switch(e.type){
	
	
	
	case 'click':
	if(
		e.detail%2 == 0 && //bisa spam doubleclick
		e.target === e.currentTarget 
	){
		cam.fcamreset()
	}
	break
	
	case 'pointerdown':
		if(
			e.target === e.currentTarget &&
			document.querySelector('#p_camera .active')
		){
			content_hold = true
		}
	break
	
	case 'pointermove':
	if(document.pointerLockElement === e.currentTarget){
		_camsetup0.pointermoving = true
		//console.log('cam move')
	}else if(content_hold && !isPointerLockPending){
		isPointerLockPending = true;
		try{e.currentTarget.requestPointerLock({unadjustedMovement:true})}catch(error){}
	}
	break
	
	case 'pointerup':
		document.exitPointerLock()
		content_hold = false
		_camsetup0.pointermoving = false
	break
	
	
	
}
}

//p_timeline
let fps_name = [
	'kosonggg',
	'Max',
	'High',
	'Medium',
	'Low',
	'Lower',
	'Min',
]
let fplay = e=>{
	//audio.envauplay()
	//console.log('playyy')
	resume()
}
let fpause = e=>{
	//audio.envaupause()
	//console.log('pauseee')
	pause1()
}
let ss = 4 //skip steps
let ffps = e=>{
	if(6 <= ss++){
		ss = 1
	}
	//fstep(ss)
	fpsmd()
}
let fpsmd = ()=>fps.attributes.mousedescr.value = 'Select FPS: '+fps_name[ss]
//fstep(ss)
let time_hold = false
let ftime = e=>{
//sampe sini, pointermove triggereed bikin click ga triggered https://chat.deepseek.com/share/n537mgy0g2pp5zga2r
switch(e.type){
	
	
	
	case 'click':
	if(e.detail%2 == 0){//bisa spam doubleclick
		//audio.envausetTime(0)
		//console.log('time reset')
		seek(0,)
		
	}
	break
	
	case 'pointerdown':
		time_hold = true
	break
	
	case 'pointermove':
	if(document.pointerLockElement === e.currentTarget){
		/*
		let envt = audio.envaugetTime()
		envt += e.movementX/44*audio.envaugetSpeed()
		audio.envausetTime(envt)
		*/
		
		let envt = getGlobalTime()
		envt += e.movementX/44*getGlobalSpeed()
		seek(envt,)
		
		//console.log('time move')
	}else if(time_hold && !isPointerLockPending){
		isPointerLockPending = true;
		try{e.currentTarget.requestPointerLock({unadjustedMovement:true})}catch(error){}
	}
	break
	
	case 'pointerup':
		document.exitPointerLock()
		time_hold = false
	break
	
	
	
}
}
let speed_hold = false
let fspeed = e=>{
switch(e.type){
	
	
	
	case 'click':
	if(e.detail%2 == 0){
		//audio.envausetSpeed(1)
		//console.log('speed reset')
		setGlobalSpeed(1,)
	}
	break
	
	case 'pointerdown':
		speed_hold = true
	break
	
	case 'pointermove':
	if(document.pointerLockElement === e.currentTarget){
		/*
		let envs = audio.envaugetSpeed()
		let fac = 1.08
		envs = Math.log(envs)/Math.log(fac)
			envs += +e.movementX/44
		envs = fac**envs
		audio.envausetSpeed(envs)
		*/
		let envs = getGlobalSpeed()
		let fac = 1.08
		envs = Math.log(envs)/Math.log(fac)
			envs += +e.movementX/44
		envs = fac**envs
		setGlobalSpeed(envs,)
		
		//console.log('speed move')
	}else if(speed_hold && !isPointerLockPending){
		isPointerLockPending = true;
		try{e.currentTarget.requestPointerLock({unadjustedMovement:true})}catch(error){}
	}
	break
	
	case 'pointerup':
		document.exitPointerLock()
		speed_hold = false
	break
	
	
	
}
}

//p_camera
let fp_camera = ({
	type,
	target,
	currentTarget,
	detail,
})=>{
	if(type === 'pointerdown'){
		let ac = currentTarget.querySelector('.active')
		let svg = target.closest('svg')
		if(svg){
			ac?.classList.remove('active')
			svg?.classList.add('active')
		}
		let mode = currentTarget.querySelector('.active')?.id
		_camsetup0.mode = (mode === 'anicam')?cam_bone:mode
		
		//sampe ini, camera ikut bone
	}
	fcontent({
		type,
		target:currentTarget,
		currentTarget,
		detail,
	})
}

//p_timestamp
let fstamp = e=>{
	let chiarr = e.currentTarget.parentElement.children
	fstamp_fps({currentTarget:chiarr[1]})
	fstamp_time({currentTarget:chiarr[2]})
	fstamp_speed({currentTarget:chiarr[3]})
	fstamp_camera({currentTarget:chiarr[4]})
}
let fstamp_fps = e=>{
	//console.log('fstamp_fps')
	let fpsv = +e.currentTarget.attributes.fps.value //fps value
	if(fpsv === NaN){return console.warn('value error: '+fpsv)}
	ss = fpsv
	//fstep(ss)
	fpsmd()
}
let fstamp_time = e=>{
		//console.log('fstamp_time')
	let t = +e.currentTarget.textContent
	if(t === NaN){return console.warn('value error: '+t)}
	//audio.envausetTime(t)	
	seek(t)
}
let fstamp_speed = e=>{
		//console.log('fstamp_speed')
	let s = +e.currentTarget.textContent
	if(
		s === NaN ||
		s <= 0 
	){return console.warn('value error: '+s)}
	//audio.envausetSpeed(s)
	setGlobalSpeed(s)
}
let cam_bone = {
	src:null,
	dst:m4.create(), //value ini didapat dari bone yang belum * inverter
}
let fstamp_camera = e=>{
		//console.log('fstamp_camera')
	let cur = e.currentTarget
	let mesh = cur.attributes.mesh.value
	let instance = cur.attributes.instance.value
	let bone = cur.attributes.bone.value
	//set_cam_ani(mesh,instance,bone,)
	
	p_camera.querySelector('.active')?.classList.remove('active')
	p_camera.querySelector('#anicam')?.classList.add('active')
	cam_bone.src = stost[mesh][instance][bone]
	_camsetup0.mode = cam_bone//p_camera.querySelector('.active')?.id
}
/*
//dipindah ke .html
//p_log 
let p_log = document.querySelector('#p_log')
showfetch(p_log)
*/




//
let play = document.querySelector('#play')	;play.addEventListener('pointerdown',fplay,)
let pause = document.querySelector('#pause')	;pause.addEventListener('pointerdown',fpause,)
let fps = document.querySelector('#fps')	;fps.addEventListener('pointerdown',ffps,)
let time = document.querySelector('#time')	;time.addEventListener('pointerdown',ftime,)	;time.addEventListener('pointermove',ftime,)	;time.addEventListener('pointerup',ftime,)	;time.addEventListener('click',ftime,)
let speed = document.querySelector('#speed')	;speed.addEventListener('pointerdown',fspeed,)	;speed.addEventListener('pointermove',fspeed,)	;speed.addEventListener('pointerup',fspeed,)	;speed.addEventListener('click',fspeed,)

let content = document.querySelector('#content')	;content.addEventListener('pointerdown',fcontent,)	;content.addEventListener('pointermove',fcontent,)	;content.addEventListener('pointerup',fcontent,)	;content.addEventListener('click',fcontent,)

let p_camera = document.querySelector('#p_camera')	;p_camera.addEventListener('pointerdown',fp_camera,)	;p_camera.addEventListener('pointermove',fp_camera,)	;p_camera.addEventListener('pointerup',fp_camera,)	;p_camera.addEventListener('click',fp_camera,)
let timestamp = document.querySelector('#p_timestamp tbody')


for(let {children:[
	tdname,
	tdfps,
	tdtime,
	tdspeed,
	tdcamera,
]} of timestamp.children){
	
	tdfps.textContent = fps_name[+tdfps.attributes.fps.value]
	
	tdname	.addEventListener('pointerdown',fstamp	,)
	tdfps	.addEventListener('pointerdown',fstamp_fps	,)
	tdtime	.addEventListener('pointerdown',fstamp_time	,)
	tdspeed	.addEventListener('pointerdown',fstamp_speed	,)
	tdcamera	.addEventListener('pointerdown',fstamp_camera	,)
}


//
let isPointerLockPending = false;
let fpoilock = e=>{
    isPointerLockPending = false;
	content_hold = false
	_camsetup0.pointermoving = false
	time_hold = false
	speed_hold = false
    // Handle lock change
}
document.addEventListener('pointerlockchange', fpoilock,)
document.addEventListener('pointerlockerror', fpoilock,)



//
setInterval(()=>{
	//p_timeline
	fps.firstChild.textContent = Math.round(1000/dt)
	time.textContent = (Math.floor(getGlobalTime()*1000)/1000).toFixed(3)
	speed.textContent = getGlobalSpeed().toFixed(3)
},111,)


let step = 0
let dt = 0
let env_dt = 0
let t0 = 0
let env_t0 = 0
let ani = async t=>{
	if(ss <= ++step){
		step = 0
	}
	if(step){
		requestAnimationFrame(ani)
		return
	}
	let env_t = getGlobalTime()*1000 //*1000 jadi miliseconds
	dt = -t0+t
	t0 = t
	env_dt = -env_t0+env_t
	env_t0 = env_t
	
	//
	//updani(env_t)
	
	//uniform
	//cam.fcam(persp)
	//uniset('cam',cammat,)
	
	
	await draw(
		t,
		dt,
		env_t,
		env_dt,
	)
	requestAnimationFrame(ani)
}
requestAnimationFrame(ani)


//click timestamp pertama
fstamp({currentTarget:document.querySelector('#p_timestamp tbody td:first-child')})
document.querySelector('#m_log').classList.remove('active')
document.querySelector('#m_timeline').classList.add('active')
m_timeline.classList.add('active')

fresize()
