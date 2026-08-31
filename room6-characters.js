(()=>{
  function addCard(el,name,initial,cls){
    if(!el || el.dataset.characterDone==='1') return;
    el.dataset.characterDone='1';
    el.classList.add('person-enhanced');
    const card=document.createElement('div');
    card.className=`character-card ${cls||''}`;
    card.innerHTML=`<div class="character-avatar">${initial}</div><div class="character-name">${name}</div>`;
    el.appendChild(card);
  }
  function decorateWalk(root){
    const walkers=root.querySelectorAll?.('.walkers .walker');
    if(!walkers || walkers.length<3) return;
    addCard(walkers[0],'同學 A','A','student-a');
    addCard(walkers[1],'佳怡','佳','jiayi');
    addCard(walkers[2],'同學 B','B','student-b');
  }
  function decorateStage(root){
    const performers=root.querySelectorAll?.('.perform-stage .performer');
    if(!performers || performers.length<2) return;
    performers.forEach((el,i)=>{
      if(el.dataset.characterDone==='1') return;
      el.dataset.characterDone='1';
      el.classList.add('person-enhanced');
      const card=document.createElement('div');
      card.className=`stage-character-card ${i===0?'you':'azhe'}`;
      card.innerHTML=`<div class="stage-character-mic">🎤</div><div class="stage-character-avatar">${i===0?'你':'哲'}</div><div class="stage-character-name">${i===0?'你':'阿哲'}</div>`;
      el.appendChild(card);
    });
  }
  function decorateStory(root){
    root.querySelectorAll?.('.stage-mini').forEach(stage=>{
      if(stage.dataset.characterDone==='1') return;
      stage.dataset.characterDone='1';
      stage.classList.add('enhanced-stage');
      stage.insertAdjacentHTML('beforeend',`
        <div class="mini-performer you"><div class="mini-mic">🎤</div><div class="mini-avatar-big">你</div><div class="mini-name">你</div></div>
        <div class="mini-performer azhe"><div class="mini-mic">🎤</div><div class="mini-avatar-big">哲</div><div class="mini-name">阿哲</div></div>
      `);
    });
  }
  function decorate(root=document){
    decorateWalk(root);
    decorateStage(root);
    decorateStory(root);
  }
  const observer=new MutationObserver(records=>{
    for(const record of records){
      record.addedNodes.forEach(node=>{
        if(node.nodeType===1) decorate(node);
      });
    }
    decorate(document);
  });
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>{decorate();observer.observe(document.body,{childList:true,subtree:true})});
  else {decorate();observer.observe(document.body,{childList:true,subtree:true})}
})();
