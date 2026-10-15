/* Step-based indoor position estimate. This is not absolute indoor positioning. */
(function(root){
  const MAP_ASPECT=1580/1370;
  const distance=(a,b)=>Math.hypot((a.x-b.x)*MAP_ASPECT,a.y-b.y);
  const bearing=(a,b)=>(Math.atan2((b.x-a.x)*MAP_ASPECT,a.y-b.y)*180/Math.PI+360)%360;
  const advance=(point,mapHeading,unit)=>{
    const radians=mapHeading*Math.PI/180;
    return {
      x:Math.max(0,Math.min(100,point.x+Math.sin(radians)*unit/MAP_ASPECT)),
      y:Math.max(0,Math.min(100,point.y-Math.cos(radians)*unit))
    };
  };
  function createStepDetector(){
    let baseline=null,armed=true,lastStep=-Infinity;
    return {
      feed(sample,time){
        if(!sample||![sample.x,sample.y,sample.z].every(Number.isFinite))return false;
        const magnitude=Math.hypot(sample.x,sample.y,sample.z);
        if(baseline===null){baseline=magnitude;return false}
        baseline=baseline*0.9+magnitude*0.1;
        const pulse=magnitude-baseline;
        if(pulse<0.2)armed=true;
        if(armed&&pulse>0.9&&time-lastStep>=340){
          armed=false;
          lastStep=time;
          return true;
        }
        return false;
      },
      reset(){baseline=null;armed=true;lastStep=-Infinity}
    };
  }
  const api={distance,bearing,advance,createStepDetector};
  root.BookgilMotion=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
