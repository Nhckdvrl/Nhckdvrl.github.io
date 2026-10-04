import * as THREE from './assets/vendor/three.module.min.js';

// Small, dependency-free CPU rasterizer for browsers that cannot create WebGL.
// It projects the SAME 3D meshes and face texture; the SVG is the final fallback.
export class CanvasPetRenderer {
  constructor() {
    this.domElement=document.createElement('canvas');
    this.context=this.domElement.getContext('2d',{alpha:true});
    if(!this.context)throw new Error('Canvas rendering is unavailable');
    this.capabilities={getMaxAnisotropy:()=>1};this.ratio=1;this.software=true;
    this.vector=new THREE.Vector3();this.normal=new THREE.Vector3();
    this.mvp=new THREE.Matrix4();this.vp=new THREE.Matrix4();this.nm=new THREE.Matrix3();
    this.light=new THREE.Vector3(-.4,.65,.8).normalize();
    this.fill=new THREE.Vector3(.7,.2,.4).normalize();
    this.color=new THREE.Color();this.caches=new WeakMap();
  }
  setPixelRatio(ratio){this.ratio=Math.min(ratio,1.5);}
  setClearColor(){}
  setSize(w,h){this.domElement.width=Math.max(1,Math.round(w*this.ratio));this.domElement.height=Math.max(1,Math.round(h*this.ratio));}
  dispose(){this.caches=new WeakMap();}
  render(scene,camera){
    const ctx=this.context,w=this.domElement.width,h=this.domElement.height;
    ctx.clearRect(0,0,w,h);scene.updateMatrixWorld();camera.updateMatrixWorld();
    this.vp.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);
    const triangles=[];
    scene.traverse(mesh=>{
      if(!mesh.isMesh||!mesh.visible||!mesh.geometry||!mesh.material||mesh.material.opacity===0)return;
      let parent=mesh.parent;while(parent){if(!parent.visible)return;parent=parent.parent;}
      const g=mesh.geometry,m=mesh.material,p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv,vc=g.attributes.color;
      if(Array.isArray(m))return;
      this.mvp.multiplyMatrices(this.vp,mesh.matrixWorld);this.nm.getNormalMatrix(mesh.matrixWorld);
      let cache=this.caches.get(mesh);if(!cache||cache.points.length!==p.count){cache={points:Array.from({length:p.count},()=>({x:0,y:0,z:0,l:1}))};this.caches.set(mesh,cache);}
      const points=cache.points;
      for(let i=0;i<p.count;i++){
        this.vector.fromBufferAttribute(p,i).applyMatrix4(this.mvp);const q=points[i];q.x=(this.vector.x*.5+.5)*w;q.y=(-this.vector.y*.5+.5)*h;q.z=this.vector.z;
        if(n&&!m.isMeshBasicMaterial){this.normal.fromBufferAttribute(n,i).applyNormalMatrix(this.nm);q.l=.73+Math.max(0,this.normal.dot(this.light))*.26+Math.max(0,this.normal.dot(this.fill))*.07;}
      }
      const ix=g.index?g.index.array:null,len=ix?ix.length:p.count;
      for(let j=0;j<len;j+=3){
        const ai=ix?ix[j]:j,bi=ix?ix[j+1]:j+1,ci=ix?ix[j+2]:j+2,a=points[ai],b=points[bi],c=points[ci];
        if((b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x)>=0)continue;
        const image=m.map?.image;
        let fill;
        if(!image){
          if(vc)this.color.setRGB((vc.getX(ai)+vc.getX(bi)+vc.getX(ci))/3,(vc.getY(ai)+vc.getY(bi)+vc.getY(ci))/3,(vc.getZ(ai)+vc.getZ(bi)+vc.getZ(ci))/3);
          else this.color.copy(m.color||new THREE.Color(0xffffff));
          this.color.convertLinearToSRGB();const light=m.isMeshBasicMaterial?1:(a.l+b.l+c.l)/3;
          fill=`rgb(${Math.min(255,Math.round(this.color.r*255*light))},${Math.min(255,Math.round(this.color.g*255*light))},${Math.min(255,Math.round(this.color.b*255*light))})`;
        }
        triangles.push({a,b,c,z:(a.z+b.z+c.z)/3,image,uv,ai,bi,ci,fill,alpha:m.opacity});
      }
    });
    triangles.sort((a,b)=>b.z-a.z);
    for(const t of triangles){
      const {a,b,c}=t;ctx.globalAlpha=t.alpha;
      if(t.image&&t.uv){
        const tw=t.image.width,th=t.image.height;
        const u0=t.uv.getX(t.ai)*tw,v0=(1-t.uv.getY(t.ai))*th,u1=t.uv.getX(t.bi)*tw,v1=(1-t.uv.getY(t.bi))*th,u2=t.uv.getX(t.ci)*tw,v2=(1-t.uv.getY(t.ci))*th;
        const den=u0*(v1-v2)+u1*(v2-v0)+u2*(v0-v1);if(Math.abs(den)<.001)continue;
        const aa=(a.x*(v1-v2)+b.x*(v2-v0)+c.x*(v0-v1))/den,bb=(a.y*(v1-v2)+b.y*(v2-v0)+c.y*(v0-v1))/den;
        const cc=(a.x*(u2-u1)+b.x*(u0-u2)+c.x*(u1-u0))/den,dd=(a.y*(u2-u1)+b.y*(u0-u2)+c.y*(u1-u0))/den;
        const ee=(a.x*(u1*v2-u2*v1)+b.x*(u2*v0-u0*v2)+c.x*(u0*v1-u1*v0))/den,ff=(a.y*(u1*v2-u2*v1)+b.y*(u2*v0-u0*v2)+c.y*(u0*v1-u1*v0))/den;
        ctx.save();ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.lineTo(c.x,c.y);ctx.closePath();ctx.clip();ctx.transform(aa,bb,cc,dd,ee,ff);ctx.drawImage(t.image,0,0);ctx.restore();
      }else{
        const cx=(a.x+b.x+c.x)/3,cy=(a.y+b.y+c.y)/3;
        ctx.fillStyle=t.fill;ctx.beginPath();for(const [i,q]of[a,b,c].entries()){const dx=q.x-cx,dy=q.y-cy,l=Math.hypot(dx,dy)||1;const x=q.x+dx/l*.32,y=q.y+dy/l*.32;if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.closePath();ctx.fill();
      }
    }
    ctx.globalAlpha=1;
  }
}
