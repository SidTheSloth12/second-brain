import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { fetchGraph } from '../../lib/notesApi'
import ForceGraph2D, { type ForceGraphMethods } from 'react-force-graph-2d'
import { useCallback, useEffect, useRef, useState } from 'react'
import { MinimalSpinner } from '../../components/Loaders'

// Detect theme from <html> class
function isDarkMode() {
  return document.documentElement.classList.contains('dark')
}

export function NotesGraphPage() {
  const navigate = useNavigate()
  const fgRef = useRef<ForceGraphMethods | undefined>(undefined)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const containerRef = useRef<HTMLDivElement>(null)
  const [dark, setDark] = useState(isDarkMode)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['notes-graph'],
    queryFn: fetchGraph,
  })

  // Sync dark mode
  useEffect(() => {
    const observer = new MutationObserver(() => setDark(isDarkMode()))
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  // Resize graph on container resize
  useEffect(() => {
    function updateSize() {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        })
      }
    }

    const ro = new ResizeObserver(updateSize)
    if (containerRef.current) ro.observe(containerRef.current)
    updateSize()
    return () => ro.disconnect()
  }, [])

  // Click a node → navigate to that note
  const handleNodeClick = useCallback(
    (node: any) => {
      if (node.id) {
        navigate(`/notes/${node.id}`)
      }
    },
    [navigate]
  )

  // Theme-aware colors
  const bgColor = dark ? '#0f172a' : '#f8fafc'
  const nodeFill = dark ? '#7c3aed' : '#6d28d9'
  const nodeStroke = dark ? '#a78bfa' : '#8b5cf6'
  const linkColor = dark ? '#334155' : '#cbd5e1'
  const labelBg = dark ? 'rgba(15,23,42,0.85)' : 'rgba(255,255,255,0.92)'
  const labelColor = dark ? '#e2e8f0' : '#1e293b'

  // Custom node renderer — draws a circle + permanent label below
  const nodeCanvasObject = useCallback(
    (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const radius = 6
      const x = node.x ?? 0
      const y = node.y ?? 0

      // Node circle
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, 2 * Math.PI)
      ctx.fillStyle = nodeFill
      ctx.fill()
      ctx.strokeStyle = nodeStroke
      ctx.lineWidth = 1.5 / globalScale
      ctx.stroke()

      // Permanent label below the node
      const label = node.title || 'Untitled'
      const fontSize = Math.max(8, 11 / globalScale)
      ctx.font = `${fontSize}px Inter, system-ui, sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'

      const textWidth = ctx.measureText(label).width
      const padX = 4 / globalScale
      const padY = 3 / globalScale
      const labelX = x
      const labelY = y + radius + 4 / globalScale

      // Label background pill
      const bgW = textWidth + padX * 2
      const bgH = fontSize + padY * 2
      const r = 3 / globalScale
      ctx.fillStyle = labelBg
      ctx.beginPath()
      ctx.roundRect(labelX - bgW / 2, labelY - padY, bgW, bgH, r)
      ctx.fill()

      // Label text
      ctx.fillStyle = labelColor
      ctx.fillText(label, labelX, labelY)
    },
    [nodeFill, nodeStroke, labelBg, labelColor]
  )

  // Make the node easily clickable by returning a perfectly centered hit area
  const nodePointerAreaPaint = useCallback(
    (node: any, color: string, ctx: CanvasRenderingContext2D) => {
      const radius = 6
      const x = node.x ?? 0
      const y = node.y ?? 0

      // Perfectly center the hit area over the node's physical coordinate
      ctx.beginPath()
      ctx.arc(x, y, radius + 10, 0, 2 * Math.PI)
      ctx.fillStyle = color
      ctx.fill()
    },
    []
  )

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-50 dark:bg-slate-950">
        <MinimalSpinner />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="flex h-full items-center justify-center text-red-500">
        Failed to load graph data.
      </div>
    )
  }

  const isEmpty = data.nodes.length === 0

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Knowledge Graph</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {isEmpty
            ? 'Create some notes with [[wiki-links]] to see connections.'
            : `${data.nodes.length} notes · ${data.links.length} connections — click a node to open the note`}
        </p>
      </div>

      {/* Graph canvas */}
      <div
        className="relative flex-1 overflow-hidden"
        ref={containerRef}
        style={{ background: bgColor }}
      >
        {isEmpty ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-slate-400 dark:text-slate-600">No notes to visualise yet.</p>
          </div>
        ) : (
          <ForceGraph2D
            ref={fgRef}
            width={dimensions.width}
            height={dimensions.height}
            backgroundColor={bgColor}
            graphData={data}
            // Hide built-in label (we draw our own)
            nodeLabel={() => ''}
            nodeAutoColorBy={undefined}
            nodeCanvasObject={nodeCanvasObject}
            nodeCanvasObjectMode={() => 'replace'}
            nodePointerAreaPaint={nodePointerAreaPaint}
            onNodeClick={handleNodeClick}
            linkColor={() => linkColor}
            linkWidth={1.2}
            linkDirectionalArrowLength={4}
            linkDirectionalArrowRelPos={1}
            linkCurvature={0.15}
            nodeRelSize={6}
            cooldownTicks={200}
            // Make hovering show a pointer cursor
            onNodeHover={(node) => {
              if (containerRef.current) {
                containerRef.current.style.cursor = node ? 'pointer' : 'default'
              }
            }}
          />
        )}
      </div>
    </div>
  )
}
