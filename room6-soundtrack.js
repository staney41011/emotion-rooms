(()=>{
  const params=new URLSearchParams(location.search);
  const demo=params.get('demo')==='1';
  const timeScale=demo?0.22:1;
  let ctx=null, master=null, nodes=[];

  const hz=m=>440*Math.pow(2,(m-69)/12);
  const at=s=>ctx.currentTime+0.06+s*timeScale;
  const keep=n=>{nodes.push(n);return n};

  function route(node,wet=0.16){
    const dry=keep(ctx.createGain());
    dry.gain.value=1-wet;
    node.connect(dry).connect(master);
    const delay=keep(ctx.createDelay(1.2));
    const fb=keep(ctx.createGain());
    const echo=keep(ctx.createGain());
    delay.delayTime.value=0.36*timeScale;
    fb.gain.value=0.22;
    echo.gain.value=wet;
    node.connect(delay);
    delay.connect(fb).connect(delay);
    delay.connect(echo).connect(master);
  }

  function piano(start,midi,dur=4.8,amp=0.11){
    const t0=at(start), t1=t0+dur*timeScale;
    const g=keep(ctx.createGain());
    const filter=keep(ctx.createBiquadFilter());
    filter.type='lowpass'; filter.frequency.value=2500; filter.Q.value=.3;
    g.gain.setValueAtTime(0.0001,t0);
    g.gain.exponentialRampToValueAtTime(amp,t0+0.045*timeScale);
    g.gain.exponentialRampToValueAtTime(0.0001,t1);
    g.connect(filter); route(filter,.14);
    [[1,'sine',1],[2.01,'sine',.22],[3.02,'triangle',.07]].forEach(([mult,type,ratio])=>{
      const o=keep(ctx.createOscillator());
      const og=keep(ctx.createGain());
      o.type=type; o.frequency.value=hz(midi)*mult; og.gain.value=ratio;
      o.connect(og).connect(g); o.start(t0); o.stop(t1+.08);
    });
  }

  function pad(start,dur,midis,amp=.033){
    const t0=at(start), t1=t0+dur*timeScale;
    const g=keep(ctx.createGain());
    const filter=keep(ctx.createBiquadFilter());
    filter.type='lowpass'; filter.frequency.value=1100; filter.Q.value=.2;
    g.gain.setValueAtTime(0.0001,t0);
    g.gain.linearRampToValueAtTime(amp,t0+Math.min(3*timeScale,(t1-t0)*.25));
    g.gain.setValueAtTime(amp,t1-Math.min(4*timeScale,(t1-t0)*.25));
    g.gain.linearRampToValueAtTime(0.0001,t1);
    g.connect(filter); route(filter,.22);
    midis.forEach((m,i)=>{
      const o=keep(ctx.createOscillator());
      const og=keep(ctx.createGain());
      o.type='sine'; o.frequency.value=hz(m); o.detune.value=(i%2?4:-4); og.gain.value=1/midis.length;
      o.connect(og).connect(g); o.start(t0); o.stop(t1+.1);
    });
  }

  function cello(start,dur,midi,amp=.035){
    const t0=at(start),t1=t0+dur*timeScale;
    const g=keep(ctx.createGain());
    const f=keep(ctx.createBiquadFilter());
    f.type='lowpass';f.frequency.value=520;f.Q.value=.8;
    g.gain.setValueAtTime(.0001,t0);
    g.gain.linearRampToValueAtTime(amp,t0+2.1*timeScale);
    g.gain.setValueAtTime(amp,t1-2.4*timeScale);
    g.gain.linearRampToValueAtTime(.0001,t1);
    g.connect(f);route(f,.12);
    const o=keep(ctx.createOscillator());o.type='sawtooth';o.frequency.value=hz(midi);o.connect(g);o.start(t0);o.stop(t1+.1);
    const s=keep(ctx.createOscillator()),sg=keep(ctx.createGain());s.type='sine';s.frequency.value=hz(midi);sg.gain.value=.45;s.connect(sg).connect(g);s.start(t0);s.stop(t1+.1);
  }

  function compose(){
    [
      [0,34,[48,55,60,64]],[28,36,[45,52,57,60]],[58,38,[53,60,65,69]],
      [90,38,[50,57,62,65]],[120,42,[43,50,55,60]],[157,38,[45,52,57,62]],
      [188,22,[43,50,55,60]]
    ].forEach(x=>pad(...x));

    const beat=60/64;
    for(let base=4;base<38;base+=8*beat){
      [60,64,67,62,60].forEach((m,j)=>piano(base+j*1.5*beat,m,4.7,j<4?.105:.072));
    }
    for(let base=40;base<82;base+=9*beat){
      [60,64,67,62].forEach((m,j)=>piano(base+j*1.7*beat,m,4.7,.094));
    }
    [84,96,108,120,132].forEach(base=>{
      const seq=base<120?[60,64,67]:[60,64,62];
      seq.forEach((m,j)=>piano(base+j*2.2,m,5,.09));
    });
    cello(92,22,38,.032); cello(121,22,36,.034);
    [142,153,165,176].forEach(base=>[60,64,67,62].forEach((m,j)=>piano(base+j*2.5,m,5,.084)));
    [[186,60,.07],[192,64,.06],[198,62,.052],[203,60,.045]].forEach(([s,m,a])=>piano(s,m,5.5,a));
    cello(176,28,43,.024);
  }

  async function start(){
    stop(0);
    const AC=window.AudioContext||window.webkitAudioContext;
    if(!AC) return;
    ctx=new AC();
    await ctx.resume().catch(()=>{});
    master=keep(ctx.createGain());
    master.gain.value=.0001;
    master.connect(ctx.destination);
    const t=ctx.currentTime+.06;
    master.gain.setValueAtTime(.0001,t);
    master.gain.linearRampToValueAtTime(.20,t+2.5*timeScale);
    compose();
    const end=at(210);
    const fadeStart=at(202);
    master.gain.setValueAtTime(.20,fadeStart);
    master.gain.linearRampToValueAtTime(.0001,end);
  }

  function stop(fade=.35){
    if(!ctx) return;
    const c=ctx,m=master;
    try{
      if(m){
        const now=c.currentTime;
        m.gain.cancelScheduledValues(now);
        m.gain.setValueAtTime(Math.max(.0001,m.gain.value||.1),now);
        m.gain.linearRampToValueAtTime(.0001,now+fade);
      }
      setTimeout(()=>{try{c.close()}catch(e){}},Math.max(50,fade*1000+80));
    }catch(e){try{c.close()}catch(_){} }
    ctx=null;master=null;nodes=[];
  }

  function bind(){
    document.querySelector('#start')?.addEventListener('click',start);
    document.querySelector('#again')?.addEventListener('click',start);
    document.querySelector('#restart')?.addEventListener('click',()=>stop(.25));
    const end=document.querySelector('#end');
    if(end){
      new MutationObserver(()=>{if(end.classList.contains('show')) stop(2.2)}).observe(end,{attributes:true,attributeFilter:['class']});
    }
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',bind,{once:true}); else bind();
  window.Room6Soundtrack={start,stop};
})();
