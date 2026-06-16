import { useQuery } from'@tanstack/react-query'
import { useNavigate } from'react-router-dom'
import { fetchGraph } from'../../lib/notesApi'
import ForceGraph2D, { type ForceGraphMethods } from'react-force-graph-2d'
import { useCallback, useEffect, useMemo, useRef, useState } from'react'
import { MinimalSpinner } from'../../components/Loaders'
function isDarkMode() {
 return document.documentElement.classList.contains('dark')
}
export function NotesGraphPage() {
 const navigate=useNavigate()
 const fgRef=useRef<ForceGraphMethods | undefined>(undefined)
 const [dimensions, setDimensions]=useState({ width: 800, height: 600 })
 const containerRef=useRef<HTMLDivElement>(null)
 const [dark, setDark]=useState(isDarkMode)
 const { data, isLoading, isError }=useQuery({
 queryKey: ['notes-graph'],
 queryFn: fetchGraph,
 })
 const graphData=useMemo(()=>{
 if (!data) return undefined
 return {
 nodes: [{ id:'__dummy_hit_fix_node__', title:'' }, ...data.nodes],
 links: data.links,
 }
 }, [data])
 useEffect(()=>{
 const observer=new MutationObserver(()=>setDark(isDarkMode()))
 observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
 return ()=>observer.disconnect()
 }, [])
 useEffect(()=>{
 function updateSize() {
 if (containerRef.current) {
 setDimensions({
 width: containerRef.current.clientWidth,
 height: containerRef.current.clientHeight,
 })
 }
 }
 const ro=new ResizeObserver(updateSize)
 if (containerRef.current) ro.observe(containerRef.current)
 updateSize()
 return ()=>ro.disconnect()
 }, [])
 const handleNodeClick=useCallback(
 (node: any)=>{
 if (node.id) {
 navigate(`/notes/${node.id}`)
 }
 },
 [navigate]
 )
 const bgColor=dark ?'#0f172a' :'#f8fafc'
 const nodeFill=dark ?'#7c3aed' :'#6d28d9'
 const nodeStroke=dark ?'#a78bfa' :'#8b5cf6'
 const linkColor=dark ?'#334155' :'#cbd5e1'
 const labelBg=dark ?'rgba(15, 23, 42, 0.85)' :'rgba(255, 255, 255, 0.92)'
 const labelColor=dark ?'#e2e8f0' :'#1e293b'
 const nodeCanvasObject=useCallback(
 (node: any, ctx: CanvasRenderingContext2D, globalScale: number)=>{
 if (node.id==='__dummy_hit_fix_node__') return
 const radius=6
 const x=node.x ?? 0
 const y=node.y ?? 0
 ctx.beginPath()
 ctx.arc(x, y, radius, 0, 2*Math.PI)
 ctx.fillStyle=nodeFill
 ctx.fill()
 ctx.strokeStyle=nodeStroke
 ctx.lineWidth=1.5/globalScale
 ctx.stroke()
 const label=node.title ||'Untitled'
 const fontSize=Math.max(8, 11/globalScale)
 ctx.font =`${fontSize}px Inter, system-ui, sans-serif`
 ctx.textAlign ='center'
 ctx.textBaseline ='top'
 const textWidth=ctx.measureText(label).width
 const padX=4/globalScale
 const padY=3/globalScale
 const labelX=x
 const labelY=y+radius+4/globalScale
 const bgW=textWidth+padX*2
 const bgH=fontSize+padY*2
 const r=3/globalScale
 ctx.fillStyle=labelBg
 ctx.beginPath()
 ctx.roundRect(labelX-bgW/2, labelY-padY, bgW, bgH, r)
 ctx.fill()
 ctx.fillStyle=labelColor
 ctx.fillText(label, labelX, labelY)
 },
 [nodeFill, nodeStroke, labelBg, labelColor]
 )
 const nodePointerAreaPaint=useCallback(
 (node: any, color:string, ctx: CanvasRenderingContext2D, globalScale: number)=>{
 if (node.id==='__dummy_hit_fix_node__') return
 const radius=6
 const x=node.x ?? 0
 const y=node.y ?? 0
 ctx.fillStyle=color
 ctx.beginPath()
 ctx.arc(x, y, radius+2, 0, 2*Math.PI)
 ctx.fill()
 const label=node.title ||'Untitled'
 const fontSize=Math.max(8, 11/globalScale)
 ctx.font =`${fontSize}px Inter, system-ui, sans-serif`
 const textWidth=ctx.measureText(label).width
 const padX=4/globalScale
 const padY=3/globalScale
 const labelY=y+radius+4/globalScale
 const bgW=textWidth+padX*2
 const bgH=fontSize+padY*2
 ctx.fillRect(x-bgW/2, labelY-padY, bgW, bgH)
 },
 []
 )
 if (isLoading) {
 return (
 <div className ="flex h-full items-center justify-center bg-slate-50 dark:bg-slate-950">
 <MinimalSpinner/>
 </div>
 )
 }
 if (isError||!data||!graphData) {
 return (
 <div className ="flex h-full items-center justify-center text-red-500">
 Failed to load graph data.
 </div>
 )
 }
 const isEmpty=graphData.nodes.length<=1
 return (
 <div className ="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
 {}
 <div className ="border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
 <h2 className ="text-lg font-semibold text-slate-900 dark:text-slate-100">Knowledge Graph</h2>
 <p className ="text-sm text-slate-500 dark:text-slate-400">
 {isEmpty
 ?'Create some notes with [[wiki-links]] to see connections.'
 :`${graphData.nodes.length - 1} notes · ${graphData.links.length} connections — click a node to open the note`}
 </p>
 </div>
 {}
 <div
 className ="relative flex-1 overflow-hidden"
 ref={containerRef}
 style={{ background: bgColor }}
 >
 {isEmpty ? (
 <div className ="flex h-full items-center justify-center">
 <p className ="text-slate-400 dark:text-slate-600">No notes to visualise yet.</p>
 </div>
 ) : (
 <ForceGraph2D
 ref={fgRef}
 width={dimensions.width}
 height={dimensions.height}
 backgroundColor={bgColor}
 graphData={graphData}
 nodeLabel={()=>''}
 nodeAutoColorBy={undefined}
 nodeCanvasObject={nodeCanvasObject}
 nodeCanvasObjectMode={()=>'replace'}
 nodePointerAreaPaint={nodePointerAreaPaint}
 onNodeClick={handleNodeClick}
 linkColor={()=>linkColor}
 linkWidth={1.2}
 linkDirectionalArrowLength={4}
 linkDirectionalArrowRelPos={1}
 linkCurvature={0.15}
 nodeRelSize={6}
 cooldownTicks={200}
 onNodeHover={(node)=>{
 if (containerRef.current) {
 containerRef.current.style.cursor=node ?'pointer' :'default'
 }
 }}
 />
 )}
 </div>
 </div>
 )
}