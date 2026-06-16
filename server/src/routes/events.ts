import { Router, type Request } from'express'
import { eventRowToJson } from'../domain/eventRow'
import { prisma } from'../db'
import { requireAuth, type AuthedRequest } from'../middleware/auth'
import { asyncHandler } from'../utils/asyncHandler'
const router=Router()
router.use(requireAuth)
function userIdFrom(req: Request):string {
  return (req as unknown as AuthedRequest).userId
}
function parseIso(name:string, v: unknown): Date | undefined {
  if (typeof v!=='string') return undefined
  const d=new Date(v)
  if (Number.isNaN(d.getTime())) return undefined
  return d
}
router.get(
'/',
  asyncHandler(async (req, res)=>{
    const userId=userIdFrom(req)
    const fromQ=req.query.from
    const toQ=req.query.to
    if (fromQ!==undefined||toQ!==undefined) {
      if (typeof fromQ!=='string' || typeof toQ!=='string') {
        res.status(400).json({ error:'from and to (ISO datetimes) are required together' })
        return
      }
      const from=new Date(fromQ)
      const to=new Date(toQ)
      if (Number.isNaN(from.getTime())||Number.isNaN(to.getTime())||from>=to) {
        res.status(400).json({ error:'Invalid from/to range' })
        return
      }
      const events=await prisma.event.findMany({
        where: {
          user_id: userId,
          starts_at: { lt: to },
          ends_at: { gt: from },
        },
        orderBy: { starts_at:'asc' },
      })
      res.json({ events: events.map(eventRowToJson as any) })
      return
    }
    const events=await prisma.event.findMany({
      where: { user_id: userId },
      orderBy: { starts_at:'desc' },
      take: 300,
    })
    res.json({ events: events.map(eventRowToJson as any) })
  })
)
router.get(
'/:id',
  asyncHandler(async (req, res)=>{
    const userId=userIdFrom(req)
    const id=req.params.id asstring
    const event=await prisma.event.findUnique({
      where: { id },
    })
    if (!event||event.user_id!==userId) {
      res.status(404).json({ error:'Event not found' })
      return
    }
    res.json({ event: eventRowToJson(event as any) })
  })
)
router.post(
'/',
  asyncHandler(async (req, res)=>{
    const userId=userIdFrom(req)
    const title=typeof req.body?.title==='string' ? req.body.title.trim() :''
    if (!title) {
      res.status(400).json({ error:'Title is required' })
      return
    }
    const description=typeof req.body?.description==='string' ? req.body.description.trim()||null : null
    const startsAt=parseIso('startsAt', req.body?.startsAt)
    const endsAt=parseIso('endsAt', req.body?.endsAt)
    if (!startsAt||!endsAt) {
      res.status(400).json({ error:'startsAt and endsAt must be valid ISO-8601 datetimes' })
      return
    }
    if (endsAt<startsAt) {
      res.status(400).json({ error:'endsAt must be after startsAt' })
      return
    }
    const allDay=Boolean(req.body?.allDay)
    const event=await prisma.event.create({
      data: {
        user_id: userId,
        title,
        description,
        starts_at: startsAt,
        ends_at: endsAt,
        all_day: allDay,
      },
    })
    res.status(201).json({ event: eventRowToJson(event as any) })
  })
)
router.patch(
'/:id',
  asyncHandler(async (req, res)=>{
    const userId=userIdFrom(req)
    const id=req.params.id asstring
    if (!id) {
      res.status(400).json({ error:'Invalid id' })
      return
    }
    const data: any={}
    if (req.body?.title!==undefined) {
      if (typeof req.body.title!=='string' || !req.body.title.trim()) {
        res.status(400).json({ error:'Title cannot be empty' })
        return
      }
      data.title=req.body.title.trim()
    }
    if (req.body?.description!==undefined) {
      data.description=typeof req.body.description==='string' ? req.body.description.trim()||null : null
    }
    if (req.body?.startsAt!==undefined) {
      const d=parseIso('startsAt', req.body.startsAt)
      if (!d) {
        res.status(400).json({ error:'Invalid startsAt' })
        return
      }
      data.starts_at=d
    }
    if (req.body?.endsAt!==undefined) {
      const d=parseIso('endsAt', req.body.endsAt)
      if (!d) {
        res.status(400).json({ error:'Invalid endsAt' })
        return
      }
      data.ends_at=d
    }
    if (req.body?.allDay!==undefined) {
      data.all_day=Boolean(req.body.allDay)
    }
    if (Object.keys(data).length===0) {
      res.status(400).json({ error:'No valid fields to update' })
      return
    }
    data.updated_at=new Date()
    const existing=await prisma.event.findUnique({ where: { id } })
    if (!existing||existing.user_id!==userId) {
      res.status(404).json({ error:'Event not found' })
      return
    }
    const nextStartsAt=data.starts_at ?? existing.starts_at
    const nextEndsAt=data.ends_at ?? existing.ends_at
    if (nextEndsAt<nextStartsAt) {
      res.status(400).json({ error:'endsAt must be after startsAt' })
      return
    }
    const updatedEvent=await prisma.event.updateMany({
      where: { user_id: userId, id },
      data,
    })
    if (updatedEvent.count===0) {
      res.status(404).json({ error:'Event not found' })
      return
    }
    const event=await prisma.event.findUnique({ where: { id } })
    res.json({ event: eventRowToJson(event as any) })
  })
)
router.delete(
'/:id',
  asyncHandler(async (req, res)=>{
    const userId=userIdFrom(req)
    const id=req.params.id asstring
    const deletedEvent=await prisma.event.deleteMany({
      where: { user_id: userId, id },
    })
    if (deletedEvent.count===0) {
      res.status(404).json({ error:'Event not found' })
      return
    }
    res.status(204).send()
  })
)
export default router