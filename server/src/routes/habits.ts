import { Router, type Request } from'express'
import { prisma } from'../db'
import { requireAuth, type AuthedRequest } from'../middleware/auth'
import { asyncHandler } from'../utils/asyncHandler'
const router=Router()
router.use(requireAuth)
function userIdFrom(req: Request):string {
  return (req as unknown as AuthedRequest).userId
}
router.get(
'/',
  asyncHandler(async (req, res)=>{
    const userId=userIdFrom(req)
    const habits=await prisma.habit.findMany({
      where: { user_id: userId },
      include: {
        logs: {
          orderBy: { date:'asc' },
        },
      },
      orderBy: { created_at:'asc' },
    })
    res.json({ habits })
  })
)
router.post(
'/',
  asyncHandler(async (req, res)=>{
    const userId=userIdFrom(req)
    const name=typeof req.body?.name==='string' ? req.body.name.trim() :''
    const frequency=typeof req.body?.frequency==='string' ? req.body.frequency.trim() :'daily'
    if (!name) {
      res.status(400).json({ error:'Name is required' })
      return
    }
    const habit=await prisma.habit.create({
      data: {
        user_id: userId,
        name,
        frequency,
      },
      include: { logs: true },
    })
    res.status(201).json({ habit })
  })
)
router.delete(
'/:id',
  asyncHandler(async (req, res)=>{
    const userId=userIdFrom(req)
    const id=req.params.id asstring
    const habit=await prisma.habit.findUnique({ where: { id } })
    if (!habit||habit.user_id!==userId) {
      res.status(404).json({ error:'Habit not found' })
      return
    }
    await prisma.habit.delete({ where: { id } })
    res.status(204).send()
  })
)
router.post(
'/:id/toggle',
  asyncHandler(async (req, res)=>{
    const userId=userIdFrom(req)
    const habitId=req.params.id asstring
    const dateStr=typeof req.body?.date==='string' ? req.body.date :''
    if (!dateStr) {
      res.status(400).json({ error:'Date is required (YYYY-MM-DD)' })
      return
    }
    const habit=await prisma.habit.findUnique({ where: { id: habitId } })
    if (!habit||habit.user_id!==userId) {
      res.status(404).json({ error:'Habit not found' })
      return
    }
    const date=new Date(dateStr)
    date.setUTCHours(0, 0, 0, 0)
    const existingLog=await prisma.habitLog.findUnique({
      where: {
        habit_id_date: {
          habit_id: habitId,
          date,
        },
      },
    })
    let log
    if (existingLog) {
      log=await prisma.habitLog.update({
        where: { id: existingLog.id },
        data: { completed: !existingLog.completed },
      })
    } else {
      log=await prisma.habitLog.create({
        data: {
          habit_id: habitId,
          date,
          completed: true,
        },
      })
    }
    res.json({ log })
  })
)
export default router
