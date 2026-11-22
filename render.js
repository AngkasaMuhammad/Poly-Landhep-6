"use strict"


import {
	mat4 as m4,
	//vec4 as v4,
	vec3 as v3,
} from 'https://wgpu-matrix.org/dist/3.x/wgpu-matrix.module.js';

import {
	tsvToObj,
	lihat as lih,
	padTo4,
	frameval,
	_camsetup0,
	getAvgAxisSize,
}from './helper.js'

import{
	//getstrval,
	enconame,
	anivecstriparr,
	animatstriparr,
	animattargetarr,
	anivecdict,
	animatdict,
	wasmstrarr,
	mem0,
	updani,
}from './ani.js'


import{
	stripmap,
}from './audio.js'


import{
	WgslReflect,
}from 'https://cdn.jsdelivr.net/npm/wgsl_reflect@1.5.0/wgsl_reflect.module.js' //'../WGSL to meshattr/wgsl_reflect.module.js'




lih('render0')




export const persp = m4.identity()
export const cammat = m4.identity()
export const cammic = m4.identity()
const matide = m4.identity()
const matempty = m4.create()

const texusage = 
	GPUTextureUsage.RENDER_ATTACHMENT
	|GPUTextureUsage.TEXTURE_BINDING
	|GPUTextureUsage.COPY_SRC
	|GPUTextureUsage.COPY_DST


let dv = await navigator.gpu.requestAdapter()
dv = await dv.requestDevice({
	requiredFeatures: ['indirect-first-instance'],
})
let canv3d = null
let cx3d = null
let ftcount = +document.querySelector('#ftcount').dataset.value

const pcf = navigator.gpu.getPreferredCanvasFormat()
export const set_cx3d = canv3d1=>{
	canv3d = canv3d1
	cx3d = canv3d.getContext('webgpu')
	cx3d.configure({
		device:dv,
		format:pcf,
		usage:texusage,
	})
}






let wgsl = await fetch(document.querySelector('#wgslmodule').href)
wgsl = await wgsl.text()
const refl = new WgslReflect(wgsl)
const _mod = dv.createShaderModule({
	label:'ini mod',
	code:wgsl,
})







//uniform
const type4_w2js = { //type conversion, wgsl to js
	'vec4f':Float32Array,
	'vec4i':Int32Array,
	'vec4u':Uint32Array,
	'mat4x4f':Float32Array,
}
const type1_w2js = { //type conversion, wgsl to js
	'f32':Float32Array,
	'i32':Int32Array,
	'u32':Uint32Array,
}
const unimap = new Map()
let uniarrbuf = 0 //size -> arrbuf
for(const unistmem0 of refl.uniforms[0].type.members){
	uniarrbuf = unistmem0.offset+unistmem0.size
	let type = type4_w2js[unistmem0.type.name]
	if(type){
		unimap.set(unistmem0.name,{
			offset:unistmem0.offset,
			size:unistmem0.size,
			type,
		},)
	}else{
		const unistmem1arr = unistmem0.type.members
		if(unistmem1arr.length != 4){
			throw `wgsl struct '${unistmem0.name}' must have 4 members`
		}
		for(const unistmem1 of unistmem1arr){
			let type = type1_w2js[unistmem1.type.name]
			if(unimap.has(unistmem1.name)){
				throw `wgsl uniform struct members name must be unique. '${unistmem1.name}'`
			}
			unimap.set(unistmem1.name,{
				offset:unistmem0.offset+unistmem1.offset,
				size:unistmem1.size,
				type,
			},)
		}
	}
}
let unibuf = dv.createBuffer({
	label:'ini uni buffer',
	size:uniarrbuf,
	usage:
		GPUBufferUsage.UNIFORM
		| GPUBufferUsage.COPY_SRC
		| GPUBufferUsage.COPY_DST
	,
})
uniarrbuf = new ArrayBuffer(uniarrbuf)
for(const [name,info,] of unimap){
	unimap.set(name,new info.type(uniarrbuf,info.offset,info.size/4,),)
}

//set uniform values
export const uniset = (name,valarr,)=>unimap.get(name)?.set(valarr)








//meshinfo
let meshinfo = await fetch(document.querySelector('#meshinfo').href)
meshinfo = await meshinfo.text()
meshinfo = tsvToObj(meshinfo,'name',)
//objinfo
let objinfo = await fetch(document.querySelector('#objinfo').href)
objinfo = await objinfo.text()
objinfo = tsvToObj(objinfo,'name',)











//vertex
let varrbuf = await fetch(document.querySelector('#vertbuf').href)
varrbuf = await varrbuf.arrayBuffer()
let vbuf = dv.createBuffer({
	label:'ini vertex buffer',
	size:varrbuf.byteLength,
	usage:
		GPUBufferUsage.VERTEX
		| GPUBufferUsage.COPY_SRC
		| GPUBufferUsage.COPY_DST
	,
})
dv.queue.writeBuffer(vbuf,0,varrbuf,)


//vec keyframe time
let ivstart = document.querySelector('#ivstart').dataset.value
ivstart = +meshinfo[ivstart].voff
const fveckft = kf=>kf.frame
const updvertex = timearr=>{
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
	dv.queue.writeBuffer(vbuf,ivstart,varrbuf,ivstart,) //sampe sini, update vertex hanya yang instance
}











//index
let iarrbuf = await fetch(document.querySelector('#idxbuf').href)
iarrbuf = await iarrbuf.arrayBuffer()
iarrbuf = padTo4(iarrbuf)
let ibuf = dv.createBuffer({
	label:'ini index buffer',
	size:iarrbuf.byteLength,
	usage:
		GPUBufferUsage.INDEX
		| GPUBufferUsage.COPY_SRC
		| GPUBufferUsage.COPY_DST
	,
})
dv.queue.writeBuffer(ibuf,0,iarrbuf,)

//indirect
let idxarrbuf = await fetch(document.querySelector('#idrbuf').href)
idxarrbuf = await idxarrbuf.arrayBuffer()
let idrbuf = dv.createBuffer({
	label:'ini indirect buffer',
	size:idxarrbuf.byteLength,
	usage:
		GPUBufferUsage.INDIRECT
		| GPUBufferUsage.COPY_SRC
		| GPUBufferUsage.COPY_DST
	,
})
dv.queue.writeBuffer(idrbuf,0,idxarrbuf,)







//armature
let armdata = await fetch(document.querySelector('#armdata').href)
armdata = await armdata.arrayBuffer()
let arminfo = await fetch(document.querySelector('#arminfo').href)
arminfo = await arminfo.text()
arminfo = tsvToObj(arminfo)
const armdict = {}

let arm = null
let inbuf_boneofs = 0 //byte
for(const {type,name,} of arminfo){
	if(type == 'arm'){
		arm = armdict[name] = {
			bonedict:{},
			bonearr:[],
		}
	}else if(type == 'bone'){
		const bone = {}
		bone.inbuf_ofs = inbuf_boneofs
		inbuf_boneofs += 33
		arm.bonearr.push(bone)
		arm.bonedict[name] = bone
	}
}
for(const k in armdict){
	const {bonedict,bonearr,} = armdict[k]
	for(const k1 in bonedict){
		const bone = bonedict[k1]
		const i = bonearr.indexOf(bone)
		const offset = bone.inbuf_ofs
		let par = new Uint32Array(armdata,(offset+0)*4,1,)[0]
		par = (par == 255)?null:bonearr[par]
		bone.name = k1
		bone.par = par
		bone.inpar_mat = new Float32Array(armdata,(offset+1)*4,16,)
		bone.inv_inarm_mat = new Float32Array(armdata,(offset+17)*4,16,)
	}
}
lih(armdict)










let meshattr = await fetch(document.querySelector('#meshattr').href)
meshattr = await meshattr.json()

const format_tyarr = { //format to typed array
	float32:[Float32Array,1,],
	float32x2:[Float32Array,2,],
	float32x3:[Float32Array,3,],
	float32x4:[Float32Array,4,],
	sint32:[Int32Array,1,],
}

export const stost = {}
let stoarrbuf = 0 //byte
for(const k in meshinfo){
	const mi = meshinfo[k]
	
	//inst vertex struct
	const {arrayStride,attributes} = meshattr[mi.attrlay]
	mi.varr = []
	for(let i = 0;i < +mi.vcount;i++ ){
		const attrdict = {}
		for(const attr1 of attributes){
			const [type,len,] = format_tyarr[attr1.format]
			attrdict[attr1._name] = new type(varrbuf,
				+attr1.offset
				+i*arrayStride
				+ +mi.voff
			,len,)
		}
		mi.varr.push(attrdict)
	}
	
	//storage struct
	const meshstoarr = stost[k] = []
	const bonearr = armdict[mi.arm].bonearr
	uniset(`mesharm_${k}_size`,[bonearr.length],) //jumlah bone
	uniset(`mesharm_${k}_offset`,[stoarrbuf/64],) //per bone
	for(let i0 = 0;i0 < +mi.max_arm;i0++){
		const armsto = {}
		for(const {name} of bonearr){
			armsto[name] = stoarrbuf
			stoarrbuf += 64 //1 matrix
		}
		meshstoarr.push(armsto)
	}
}
//storage
const stobuf = dv.createBuffer({
	label:'ini sto buffer',
	size:stoarrbuf,
	usage:
		GPUBufferUsage.STORAGE
		| GPUBufferUsage.COPY_SRC
		| GPUBufferUsage.COPY_DST
	,
})
stoarrbuf = new ArrayBuffer(stoarrbuf)
for(const k0 in stost){
	const stomesh = stost[k0]
	for(const arminst of stomesh){
		for(const k2 in arminst){
			const mat = arminst[k2] = new Float32Array(stoarrbuf,arminst[k2],16,)
			m4.identity(mat)
		}
	}
}
lih(stost)


//mat keyframe time
const micbone = m4.create()
const fmatkft = fveckft
const updmatrix = timearr=>{
	
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









const newflextex = (desc,entry,)=>{
	let o = {desc,entry,}
	flextexarr.push(o)
	return o
}
export const resizetexarr = (w,h,)=>{
	flexcoltexdesc.size =
	deptexdesc.size = [w,h,]
	for(const flextex of flextexarr){
		const desc = flextex.desc
		desc.label = 'flex tex '+Date()
		flextex.tex?.destroy?.()
		flextex.tex = dv.createTexture(desc)
		
		if(flextex.entry){
			flextex.entry.resource = flextex.tex
		}
	}
	
	//bindgroup
	_bg1 = dv.createBindGroup({
		label:'ini bind grouppp flextex',
		layout:_bgl1,
		entries:_bg1_entries,
	})
	
	//bundle
	for(const k in bunddict){
		const desc = bunddict[k]
		let bund = dv.createRenderBundleEncoder({
			colorFormats:[pcf,],
			depthStencilFormat:'depth24plus',
		})
		for(const comm of desc.commands){
			bund.setBindGroup(0,_bg0,)
			bund.setBindGroup(1,_bg1,)
			switch(comm[0]){
				case 'sp':
					bund.setPipeline(pipedict[comm[1]])
				break
				case 'svb':
					bund.setVertexBuffer(comm[1],vbuf,+meshinfo[comm[2]].voff,)
				break
				case 'sib':
					bund.setIndexBuffer(ibuf,'uint16',+meshinfo[comm[1]].ioff,)
				break
				case 'dii':
					bund.drawIndexedIndirect(idrbuf,+objinfo[comm[1]].voff,)
				break
				case 'di':
					bund.drawIndexed(
						comm[1],
						comm[2],
						comm[3],
						comm[4],
						comm[5],
					)
				break
			}
		}
		bunddict[k].finish = bund.finish({label:desc.label})
	}
	
	//rp
	for(const k in rpdict){
		const desc = rpdict[k]
		desc.depthStencilAttachment.view = depflextex.tex
		desc.bundle = bunddict[desc._bundle].finish
	}
}

//
const flexcoltexdesc = {
	format:pcf,
	usage:texusage,
	entry:null, //entry masuk bg1
}
const deptexdesc = {
	label:'this is depth texture',
	format:'depth24plus',
	usage:GPUTextureUsage.RENDER_ATTACHMENT,
}
const flextexarr = []
let depflextex = newflextex(deptexdesc,null,)
let _bgl1_entries = []
let _bg1_entries = []
for(let a = 0;a < ftcount;a++){
	_bgl1_entries.push({binding:a,visibility: GPUShaderStage.FRAGMENT,texture:{},})
	const entry = {
		binding:a,
		resource:null,
	}
	entry.flextex = newflextex(flexcoltexdesc,entry,)
	_bg1_entries.push(entry)
}






//image
const bindtexdict_url0 = document.querySelector('#image').href
let bindtexdict = await fetch(bindtexdict_url0)
bindtexdict = await bindtexdict.text()
bindtexdict = tsvToObj(bindtexdict,'binding',)
for(const k in bindtexdict){
	const info = bindtexdict[k]
	let url = new URL(info.src,bindtexdict_url0,)
	let img = await fetch(url)
	img = await img.blob()
	img = await createImageBitmap(img, {
		colorSpaceConversion: 'none', // avoid sRGB→linear surprises
		premultiplyAlpha: 'none',
		imageOrientation: 'flipY',    // match WebGPU's top-left origin
	});
	const size = [img.width,img.height,]
	let tex = dv.createTexture({
		label:'ini texture '+url,
		size,
		format:pcf,
		usage:texusage
	})
	dv.queue.copyExternalImageToTexture(
		{source:img,flipY: false},
		{texture:tex},
		size,
	)
	bindtexdict[k] = tex
}












const _bgl0 = dv.createBindGroupLayout({
	label:'iniii BindGroupLayout buffer,sampler,image',
	entries:[
		{
			binding:0,
			visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
			buffer:{type:'uniform'},
		},
		{
			binding:1,
			visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
			buffer:{type:'read-only-storage'},
		},
		{
			binding:2,
			visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
			sampler:{},
		},
	].concat(Object.entries(bindtexdict).map(([k,v,])=>({
		binding:+k,
		visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
		texture:{},
	}))),
})



const _bgl1 = dv.createBindGroupLayout({
	label:'iniii BindGroupLayout texture',
	entries:_bgl1_entries,
})







let _bg0 = dv.createBindGroup({
	label:'ini bind grouppp',
	layout:_bgl0,
	entries:[
		{binding:0,resource:{buffer:unibuf},},
		{binding:1,resource:{buffer:stobuf},},
		{binding:2,resource:dv.createSampler(),},
	].concat(Object.entries(bindtexdict).map(([k,v,])=>(
		{binding:k,resource:v,}
	))),
})
let _bg1 = null







let pipedict = await fetch(document.querySelector('#pipeline').href)
pipedict = await pipedict.json()

const _pl = dv.createPipelineLayout({
	label:'ini pl',
	bindGroupLayouts:[_bgl0,_bgl1,],
})
for(let k in pipedict){
	let pipe = pipedict[k]
	pipe.layout = _pl
	pipe.vertex.module = _mod
	pipe.fragment.module = _mod
	for(const buf of pipe.vertex.buffers){
		const mattr = meshattr[buf.attributes]
		buf.attributes = mattr.attributes
		buf.arrayStride = mattr.arrayStride
	}
	
	for(let target of pipe.fragment.targets){
		target.format = pcf
	}
	pipedict[k] = dv.createRenderPipeline(pipe)
}









let bunddict = await fetch(document.querySelector('#bundle').href)
bunddict = await bunddict.json()









let rpdict = await fetch(document.querySelector('#renderpass').href)
rpdict = await rpdict.text()
rpdict = tsvToObj(rpdict,'name',)

for(const k in rpdict){
	const rp = rpdict[k]
	
	
	rpdict[k] = {
		"label":rp.label,
		"colorAttachments": [
			{
				"clearValue": rp.clearValue.split(' ').map(v=>+v),
				"loadOp": rp.loadOp,
				"storeOp": rp.storeOp,
				//view
			}
		],
		"depthStencilAttachment":{
			"depthClearValue":+rp.depthClearValue,
			"depthLoadOp":rp.depthLoadOp,
			"depthStoreOp":rp.depthStoreOp
		},
		
		
		_bundle:rp.bundle,
	}
}









let encodict = await fetch(document.querySelector('#encoder').href)
encodict = await encodict.json()
for(const k in encodict){
	const enco = encodict[k]
	for(const comm of enco){
		switch(comm[0]){
			case 'brp':
				comm[1] = rpdict[comm[1]]
			break
		}
	}
}









export const draw = async (
		t,
		dt,
		env_t,
		env_dt,
	)=>{
	
	const timearr = [t,dt,env_t,env_dt,]
	
	//vertex
	updvertex(timearr)
	//matrix
	updmatrix(timearr)
	updani(env_t)
	_camsetup0.activecam.fcam(persp)
	uniset('cam',cammat,)
	
	//uniform
	//uni_set_time(timearr)
	uniset('time',timearr,)
	dv.queue.writeBuffer(unibuf,0,uniarrbuf,)
	dv.queue.writeBuffer(stobuf,0,stoarrbuf,)
	
	
	//1 enco punya banyak rp
	//1 rp punya banyak bund
	//1 bund punya banyak draw
	//enco -> rp -> bund -> draw
	
	const enco = dv.createCommandEncoder({ label: 'ini enco' })
	//for(const comm of encodict[getstrval('encoder')]){
	for(const comm of encodict[enconame(timearr)]){
		let ctex = cx3d.getCurrentTexture()
		switch(comm[0]){
			case 'brp':
				comm[1].colorAttachments[0].view = ctex
				const pass = enco.beginRenderPass(comm[1])
					pass.executeBundles([comm[1].bundle])
				pass.end()
			break
			case 'ct':
				enco.copyTextureToTexture(
					{texture:ctex},
					{texture:_bg1_entries[comm[1]].resource},
					[ctex.width,ctex.height,],
				)
			break
		}
	}
	
	
	
	dv.queue.submit([enco.finish()])
}

