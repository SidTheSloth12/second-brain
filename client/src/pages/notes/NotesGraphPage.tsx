import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { fetchGraph } from '../../lib/notesApi'
import ForceGraph2D, { type ForceGraphMethods } from 'react-force-graph-2d'
import { useCallback, useEffect, useRef, useState } from 'react'

export function NotesGraphPage() {
  const navigate = useNavigate()
  const fgRef = useRef<ForceGraphMethods | undefined>(undefined)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const containerRef = useRef<HTMLDivElement>(null)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['notes-graph'],
    queryFn: fetchGraph,
  })

  // Resize graph on window resize
  useEffect(() => {
    function handleResize() {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        })
      }
    }
    window.addEventListener('resize', handleResize)
    handleResize()
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleNodeClick = useCallback(
    (node: any) => {
      if (node.id && node.title) {
        navigate(`/notes/${node.id}`)
      }
    },
    [navigate]
  )

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-slate-500">
        Loading graph data...
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

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl bg-slate-50 border border-slate-200">
      <div className="border-b border-slate-200 bg-white px-4 py-3">
        <h2 className="text-lg font-semibold text-slate-900">Knowledge Graph</h2>
        <p className="text-sm text-slate-500">
          Visualize connections between your notes.
        </p>
      </div>
      <div className="flex-1 overflow-hidden" ref={containerRef}>
        <ForceGraph2D
          ref={fgRef}
          width={dimensions.width}
          height={dimensions.height}
          graphData={data}
          nodeLabel={(n: any) => n.title || 'Untitled Node'}
          nodeAutoColorBy="id"
          onNodeClick={handleNodeClick}
          linkDirectionalArrowLength={3.5}
          linkDirectionalArrowRelPos={1}
          linkCurvature={0.2}
          nodeRelSize={6}
        />
      </div>
    </div>
  )
}
