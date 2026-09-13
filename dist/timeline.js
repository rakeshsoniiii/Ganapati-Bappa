export function chapterAt(scroll,offsets,lastHeight){
  let index=0;for(let i=1;i<offsets.length;i++)if(scroll>=offsets[i])index=i;
  const height=(offsets[index+1]??offsets[index]+lastHeight)-offsets[index];
  return{index,local:Math.max(0,Math.min(1,(scroll-offsets[index])/height))};
}
export function chapterOpacity(index,local,reduced){
  if(reduced||index===11)return 1;
  return Math.min(1,index===0?1:.3+local*7,Math.max(0,(.74-local)*6));
}
