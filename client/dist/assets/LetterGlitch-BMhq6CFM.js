import{r as J,j as rt}from"./index-CQL5KRVE.js";const at="ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$&*()-_+=/[]{};:<>.,0123456789",st="ui-monospace, 'SF Mono', 'JetBrains Mono', Menlo, Consolas, 'Liberation Mono', monospace",Xt=["#ffffff","#61dca3"],kt=["#18181b","#0f9f6e"],Pe=8,Bt=1.4,Ot=.2,Gt=.1,Wt=48,Ht=`#version 300 es
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`,Nt=`#version 300 es
precision highp float;
precision highp int;
uniform sampler2D uAtlas;
uniform sampler2D uState;
uniform ivec2 uCell;
uniform ivec2 uGrid;
uniform int uAtlasColumns;
uniform vec2 uResolution;
uniform vec2 uOrigin;
uniform vec3 uBase;
uniform float uBaseOpacity;
uniform vec3 uColors[8];
uniform float uEdge;
uniform float uCenter;
uniform vec2 uPointer;
uniform float uRadius;
uniform float uPresence;
uniform float uReveal;
uniform float uTime;
uniform float uFlow;
uniform float uFlowScale;
uniform vec4 uBackground;
uniform float uRepel;
out vec4 outColor;

float hash(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * 0.1031);
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 w = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, w.x), mix(c, d, w.x), w.y);
}

float smoother(float x) {
  x = clamp(x, 0.0, 1.0);
  return x * x * x * (x * (x * 6.0 - 15.0) + 10.0);
}

// Colour of one glyph pixel: cell is the grid cell, local the pixel inside that cell.
vec4 shade(ivec2 cell, ivec2 local) {
  vec4 state = texelFetch(uState, cell, 0);
  int glyph = int(state.r * 255.0 + 0.5);
  ivec2 texel = ivec2(glyph % uAtlasColumns, glyph / uAtlasColumns) * uCell + local;
  float coverage = texelFetch(uAtlas, texel, 0).a;
  if (coverage <= 0.0) return vec4(0.0);
  vec2 center = vec2(cell * uCell) + vec2(uCell) * 0.5 + uOrigin;
  float mask = 1.0;
  if (uEdge > 0.0) {
    vec2 edge = min(center, uResolution - center) / uEdge;
    mask = smoother(edge.x) * smoother(edge.y);
  }
  if (uCenter > 0.0) {
    vec2 room = max(abs(center - uResolution * 0.5) - uResolution * vec2(0.3, 0.24), 0.0);
    float soft = min(uResolution.x, uResolution.y) * 0.24;
    mask *= 1.0 - uCenter * (1.0 - smoother(length(room) / soft));
  }
  float seed = hash(vec2(cell) + 17.0);
  float rest = state.g * uBaseOpacity * (0.8 + 0.2 * sin(uTime * (0.5 + 1.2 * seed) + seed * 40.0));
  if (uFlow > 0.0) {
    vec2 p = center / uFlowScale;
    float n = 0.65 * noise(p + vec2(uTime * 0.05, uTime * 0.03)) + 0.35 * noise(p * 2.03 - vec2(uTime * 0.04, -uTime * 0.06));
    rest *= mix(1.0, 0.1 + 1.7 * smoothstep(0.25, 0.8, n), uFlow);
  }
  if (uPresence > 0.0) {
    float d = length(center - uPointer) / uRadius;
    float f = clamp(1.0 - d * d, 0.0, 1.0);
    rest = mix(rest, max(rest, uReveal * step(0.004, state.g)), f * f * uPresence);
  }
  float heat = state.b;
  rest = min(rest, 1.0) * (1.0 - heat);
  vec3 tint = uColors[int(state.a * 255.0 + 0.5)];
  float weight = coverage * mask;
  return vec4((uBase * rest + tint * heat) * weight, (rest + heat) * weight);
}

void main() {
  vec2 pc = vec2(gl_FragCoord.x, uResolution.y - gl_FragCoord.y);
  vec2 frag = pc - uOrigin;
  ivec2 q = ivec2(floor(frag));
  vec4 color = vec4(0.0);
  float maxPush = uRepel * uRadius;
  // Repel: letters near the pointer glide away from it. Each nearby cell moves as a whole,
  // so we look at the neighbours that could land on this pixel.
  if (maxPush > 0.0 && uPresence > 0.001 && distance(pc, uPointer) < uRadius + maxPush + float(uCell.x + uCell.y)) {
    ivec2 base = q / uCell;
    int span = min(int(ceil(maxPush / float(min(uCell.x, uCell.y)))) + 1, 14);
    for (int dy = -span; dy <= span; dy++) {
      for (int dx = -span; dx <= span; dx++) {
        ivec2 n = base + ivec2(dx, dy);
        if (n.x < 0 || n.y < 0 || n.x >= uGrid.x || n.y >= uGrid.y) continue;
        vec2 c0 = vec2(n * uCell) + vec2(uCell) * 0.5 + uOrigin;
        vec2 away = c0 - uPointer;
        float dist = max(length(away), 0.001);
        float f = clamp(1.0 - dist / uRadius, 0.0, 1.0);
        vec2 push = (away / dist) * f * f * maxPush * uPresence;
        ivec2 local = ivec2(floor(pc - (vec2(n * uCell) + uOrigin + push)));
        if (local.x < 0 || local.y < 0 || local.x >= uCell.x || local.y >= uCell.y) continue;
        vec4 c = shade(n, local);
        if (c.a > color.a) color = c;
      }
    }
  } else if (all(greaterThanEqual(q, ivec2(0)))) {
    ivec2 cell = q / uCell;
    if (all(lessThan(cell, uGrid))) color = shade(cell, q - cell * uCell);
  }
  outColor = color + uBackground * (1.0 - color.a);
}`,b=(u,E,P)=>Math.min(P,Math.max(E,u)),qt=u=>{const E=b(u,0,1);return E*E*E*(E*(E*6-15)+10)},ct=(u,E,P)=>{const g=u.createShader(E);return g?(u.shaderSource(g,P),u.compileShader(g),u.getShaderParameter(g,u.COMPILE_STATUS)?g:(u.deleteShader(g),null)):null},Yt=u=>{const E=ct(u,u.VERTEX_SHADER,Ht),P=ct(u,u.FRAGMENT_SHADER,Nt),g=u.createProgram();if(!E||!P||!g)return null;if(u.attachShader(g,E),u.attachShader(g,P),u.linkProgram(g),u.deleteShader(E),u.deleteShader(P),!u.getProgramParameter(g,u.LINK_STATUS))return u.deleteProgram(g),null;const re={},Me=u.getProgramParameter(g,u.ACTIVE_UNIFORMS);for(let Z=0;Z<Me;Z++){const ae=u.getActiveUniform(g,Z);if(!ae)continue;const se=ae.name.replace(/\[0\]$/,"");re[se]=u.getUniformLocation(g,se)}return{program:g,uniforms:re}},$t=({glitchColors:u,baseColor:E,characters:P=at,fontFamily:g=st,fontSize:re=14,spacing:Me=.6,density:Z=.9,baseOpacity:ae=.16,glitchAmount:se=.5,speed:it=1,smooth:lt=!0,interactive:ut=!0,cursorRadius:ft=140,repel:ht=0,maxFps:mt=60,clickEffect:dt="tear",flow:pt=.5,edgeFade:xt=0,centerFade:gt=0,intro:Mt=!0,lightMode:Le=!1,backgroundColor:vt,dpr:yt,className:De="",style:wt,...Et})=>{const Ie=J.useRef(null),Ue=J.useRef(null),Q=J.useRef(null),Xe={colors:((Array.isArray(u)&&u.length?u:null)||(Le?kt:Xt)).slice(0,Pe),baseColor:E||(Le?"#18181b":"#ffffff"),characters:P||at,fontFamily:g||st,fontSize:b(re,6,96),spacing:b(Me,0,2),density:b(Z,0,1),baseOpacity:b(ae,0,1),glitchAmount:b(se,0,1),speed:Math.max(0,it),smooth:lt,interactive:ut,cursorRadius:Math.max(0,ft),repel:b(ht,0,1),maxFps:b(mt,5,120),clickEffect:dt,flow:b(pt,0,1),edgeFade:b(xt,0,.5),centerFade:b(gt,0,1),intro:Mt,backgroundColor:vt,dpr:yt},T=J.useRef(Xe);return T.current=Xe,J.useEffect(()=>{var nt,ge,ot;const L=Ie.current,v=Ue.current,o=v==null?void 0:v.getContext("webgl2",{alpha:!0,premultipliedAlpha:!0,antialias:!1,depth:!1,stencil:!1});if(!L||!v||!o)return;const ce=Yt(o);if(!ce)return;const p=ce.uniforms,ke=o.createVertexArray(),Be=()=>{const t=o.createTexture();return o.bindTexture(o.TEXTURE_2D,t),o.texParameteri(o.TEXTURE_2D,o.TEXTURE_MIN_FILTER,o.NEAREST),o.texParameteri(o.TEXTURE_2D,o.TEXTURE_MAG_FILTER,o.NEAREST),o.texParameteri(o.TEXTURE_2D,o.TEXTURE_WRAP_S,o.CLAMP_TO_EDGE),o.texParameteri(o.TEXTURE_2D,o.TEXTURE_WRAP_T,o.CLAMP_TO_EDGE),t},ve=Be(),ye=Be(),Tt=o.getParameter(o.MAX_TEXTURE_SIZE),ie=document.createElement("canvas"),D=ie.getContext("2d"),G=document.createElement("canvas").getContext("2d",{willReadFrequently:!0});if(!D)return;const Oe=new Map,we=t=>{const n=String(t),e=Oe.get(n);if(e)return e;let r=[1,1,1];if(G){G.clearRect(0,0,1,1),G.fillStyle="#ffffff",G.fillStyle=n,G.fillRect(0,0,1,1);const[i,s,l]=G.getImageData(0,0,1,1).data;r=[i/255,s/255,l/255]}return Oe.set(n,r),r},X=((nt=window.matchMedia)==null?void 0:nt.call(window,"(prefers-reduced-motion: reduce)").matches)??!1,M={width:1,height:1,ratio:1},a={cols:0,rows:0,cellW:0,cellH:0,originX:0,originY:0,atlasColumns:1},c={x:0,y:0,sx:0,sy:0,inside:!1,presence:0,stir:0,fresh:!0},k=[],le=new Float32Array(Pe*3),Ge=new Set;let ee=[0],ue="",We="",fe=1,R=0,y=new Uint8Array(0),W=new Float32Array(0),H=new Float32Array(0),U=new Float32Array(0),te=new Float32Array(0),ne=new Float32Array(0),N=new Float32Array(0),he=new Float32Array(0),Ee=new Float32Array(0),q=new Float32Array(0),B=new Int32Array(0),Y=new Int32Array(0),z=0,me=T.current.intro&&!X,He=0,Ne=0,Te=-1,Re=0,Ae=0,Ce=0,F=!0,V=0,$=0,de=!0,qe=!0;const oe=()=>ee[Math.random()*ee.length|0],O=()=>Math.random()*fe|0,be=(t,n=1)=>he[t]<T.current.density?Math.round(Ee[t]*255*n):0,pe=(t,n)=>{const e=Math.floor((t-a.originX)/a.cellW),r=Math.floor((n-a.originY)/a.cellH);return e<0||r<0||e>=a.cols||r>=a.rows?-1:r*a.cols+e},j=(t,n,e,r,i,s=0)=>{if(B[t]<0){B[t]=z,Y[z++]=t,W[t]=0,U[t]=e,H[t]=n,te[t]=r,ne[t]=0,N[t]=s,y[t*4+3]=i;return}W[t]<.15&&(y[t*4+3]=i),H[t]=U[t]>0?Math.max(H[t],n):n,U[t]=Math.max(U[t],e),te[t]=Math.max(te[t],r),N[t]=Math.min(N[t],s)},Rt=t=>{const n=Y[t],e=Y[--z];Y[t]=e,B[e]=t,B[n]=-1,W[n]=0,y[n*4+2]=0},At=()=>{var _;const t=T.current,n=t.fontSize*M.ratio,e=`${n}px ${t.fontFamily}`,r=Array.from(t.characters),i=Array.from(new Set(r)).slice(0,256);D.font=e;let s=1;i.forEach(S=>{s=Math.max(s,D.measureText(S).width)});const l=D.measureText("M"),x=Math.max(2,Math.ceil(s+n*t.spacing)),w=Math.max(2,Math.ceil(n*(.95+t.spacing))),h=Math.max(1,Math.min(i.length,Math.floor(Tt/x)));ie.width=h*x,ie.height=Math.ceil(i.length/h)*w,D.font=e,D.textAlign="center",D.textBaseline="alphabetic",D.fillStyle="#ffffff";const f=w/2+(l.actualBoundingBoxAscent-l.actualBoundingBoxDescent)/2;i.forEach((S,K)=>{D.fillText(S,K%h*x+x/2,Math.floor(K/h)*w+f)}),o.bindTexture(o.TEXTURE_2D,ve),o.texImage2D(o.TEXTURE_2D,0,o.RGBA,o.RGBA,o.UNSIGNED_BYTE,ie);const m=new Map(i.map((S,K)=>[S,K])),d=r.map(S=>m.get(S)).filter(S=>S!==void 0),A=d.length!==ee.length||d.some((S,K)=>S!==ee[K]);ee=d.length?d:[0];const C=x!==a.cellW||w!==a.cellH;return a.cellW=x,a.cellH=w,a.atlasColumns=h,!Ge.has(e)&&((_=document.fonts)!=null&&_.load)&&(Ge.add(e),document.fonts.load(e,t.characters).then(()=>{qe&&(ue="",I())}).catch(()=>{})),{resized:C,charsChanged:A}},Ct=(t,n,e,r)=>{const i=(t+.5)/e-.5,s=(n+.5)/r-.5,l=Math.min(1,Math.hypot(i,s*.8)*1.6);return Bt*(.3*l+.7*Math.random()**1.3)},Ye=()=>{const t=Math.ceil(v.width/a.cellW)+1,n=Math.ceil(v.height/a.cellH)+1;if(a.originX=Math.floor((v.width-t*a.cellW)/2),a.originY=Math.floor((v.height-n*a.cellH)/2),t===a.cols&&n===a.rows)return;const e=t*n,r=new Uint8Array(e*4),i=new Float32Array(e),s=new Float32Array(e),l=new Float32Array(e),x=Math.floor((a.cols-t)/2),w=Math.floor((a.rows-n)/2);for(let h=0;h<n;h++)for(let f=0;f<t;f++){const m=h*t+f,d=f+x,A=h+w;if(d>=0&&A>=0&&d<a.cols&&A<a.rows){const C=A*a.cols+d;r[m*4]=y[C*4],r[m*4+1]=y[C*4+1],i[m]=he[C],s[m]=Ee[C],l[m]=q[C]}else r[m*4]=oe(),i[m]=Math.random(),s[m]=.55+.45*Math.random(),l[m]=me?Ct(f,h,t,n):-1}a.cols=t,a.rows=n,R=e,y=r,he=i,Ee=s,q=l,W=new Float32Array(e),H=new Float32Array(e),U=new Float32Array(e),te=new Float32Array(e),ne=new Float32Array(e),N=new Float32Array(e),B=new Int32Array(e).fill(-1),Y=new Int32Array(e),z=0,k.length=0;for(let h=0;h<e;h++)y[h*4+1]=q[h]>=0?0:be(h);Te=T.current.density,o.bindTexture(o.TEXTURE_2D,ye),o.texImage2D(o.TEXTURE_2D,0,o.RGBA8,t,n,0,o.RGBA,o.UNSIGNED_BYTE,y),F=!1},ze=()=>{const t=T.current,n=`${t.fontSize*M.ratio}|${t.fontFamily}|${t.spacing}|${t.characters}`;if(n===ue)return;ue=n;const{resized:e,charsChanged:r}=At();if((e||!a.cols)&&Ye(),r){for(let i=0;i<R;i++)y[i*4]=oe();F=!0}},bt=()=>{const t=T.current,n=t.colors.join(",");if(n!==We){We=n,fe=Math.max(1,t.colors.length);for(let e=0;e<Pe;e++){const r=we(t.colors[Math.min(e,fe-1)]??"#ffffff");le[e*3]=r[0],le[e*3+1]=r[1],le[e*3+2]=r[2]}for(let e=0;e<R;e++)y[e*4+3]>=fe&&(y[e*4+3]=O());F=!0}},Fe=t=>{k.length<Wt&&k.push({carry:0,after:0,wiggle:0,branch:0,...t})},Ft=(t,n)=>{const e=pe(t,n);if(e<0)return;const r=Math.floor(e/a.cols),i=a.cols*a.cellW;for(let s=-2;s<=2;s++){const l=r+s;if(l<0||l>=a.rows)continue;const x=1-Math.abs(s)/3;if(s!==0&&Math.random()>.3+.6*x)continue;const w=O(),h=a.originY+(l+.5)*a.cellH,f=(Math.random()-.5)*6*a.cellW*(1-x);[0,Math.PI].forEach(m=>{const d=i*(.12+.5*x*(.4+.6*Math.random()));Fe({x:t+f,y:h,angle:m,life:d,span:d,speed:(2200+Math.random()*1200)*M.ratio,after:Math.abs(s)*.035+Math.random()*.03,color:w})})}},St=(t,n)=>{const e=Math.min(M.width,M.height)*M.ratio,r=5+(Math.random()*3|0),i=Math.random()*Math.PI*2;for(let s=0;s<r;s++){const l=e*(.25+Math.random()*.3);Fe({x:t,y:n,angle:i+s/r*Math.PI*2+(Math.random()-.5)*.4,life:l,span:l,speed:(700+Math.random()*400)*M.ratio,wiggle:.2,branch:.03,color:O()})}},_t=(t,n)=>{const e=pe(t,n);e<0||(j(e,1,.08,.8,O()),T.current.clickEffect==="burst"?St(t,n):Ft(t,n))},Pt=t=>{for(let n=k.length-1;n>=0;n--){const e=k[n];if(e.after>0){e.after-=t;continue}const r=Math.max(1,Math.abs(Math.cos(e.angle))*a.cellW+Math.abs(Math.sin(e.angle))*a.cellH*.6);for(e.carry+=e.speed*t;e.carry>=r&&e.life>0;){e.carry-=r,e.life-=r,e.angle+=(Math.random()-.5)*e.wiggle,e.x+=Math.cos(e.angle)*r,e.y+=Math.sin(e.angle)*r;const i=pe(e.x,e.y);if(i<0){e.life=0;break}const s=e.life/e.span;if(j(i,.5+.5*s,.03+Math.random()*.05,.5+.5*s,e.color),e.branch&&Math.random()<e.branch){const l=Math.random()<.5?-1:1,x=e.life*(.45+Math.random()*.3);Fe({x:e.x,y:e.y,angle:e.angle+l*(.5+Math.random()*.5),life:x,span:e.span,speed:e.speed,wiggle:e.wiggle,color:e.color})}}e.life<=0&&k.splice(n,1)}},Lt=t=>{const n=T.current;if(X||n.speed<=0||!R)return;Re+=R*Ot*n.speed*t;let e=Math.min(R,Re|0);for(Re-=e;e-- >0;){const s=Math.random()*R|0;B[s]<0&&(y[s*4]=oe(),F=!0)}const r=Math.max(n.speed,.2);Ae+=R*n.glitchAmount**1.6*Gt*n.speed*t;let i=Math.min(R,Ae|0);for(Ae-=i;i-- >0;){const s=Math.random()*R|0,l=O(),x=.45+.55*Math.random(),w=(.04+Math.random()*.26)/r,h=(.45+Math.random()*.6)/r,f=Math.random();if(f<.24){const m=s%a.cols,d=f<.015,A=Math.min(a.cols-m,d?10+(Math.random()*24|0):2+(Math.random()*7|0)),C=(d?.012:.028)/r;for(let _=0;_<A;_++)j(s+_,x,w,h,l,_*C)}else j(s,x,w,h,l)}},Dt=t=>{const n=T.current;if(c.presence<.02||X||!R)return;const e=n.cursorRadius*M.ratio;if(e<1)return;const r=Math.max(0,Math.floor((c.sx-e-a.originX)/a.cellW)),i=Math.min(a.cols-1,Math.floor((c.sx+e-a.originX)/a.cellW)),s=Math.max(0,Math.floor((c.sy-e-a.originY)/a.cellH)),l=Math.min(a.rows-1,Math.floor((c.sy+e-a.originY)/a.cellH)),x=c.presence*(3+9*c.stir)*t;for(let f=s;f<=l;f++){const m=(a.originY+(f+.5)*a.cellH-c.sy)/e;for(let d=r;d<=i;d++){const A=(a.originX+(d+.5)*a.cellW-c.sx)/e,C=A*A+m*m;if(C>=1)continue;const _=f*a.cols+d;B[_]<0&&Math.random()<(1-C)*(1-C)*x&&(y[_*4]=oe(),F=!0)}}const w=Math.PI*e*e/(a.cellW*a.cellH);Ce+=w*c.presence*(.15+4*c.stir)*t;let h=Math.min(512,Ce|0);for(Ce-=h;h-- >0;){const f=Math.random()*Math.PI*2,m=Math.sqrt(Math.random()),d=(1-m*m)**2;if(Math.random()>d)continue;const A=pe(c.sx+Math.cos(f)*m*e,c.sy+Math.sin(f)*m*e);A<0||j(A,(.3+.7*Math.random())*(.45+.55*c.stir),.02+Math.random()*.08,.35+Math.random()*.4,O())}},It=t=>{const n=T.current,e=Math.max(n.speed,.5),r=1-Math.exp(-t/.05);for(let i=0;i<z;){const s=Y[i];if(N[s]>0){N[s]-=t,i++;continue}let l=W[s];if(U[s]>0?(U[s]-=t,l=n.smooth?l+(H[s]-l)*r:H[s]):l=n.smooth?l*Math.exp(-t*4/Math.max(te[s],.05)):0,l<.012&&U[s]<=0){Rt(i),F=!0;continue}W[s]=l,ne[s]-=t,ne[s]<=0&&(y[s*4]=oe(),ne[s]=(.045+.45*(1-l)*(1-l))*(.6+.8*Math.random())/e),y[s*4+2]=Math.round(l*255),F=!0,i++}},Ut=t=>{if(!me)return;const n=T.current;let e=!1;for(let r=0;r<R;r++){const i=q[r];if(i<0)continue;const s=He-i;if(s<0){e=!0;continue}s<t&&Math.random()<(he[r]<n.density?.45:.12)&&j(r,.4+.5*Math.random(),.02,.35+Math.random()*.35,O());const l=n.smooth?qt(s/.35):1;y[r*4+1]=be(r,l),l>=1?q[r]=-1:e=!0}F=!0,e||(me=!1)};let Se=0;const _e=t=>{if(V=0,!de||document.hidden)return;const n=T.current,e=c.presence>.02?Math.max(n.maxFps,40):n.maxFps;if(Se&&t-Se<1e3/e-1){V=requestAnimationFrame(_e);return}Se=t;const r=$?b((t-$)/1e3,5e-4,.05):1/60;if($=t,He+=r,X||(Ne+=r*n.speed),ze(),bt(),n.density!==Te){Te=n.density;for(let f=0;f<R;f++)q[f]<0&&(y[f*4+1]=be(f));F=!0}const i=n.interactive&&c.inside&&!X?1:0;c.presence+=(i-c.presence)*(1-Math.exp(-r/.25)),Math.abs(i-c.presence)<.002&&(c.presence=i);const s=c.sx,l=c.sy,x=1-Math.exp(-r/.07);c.sx+=(c.x-c.sx)*x,c.sy+=(c.y-c.sy)*x;const w=Math.hypot(c.sx-s,c.sy-l)/M.ratio/r;if(c.stir+=(b(w/1400,0,1)-c.stir)*(1-Math.exp(-r/.12)),c.stir<.001&&(c.stir=0),Ut(r),Lt(r),Dt(r),Pt(r),It(r),o.viewport(0,0,v.width,v.height),o.disable(o.BLEND),o.useProgram(ce.program),o.bindVertexArray(ke),o.activeTexture(o.TEXTURE1),o.bindTexture(o.TEXTURE_2D,ye),F&&(o.texSubImage2D(o.TEXTURE_2D,0,0,0,a.cols,a.rows,o.RGBA,o.UNSIGNED_BYTE,y),F=!1),o.uniform1i(p.uState,1),o.activeTexture(o.TEXTURE0),o.bindTexture(o.TEXTURE_2D,ve),o.uniform1i(p.uAtlas,0),o.uniform2i(p.uCell,a.cellW,a.cellH),o.uniform2i(p.uGrid,a.cols,a.rows),o.uniform1i(p.uAtlasColumns,a.atlasColumns),o.uniform2f(p.uResolution,v.width,v.height),o.uniform2f(p.uOrigin,a.originX,a.originY),o.uniform3fv(p.uBase,we(n.baseColor)),o.uniform1f(p.uBaseOpacity,n.baseOpacity),o.uniform3fv(p.uColors,le),o.uniform1f(p.uEdge,n.edgeFade*Math.min(v.width,v.height)),o.uniform1f(p.uCenter,n.centerFade),o.uniform2f(p.uPointer,c.sx,c.sy),o.uniform1f(p.uRadius,Math.max(1,n.cursorRadius*M.ratio)),o.uniform1f(p.uRepel,n.repel),o.uniform1f(p.uPresence,c.presence),o.uniform1f(p.uReveal,Math.min(1,n.baseOpacity*3.5)),o.uniform1f(p.uTime,Ne),o.uniform1f(p.uFlow,n.flow),o.uniform1f(p.uFlowScale,Math.max(v.width,v.height)*.32),n.backgroundColor){const[f,m,d]=we(n.backgroundColor);o.uniform4f(p.uBackground,f,m,d,1)}else o.uniform4f(p.uBackground,0,0,0,0);o.drawArrays(o.TRIANGLES,0,3),!X&&n.speed>0||z>0||k.length>0||me||c.presence!==0&&c.presence!==1||c.stir>0?V=requestAnimationFrame(_e):$=0};function I(){!V&&de&&!document.hidden&&(V=requestAnimationFrame(_e))}const Ve=()=>{const t=T.current;M.width=Math.max(1,L.clientWidth),M.height=Math.max(1,L.clientHeight),M.ratio=Math.min(t.dpr||window.devicePixelRatio||1,2),v.width=Math.max(1,Math.round(M.width*M.ratio)),v.height=Math.max(1,Math.round(M.height*M.ratio)),ze(),a.cols&&Ye(),I()},$e=t=>{const n=L.getBoundingClientRect(),e=t.clientX-n.left,r=t.clientY-n.top;c.inside=e>=0&&r>=0&&e<=n.width&&r<=n.height,c.x=e*M.ratio,c.y=r*M.ratio,(c.fresh||c.presence<.02)&&(c.sx=c.x,c.sy=c.y,c.fresh=!1)},je=t=>{$e(t),I()},Ke=t=>{$e(t);const n=T.current;!c.inside||n.clickEffect==="none"||X||!R||(_t(c.x,c.y),I())},xe=t=>{t.pointerType!=="mouse"&&(c.inside=!1)},Je=()=>{c.inside=!1,I()},Ze=()=>{$=0,I()},Qe=()=>{ue="",I()},et=new ResizeObserver(Ve);et.observe(L);const tt=new IntersectionObserver(t=>{de=t.some(n=>n.isIntersecting),de&&($=0,I())});return tt.observe(L),window.addEventListener("pointermove",je,{passive:!0}),window.addEventListener("pointerdown",Ke,{passive:!0}),window.addEventListener("pointerup",xe,{passive:!0}),window.addEventListener("pointercancel",xe,{passive:!0}),document.documentElement.addEventListener("pointerleave",Je),document.addEventListener("visibilitychange",Ze),(ot=(ge=document.fonts)==null?void 0:ge.addEventListener)==null||ot.call(ge,"loadingdone",Qe),Ve(),Q.current=I,()=>{var t,n,e;qe=!1,cancelAnimationFrame(V),Q.current=null,et.disconnect(),tt.disconnect(),window.removeEventListener("pointermove",je),window.removeEventListener("pointerdown",Ke),window.removeEventListener("pointerup",xe),window.removeEventListener("pointercancel",xe),document.documentElement.removeEventListener("pointerleave",Je),document.removeEventListener("visibilitychange",Ze),(n=(t=document.fonts)==null?void 0:t.removeEventListener)==null||n.call(t,"loadingdone",Qe),o.deleteTexture(ve),o.deleteTexture(ye),o.deleteVertexArray(ke),o.deleteProgram(ce.program),(e=o.getExtension("WEBGL_lose_context"))==null||e.loseContext()}},[]),J.useEffect(()=>{var L;(L=Q.current)==null||L.call(Q)}),rt.jsx("div",{ref:Ie,className:`letter-glitch${De?` ${De}`:""}`,style:wt,...Et,children:rt.jsx("canvas",{ref:Ue,className:"letter-glitch-canvas","aria-hidden":"true"})})};export{$t as default};
