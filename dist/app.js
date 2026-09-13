import { createWorld } from './world.js';
import { chapterAt, chapterOpacity } from './timeline.js';
const $=s=>document.querySelector(s);
const chapters=[...document.querySelectorAll('.chapter')];
const copies=chapters.map(el=>el.querySelector('.copy'));
const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)');
const state={progress:0};
let world;
if(!reduceMotion.matches){try{world=createWorld($('#world'));document.body.classList.add('webgl-ready');}catch(error){console.error('3D scene unavailable',error);document.body.classList.add('no-webgl');}}
$('#world').addEventListener('webglcontextlost',e=>{e.preventDefault();world=undefined;document.body.classList.remove('webgl-ready');document.body.classList.add('no-webgl');});
gsap.registerPlugin(ScrollTrigger);
gsap.to(state,{progress:1,ease:'none',scrollTrigger:{trigger:'#story',start:'top top',end:'bottom bottom',scrub:reduceMotion.matches?true:.8}});
let chapterOffsets=[];
function measure(){chapterOffsets=chapters.map(el=>el.offsetTop);}
measure();
function maxScroll(){return document.documentElement.scrollHeight-innerHeight;}
let playing=false,filmPosition=0;
function setPlaying(value){if(value&&!playing)filmPosition=window.scrollY;playing=value;$('#play').setAttribute('aria-pressed',String(value));$('#play').setAttribute('aria-label',value?'Pause film':'Play film automatically');$('#play').innerHTML=value?'Ⅱ <span>PAUSE FILM</span>':'▷ <span>WATCH FILM</span>';}
function go(index){setPlaying(false);window.scrollTo({top:chapterOffsets[index]+(index>0&&index<11?innerHeight*.15:0),behavior:reduceMotion.matches?'instant':'smooth'});}
$('#begin').onclick=()=>go(1);$('#replay').onclick=()=>go(0);
$('.wordmark').onclick=e=>{e.preventDefault();go(0);};
$('#play').onclick=()=>{if(window.scrollY>=maxScroll()-2)window.scrollTo({top:0,behavior:'instant'});setPlaying(!playing);};
['wheel','touchstart'].forEach(event=>addEventListener(event,()=>setPlaying(false),{passive:true}));
addEventListener('keydown',e=>{if(['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(e.key))setPlaying(false);});
const dialog=$('#chapters-dialog');
$('#chapters-button').onclick=()=>{setPlaying(false);dialog.showModal();};
$('#close-chapters').onclick=()=>dialog.close();
dialog.addEventListener('click',e=>{if(e.target===dialog){const b=dialog.getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)dialog.close();}});
chapters.forEach((chapter,index)=>{const a=document.createElement('a');a.href='#'+chapter.id;a.innerHTML=`<span>${String(index).padStart(2,'0')}</span>${chapter.dataset.name}`;a.onclick=e=>{e.preventDefault();dialog.close();go(index);};$('#chapter-links').append(a);});
let seeking=false;
$('#progress').addEventListener('pointerdown',()=>{seeking=true;setPlaying(false);});
addEventListener('pointerup',()=>seeking=false);
$('#progress').addEventListener('input',e=>{setPlaying(false);window.scrollTo({top:Number(e.target.value)/1000*maxScroll(),behavior:'instant'});});
$('#modak').onclick=()=>{world?.burst();$('#blessing').textContent='Wisdom is the sweetest reward.';bell(528);};
// Original synthesized score: no third-party recordings and no autoplaying audio.
let audio,master,scoreTimer,soundOn=false,beat=0;
function tone(frequency,when,length,volume,type='sine'){
 const osc=audio.createOscillator(),gain=audio.createGain();osc.type=type;osc.frequency.setValueAtTime(frequency,when);gain.gain.setValueAtTime(.0001,when);gain.gain.exponentialRampToValueAtTime(volume,when+.015);gain.gain.exponentialRampToValueAtTime(.0001,when+length);osc.connect(gain).connect(master);osc.start(when);osc.stop(when+length+.1);
}
function bell(frequency=396){if(!soundOn||!audio)return;[1,2.01,2.76,4.07].forEach((ratio,i)=>tone(frequency*ratio,audio.currentTime,4-i*.6,.07/(i+1)));}
function createAudio(){
 audio=new (window.AudioContext||window.webkitAudioContext)();master=audio.createGain();master.gain.value=0;
 const compressor=audio.createDynamicsCompressor();master.connect(compressor).connect(audio.destination);
 [65.41,98,130.81,196.2].forEach((frequency,i)=>{const osc=audio.createOscillator(),gain=audio.createGain();osc.frequency.value=frequency;gain.gain.value=.035/(i+1);osc.connect(gain).connect(master);osc.start();});
 scoreTimer=setInterval(()=>{if(!soundOn||document.hidden)return;beat++;if(lastIndex===9){tone(75,audio.currentTime,.24,.16,'triangle');if(beat%2===0)tone(155,audio.currentTime+.23,.13,.09,'triangle');}else if(beat%8===0)bell([261.63,293.66,392,523.25][Math.floor(beat/8)%4]);if(lastIndex===4||lastIndex===5)tone(42,audio.currentTime,.7,.1,'triangle');},650);
}
$('#sound').onclick=async()=>{try{if(!audio)createAudio();await audio.resume();soundOn=!soundOn;master.gain.setTargetAtTime(soundOn?.65:0,audio.currentTime,.3);$('#sound').setAttribute('aria-pressed',String(soundOn));$('#sound-label').textContent=soundOn?'SOUND ON':'SOUND OFF';document.body.classList.toggle('sound-on',soundOn);if(soundOn)bell();}catch{$('#sound-label').textContent='SOUND UNAVAILABLE';}};
document.addEventListener('visibilitychange',()=>{if(document.hidden){setPlaying(false);audio?.suspend();}else if(soundOn)audio?.resume().catch(()=>{});});
addEventListener('pagehide',()=>{clearInterval(scoreTimer);audio?.close();});
let lastIndex=-1,previousTime=0;
function updateStory(){
 const {index,local}=chapterAt(state.progress*maxScroll(),chapterOffsets,chapters.at(-1).offsetHeight);
 const opacity=chapterOpacity(index,local,reduceMotion.matches);
 if(index!==lastIndex){
  copies.forEach((copy,i)=>{const active=i===index;copy.style.visibility=active?'visible':'hidden';copy.closest('section').setAttribute('aria-hidden',String(!active));copy.closest('section').inert=!active;});
  $('#chapter-number').textContent=String(index).padStart(2,'0');$('#chapter-name').textContent=chapters[index].dataset.name.toUpperCase();$('#progress-number').textContent=`${String(index+1).padStart(2,'0')} / 12`;$('#progress').setAttribute('aria-valuetext',chapters[index].dataset.name);
  [...$('#chapter-links').children].forEach((a,i)=>{if(i===index)a.setAttribute('aria-current','step');else a.removeAttribute('aria-current');});
  if(lastIndex>=0&&soundOn)bell(index===7?528:261.63);
  lastIndex=index;
  if(!world||reduceMotion.matches)$('#art').style.backgroundImage=`url(./assets/${index===10?'visarjan':index>0&&index<7?'kailash':'ganesha'}.png)`;
 }
 copies[index].style.opacity=opacity;copies[index].style.translate=`0 ${reduceMotion.matches?0:(1-opacity)*18}px`;
 if(!seeking)$('#progress').value=Math.round(state.progress*1000);
 $('#progress').style.setProperty('--progress',state.progress*100+'%');
 return{index,local};
}
function render(time){
 const delta=Math.min((time-previousTime)/1000,.05);previousTime=time;
 if(!document.hidden){if(playing&&!dialog.open){filmPosition=Math.min(maxScroll(),filmPosition+maxScroll()/390*delta);window.scrollTo({top:filmPosition,behavior:'instant'});if(window.scrollY>=maxScroll()-1)setPlaying(false);}const{index,local}=updateStory();if(!reduceMotion.matches)world?.render(time,index,local,delta);}
 requestAnimationFrame(render);
}
requestAnimationFrame(render);
addEventListener('resize',()=>{world?.resize();measure();ScrollTrigger.refresh();});
reduceMotion.addEventListener('change',()=>{if(reduceMotion.matches){setPlaying(false);world?.suspend();document.body.classList.remove('webgl-ready');}else if(!world){try{world=createWorld($('#world'));document.body.classList.add('webgl-ready');}catch{}}else document.body.classList.add('webgl-ready');lastIndex=-1;measure();ScrollTrigger.refresh();});
document.fonts.ready.then(()=>{measure();ScrollTrigger.refresh();});
const initial=chapters.findIndex(c=>'#'+c.id===location.hash);if(initial>0)go(initial);
