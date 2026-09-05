(()=>{
  const params=new URLSearchParams(location.search);
  const demo=params.get('demo')==='1';
  const timeScale=demo?0.22:1;
  const FULL_DURATION=420;
  let ctx=null,master=null,nodes=[];

  const hz=m=>440*Math.pow(2,(m-69)/12);
  const at=s=>ctx.currentTime+0.06+s*timeScale;
  const keep=n=>{nodes.push(n);return n};

  function route(node,wet=0.18){
    const dry=keep(ctx.createGain());
    dry.gain.value=1-wet;
    node.connect(dry).connect(master);
    const delay=keep(ctx.createDelay(1.4));
    const fb=keep(ctx.createGain());
    const echo=keep(ctx.createGain());
    delay.delayTime.value=0.43*timeScale;
    fb.gain.value=0.18;
    echo.gain.value=wet;
    node.connect(delay);
    delay.connect(fb).connect(delay);
    delay.connect(echo).connect(master);
  }

  function piano(start,midi,dur=5.6,amp=.09){
    const t0=at(start),t1=t0+dur*timeScale;
    const g=keep(ctx.createGain()),filter=keep(ctx.createBiquadFilter());
    filter.type='lowpass';filter.frequency.value=1850;filter.Q.value=.3;
    g.gain.setValueAtTime(.0001,t0);
    g.gain.exponentialRampToValueAtTime(amp,t0+.065*timeScale);
    g.gain.exponentialRampToValueAtTime(.0001,t1);
    g.connect(filter);route(filter,.18);
    [[1,'sine',1],[2.005,'sine',.16],[3.01,'triangle',.045]].forEach(([mult,type,ratio])=>{
      const o=keep(ctx.createOscillator()),og=keep(ctx.createGain());
      o.type=type;o.frequency.value=hz(midi)*mult;og.gain.value=ratio;
      o.connect(og).connect(g);o.start(t0);o.stop(t1+.1);
    });
  }

  function pad(start,dur,midis,amp=.025){
    const t0=at(start),t1=t0+dur*timeScale;
    const g=keep(ctx.createGain()),filter=keep(ctx.createBiquadFilter());
    filter.type='lowpass';filter.frequency.value=820;filter.Q.value=.2;
    const fadeIn=Math.min(6*timeScale,(t1-t0)*.28),fadeOut=Math.min(8*timeScale,(t1-t0)*.3);
    g.gain.setValueAtTime(.0001,t0);
    g.gain.linearRampToValueAtTime(amp,t0+fadeIn);
    g.gain.setValueAtTime(amp,t1-fadeOut);
    g.gain.linearRampToValueAtTime(.0001,t1);
    g.connect(filter);route(filter,.25);
    midis.forEach((m,i)=>{
      const o=keep(ctx.createOscillator()),og=keep(ctx.createGain());
      o.type='sine';o.frequency.value=hz(m);o.detune.value=(i%2?3:-3);og.gain.value=1/midis.length;
      o.connect(og).connect(g);o.start(t0);o.stop(t1+.1);
    });
  }

  function cello(start,dur,midi,amp=.025){
    const t0=at(start),t1=t0+dur*timeScale;
    const g=keep(ctx.createGain()),f=keep(ctx.createBiquadFilter());
    f.type='lowpass';f.frequency.value=410;f.Q.value=.65;
    g.gain.setValueAtTime(.0001,t0);
    g.gain.linearRampToValueAtTime(amp,t0+3.1*timeScale);
    g.gain.setValueAtTime(amp,t1-3.4*timeScale);
    g.gain.linearRampToValueAtTime(.0001,t1);
    g.connect(f);route(f,.13);
    const o=keep(ctx.createOscillator());o.type='sawtooth';o.frequency.value=hz(midi);o.connect(g);o.start(t0);o.stop(t1+.1);
    const s=keep(ctx.createOscillator()),sg=keep(ctx.createGain());s.type='sine';s.frequency.value=hz(midi);sg.gain.value=.5;s.connect(sg).connect(g);s.start(t0);s.stop(t1+.1);
  }

  function glass(start,midi,dur=7,amp=.012){
    const t0=at(start),t1=t0+dur*timeScale;
    const g=keep(ctx.createGain()),f=keep(ctx.createBiquadFilter());
    f.type='lowpass';f.frequency.value=1500;
    g.gain.setValueAtTime(.0001,t0);
    g.gain.linearRampToValueAtTime(amp,t0+.7*timeScale);
    g.gain.exponentialRampToValueAtTime(.0001,t1);
    g.connect(f);route(f,.3);
    const o=keep(ctx.createOscillator());o.type='sine';o.frequency.value=hz(midi);o.connect(g);o.start(t0);o.stop(t1+.1);
  }

  function motif(base,seq,spacing=2.3,amp=.078,dur=5.8){
    seq.forEach((m,j)=>piano(base+j*spacing,m,dur,amp*(j===0?1:.9)));
  }

  function compose(){
    // 第二版：仍然是一首連續背景音樂，但把情緒往「失落」再推一點。
    // 重點不是變得很悲傷，而是：音域更低、旋律更常下行、答案更少出現。
    [
      [0,68,[45,52,57,60],.026],
      [60,68,[41,48,53,57],.025],
      [120,68,[38,45,50,53],.025],
      [180,68,[43,50,55,57],.024],
      [240,66,[45,52,56,59],.023],
      [298,64,[41,48,53,55],.022],
      [354,66,[43,50,55,60],.020]
    ].forEach(x=>pad(...x));

    // 0:00–1:10：還是平靜，但主題改成向下走，少一點原本的溫暖。
    [5,19,34,49,64].forEach((base,i)=>motif(base,[64,62,60,57],1.7,.091-i*.002,5.2));
    piano(72,60,5.5,.056);

    // 1:10–2:15：開始有「等不到」的感覺，旋律縮短，留下更長的空白。
    [80,96,113,130].forEach((base,i)=>motif(base,i<2?[62,60,57]:[60,59,57],2.25,.079-i*.002,5.7));
    cello(104,25,38,.022);
    glass(126,68,8,.009);

    // 2:15–3:20：第一次明顯往下沉。不是大悲傷，而是心裡慢慢空掉。
    [145,163,182,202].forEach((base,i)=>motif(base,i===0?[64,60,59]:[60,59,57],2.7,.073-i*.003,6));
    cello(151,28,36,.026);cello(194,27,38,.024);
    piano(216,55,7,.045);

    // 3:20–4:25：偶爾像要回來，但最後一顆解決音始終不給。
    [226,245,265,285].forEach((base,i)=>motif(base,[57,60,59],3,.067-i*.002,6.3));
    cello(238,31,43,.021);
    glass(278,68,8,.008);

    // 4:25–5:30：人還在，但音樂開始像退到很遠的地方。
    [306,328,350].forEach((base,i)=>motif(base,i===0?[60,59,57]:[59,57],3.8,.056-i*.004,6.8));
    cello(314,31,40,.019);cello(348,27,38,.017);

    // 5:30–6:15：只剩熟悉旋律的殘影，下行後就停住。
    motif(369,[60,59,57],4.5,.044,7.2);
    motif(389,[59,57],5.5,.036,7.5);
    cello(374,28,43,.014);

    // 6:15–7:00：最後的等待。單音一顆一顆變低，最後仍不收束。
    piano(402,60,7.5,.034);
    piano(411,59,7.5,.028);
    piano(418,57,6,.022);
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
    master.gain.linearRampToValueAtTime(.18,t+3*timeScale);
    compose();
    const fadeStart=at(FULL_DURATION-10),end=at(FULL_DURATION);
    master.gain.setValueAtTime(.18,fadeStart);
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
    if(end)new MutationObserver(()=>{if(end.classList.contains('show'))stop(2.4)}).observe(end,{attributes:true,attributeFilter:['class']});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
  window.Room6Soundtrack={start,stop,duration:FULL_DURATION};
})();
