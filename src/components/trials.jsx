import React, { useEffect, useRef, useState } from "react";
import { loadFont } from '../utils/fondLoader';
import * as THREE from 'three';


function artist(text,individualDimensions, canvasRef, font, ctx){
  const lines = text.split('\n');
  const fontSize = 20;
  const lineHeight = fontSize * 1.2;
  const totalHeight = lines.length * lineHeight;
  if (!font || !canvasRef.current) return;
  else{
      const ascent = (font.ascender && font.unitsPerEm)
        ? (font.ascender * fontSize / font.unitsPerEm)
        : fontSize * 0.8;

      const firstBaselineY = 100
      + (individualDimensions.height - totalHeight) / 2 
      + ascent;
      
      lines.forEach((line, i) => {
        const textWidth = font.getAdvanceWidth(line, fontSize);
        const centeredX = individualDimensions.x + (individualDimensions.width - textWidth) / 2;
        
        const y = firstBaselineY + i * lineHeight
        const x = centeredX
        
        let path = font.getPath(line,x, y, fontSize);
        path.draw(ctx);
      });
    }

}
export default function Smolder({ font, text, gridDimensions }) {
  //text is a dictionary
  const canvasRef = useRef();
  
  

  useEffect(() => {
    if(font){
      for (let i = 0; i < gridDimensions.length; i ++){
        const category = text[i].category;
        const data = text[i].items;
        
        const ctx = canvasRef.current.getContext("2d");
        gridDimensions[i].x = gridDimensions[i].x + i * 200
        
        artist(data, gridDimensions[i],canvasRef,font, ctx)
      }
    }
  }, [font, text]);

  return (
    <canvas
      id = "Skills"
      ref={canvasRef}
      width={window.innerWidth}
      height={window.innerHeight}
      style={{
        position: "absolute",
        zIndex: 100,
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh"
      }}
    />
  );
}