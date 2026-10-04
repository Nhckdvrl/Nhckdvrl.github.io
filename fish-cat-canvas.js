import * as THREE from './assets/vendor/three.module.min.js';

// Compact CPU rasterizer for devices without WebGL. Same 3D meshes, curved
// texture mapping, interpolated lighting, and per-pixel depth as the main view.
export class CanvasPetRenderer {
  constructor() {
    this.domElement=document.createElement('canvas');
    this.context=this.domElement.getContext('2d',{alpha:true});
    if(!this.context)throw new Error('Canvas rendering is unavailable');
    this.capabilities={getMaxAnisotropy:()=>1};this.ratio=1;this.software=true;
    this.vector=new THREE.Vector3();this.normal=new THREE.Vector3();
    this.mvp=new THREE.Matrix4();this.vp=new THREE.Matrix4();this.nm=new THREE.Matrix3();
    this.light=new THREE.Vector3(-.4,.65,.8).normalize();this.fill=new THREE.Vector3(.7,.2,.4).normalize();
    this.color=new THREE.Color();this.caches=new WeakMap();this.textures=new WeakMap();
  }
  setPixelRatio(ratio){this.ratio=Math.min(ratio,1.25);}
  setClearColor(){}
  setSize(w,h){this.domElement.width=Math.max(1,Math.round(w*this.ratio));this.domElement.height=Math.max(1,Math.round(h*this.ratio));this.pixels=this.context.createImageData(this.domElement.width,this.domElement.height);this.depth=new Float32Array(this.domElement.width*this.domElement.height);}
  dispose(){this.caches=new WeakMap();this.textures=new WeakMap();}
  render(scene,camera){
    const w=this.domElement.width,h=this.domElement.height,data=this.pixels.data,depth=this.depth;data.fill(0);depth.fill(Infinity);
    scene.updateMatrixWorld();camera.updateMatrixWorld();this.vp.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);
    const triangles=[];
    scene.traverse(mesh=>{
      if(!mesh.isMesh||!mesh.visible||!mesh.geometry||!mesh.material||mesh.material.opacity===0)return;
      let parent=mesh.parent;while(parent){if(!parent.visible)return;parent=parent.parent;}
      const g=mesh.geometry,m=mesh.material,p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv,vc=g.attributes.color;if(Array.isArray(m))return;
      this.mvp.multiplyMatrices(this.vp,mesh.matrixWorld);this.nm.getNormalMatrix(mesh.matrixWorld);
      let cache=this.caches.get(mesh);if(!cache||cache.length!==p.count){cache=Array.from({length:p.count},()=>({x:0,y:0,z:0,r:0,g:0,b:0,u:0,v:0}));this.caches.set(mesh,cache);}
      let texture=null;
      if(m.map?.image){const image=m.map.image;texture=this.textures.get(image);if(!texture){const src=image.getContext('2d').getImageData(0,0,image.width,image.height);texture={width:src.width,height:src.height,data:src.data};this.textures.set(image,texture);}}
      for(let i=0;i<p.count;i++){
        const q=cache[i];this.vector.fromBufferAttribute(p,i).applyMatrix4(this.mvp);q.x=(this.vector.x*.5+.5)*w;q.y=(-this.vector.y*.5+.5)*h;q.z=this.vector.z;
        let light=1;if(n&&!m.isMeshBasicMaterial){this.normal.fromBufferAttribute(n,i).applyNormalMatrix(this.nm);light=.73+Math.max(0,this.normal.dot(this.light))*.26+Math.max(0,this.normal.dot(this.fill))*.07;}
        if(vc)this.color.fromBufferAttribute(vc,i);else this.color.copy(m.color);this.color.convertLinearToSRGB();q.r=Math.min(255,this.color.r*255*light);q.g=Math.min(255,this.color.g*255*light);q.b=Math.min(255,this.color.b*255*light);
        if(uv){q.u=uv.getX(i);q.v=1-uv.getY(i);}
      }
      const ix=g.index?.array,len=ix?ix.length:p.count;
      for(let j=0;j<len;j+=3){const a=cache[ix?ix[j]:j],b=cache[ix?ix[j+1]:j+1],c=cache[ix?ix[j+2]:j+2];const area=(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);if(area>=-.00001)continue;triangles.push({a,b,c,area,z:(a.z+b.z+c.z)/3,texture,alpha:m.opacity,write:m.depthWrite});}
    });
    triangles.sort((a,b)=>b.z-a.z);
    for(const t of triangles){
      const {a,b,c,texture}=t;
      const minx=Math.max(0,Math.floor(Math.min(a.x,b.x,c.x))),maxx=Math.min(w-1,Math.ceil(Math.max(a.x,b.x,c.x))),miny=Math.max(0,Math.floor(Math.min(a.y,b.y,c.y))),maxy=Math.min(h-1,Math.ceil(Math.max(a.y,b.y,c.y)));
      const den=(b.y-c.y)*(a.x-c.x)+(c.x-b.x)*(a.y-c.y),inv=1/den;
      for(let y=miny;y<=maxy;y++)for(let x=minx;x<=maxx;x++){
        const aa=((b.y-c.y)*(x+.5-c.x)+(c.x-b.x)*(y+.5-c.y))*inv;
        const bb=((c.y-a.y)*(x+.5-c.x)+(a.x-c.x)*(y+.5-c.y))*inv;const cc=1-aa-bb;if(aa<-.0001||bb<-.0001||cc<-.0001)continue;
        const z=aa*a.z+bb*b.z+cc*c.z,di=y*w+x;if(z>depth[di]+.00001)continue;
        let r=aa*a.r+bb*b.r+cc*c.r,g=aa*a.g+bb*b.g+cc*c.g,bv=aa*a.b+bb*b.b+cc*c.b,alpha=t.alpha;
        if(texture){const tx=Math.max(0,Math.min(texture.width-1,Math.round((aa*a.u+bb*b.u+cc*c.u)*(texture.width-1)))),ty=Math.max(0,Math.min(texture.height-1,Math.round((aa*a.v+bb*b.v+cc*c.v)*(texture.height-1))));const si=(ty*texture.width+tx)*4;r=texture.data[si];g=texture.data[si+1];bv=texture.data[si+2];alpha*=texture.data[si+3]/255;}
        if(alpha<.003)continue;
        const i=di*4,oldAlpha=data[i+3]/255,outAlpha=alpha+oldAlpha*(1-alpha),back=oldAlpha*(1-alpha);data[i]=(r*alpha+data[i]*back)/outAlpha;data[i+1]=(g*alpha+data[i+1]*back)/outAlpha;data[i+2]=(bv*alpha+data[i+2]*back)/outAlpha;data[i+3]=outAlpha*255;
        if(t.write)depth[di]=z;
      }
    }
    this.context.putImageData(this.pixels,0,0);
  }
}
