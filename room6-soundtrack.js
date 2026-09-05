(()=>{
  const params=new URLSearchParams(location.search);
  const demo=params.get('demo')==='1';
  const timeScale=demo?0.22:1;
  const FULL_DURATION=420;
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
    fb.gain.value=0.20;
    echo.gain.value=wet;
    node.connect(delay);
    delay.connect(fb).connect(delay);
    delay.connect(echo).connect(master);
  }

  function piano(start,midi,dur=5,amp=0.10){
    const t0=at(start),t1=t0+dur*timeScale;
    const g=keep(ctx.createGain());
    const filter=keep(ctx.createBiquadFilter());
    filter.type='lowpass';filter.frequency.value=2350;filter.Q.value=.28;
    g.gain.setValueAtTime(.0001,t0);
    g.gain.exponentialRampToValueAtTime(amp,t0+.05*timeScale);
    g.gain.exponentialRampToValueAtTime(.0001,t1);
    g.connect(filter);route(filter,.15);
    [[1,'sine',1],[2.01,'sine',.20],[3.02,'triangle',.06]].forEach(([mult,type,ratio])=>{
      const o=keep(ctx.createOscillator()),og=keep(ctx.createGain());
      o.type=type;o.frequency.value=hz(midi)*mult;og.gain.value=ratio;
      o.connect(og).connect(g);o.start(t0);o.stop(t1+.08);
    });
  }

  function pad(start,dur,midis,amp=.030){
    const t0=at(start),t1=t0+dur*timeScale;
    const g=keep(ctx.createGain()),filter=keep(ctx.createBiquadFilter());
    filter.type='lowpass';filter.frequency.value=1050;filter.Q.value=.18;
    const fadeIn=Math.min(5*timeScale,(t1-t0)*.28),fadeOut=Math.min(7*timeScale,(t1-t0)*.28);
    g.gain.setValueAtTime(.0001,t0);
    g.gain.linearRampToValueAtTime(amp,t0+fadeIn);
    g.gain.setValueAtTime(amp,t1-fadeOut);
    g.gain.linearRampToValueAtTime(.0001,t1);
    g.connect(filter);route(filter,.22);
    midis.forEach((m,i)=>{
      const o=keep(ctx.createOscillator()),og=keep(ctx.createGain());
      o.type='sine';o.frequency.value=hz(m);o.detune.value=(i%2?4:-4);og.gain.value=1/midis.length;
      o.connect(og).connect(g);o.start(t0);o.stop(t1+.1);
    });
  }

  function cello(start,dur,midi,amp=.028){
    const t0=at(start),t1=t0+dur*timeScale;
    const g=keep(ctx.createGain()),f=keep(ctx.createBiquadFilter());
    f.type='lowpass';f.frequency.value=480;f.Q.value=.7;
    g.gain.setValueAtTime(.0001,t0);
    g.gain.linearRampToValueAtTime(amp,t0+2.8*timeScale);
    g.gain.setValueAtTime(amp,t1-3*timeScale);
    g.gain.linearRampToValueAtTime(.0001,t1);
    g.connect(f);route(f,.11);
    const o=keep(ctx.createOscillator());o.type='sawtooth';o.frequency.value=hz(midi);o.connect(g);o.start(t0);o.stop(t1+.1);
    const s=keep(ctx.createOscillator()),sg=keep(ctx.createGain());s.type='sine';s.frequency.value=hz(midi);sg.gain.value=.42;s.connect(sg).connect(g);s.start(t0);s.stop(t1+.1);
  }

  function motif(base,seq,spacing=2.2,amp=.09,dur=5){
    seq.forEach((m,j)=>piano(base+j*spacing,m,dur,amp*(j===0?1:.92)));
  }

  function compose(){
    // 0:00–7:00：同一首曲子一路由「期待」走向「落空」。
    // 和聲不做明確收束，最後停在懸而未決的空間裡。
    [
      [0,62,[48,55,60,64],.031],
      [54,64,[45,52,57,60],.030],
      [110,66,[53,60,65,69],.030],
      [168,68,[50,57,62,65],.029],
      [228,66,[43,50,55,60],.028],
      [286,66,[45,52,57,62],.027],
      [344,48,[53,60,65,67],.025],
      [382,38,[43,50,55,60],.022]
    ].forEach(x=>pad(...x));

    // 0:00–1:10　平靜、有一點期待；偶爾真的回到主音。
    [5,18,31,44,57].forEach((base,i)=>motif(base,[60,64,67,62,60],1.55,.102-i*.003,4.8));

    // 1:10–2:15　開始等待：同樣的旋律，但不再給最後的答案。
    [72,86,101,116].forEach((base,i)=>motif(base,[60,64,67,62],1.9,.091-i*.002,5));
    piano(131,60,5,.074);

    // 2:15–3:20　第一次真正感覺到落差，音符變少、低音第一次出現。
    [139,155,172,189].forEach((base,i)=>motif(base,i<2?[60,64,67]:[60,64,62],2.45,.083-i*.003,5.4));
    cello(148,26,38,.026);cello(187,24,36,.028);

    // 3:20–4:25　再給一點「好像會好起來」的錯覺，但每次都不落地。
    [205,222,240,258].forEach((base,i)=>motif(base,[60,64,67,62],2.7,.078-i*.002,5.8));
    piano(275,60,6,.060);
    cello(229,28,43,.024);

    // 4:25–5:30　被忽略／沒有被接住，空拍越來越多。
    [286,306,327].forEach((base,i)=>motif(base,i===0?[60,64,62]:[60,67,62],3.3,.069-i*.004,6.2));
    cello(296,30,40,.022);cello(331,28,38,.021);

    // 5:30–6:15　只剩殘缺的熟悉旋律。
    motif(346,[60,64,62],4.2,.055,6.5);
    motif(365,[60,62],5.2,.047,7);
    cello(350,30,43,.018);

    // 6:15–7:00　最後等待：零星單音，讓「最後一顆音」始終沒有出現。
    piano(381,60,7,.041);
    piano(393,64,7,.034);
    piano(404,62,7,.029);
    cello(385,24,43,.014);
  }

  async function start(){
    stop(0);
    const AC=window.AudioContext||window.webkitAudioContext;
    if(!AC)return;
    ctx=new AC();
    await ctx.resume().catch(()=>{});
    master=keep(ctx.createGain());
    master.gain.value=.0001;
    master.connect(ctx.destination);
    const t=ctx.currentTime+.06;
    master.gain.setValueAtTime(.0001,t);
    master.gain.linearRampToValueAtTime(.19,t+2.8*timeScale);
    compose();
    const fadeStart=at(FULL_DURATION-9);
    const end=at(FULL_DURATION);
    master.gain.setValueAtTime(.19,fadeStart);
    master.gain.linearRampToValueAtTime(.0001,end);
  }

  function stop(fade=.35){
    if(!ctx)return;
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
      new MutationObserver(()=>{if(end.classList.contains('show'))stop(2.2)}).observe(end,{attributes:true,attributeFilter:['class']});
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
  window.Room6Soundtrack={start,stop,duration:FULL_DURATION};
})();
