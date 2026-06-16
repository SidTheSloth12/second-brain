import { Router, type Request } from'express'
import { taskRowToJson } from'../domain/taskRow'
import { prisma } from'../db'
import { requireAuth, type AuthedRequest } from'../middleware/auth'
import { asyncHandler } from'../utils/asyncHandler'
const router=Router()
router.use(requireAuth)
function userIdFrom(req: Request):string {
  return (req as unknown as AuthedRequest).userId
}
type Priority ='low' |'medium' |'high'
function parsePriority(v: unknown): Priority | null {
  if (v==='low' || v==='medium' || v==='high') return v
  return null
}
function parseDueAt(v: unknown): Date | null | undefined {
  if (v===undefined) return undefined
  if (v===null||v==='') return null
  if (typeof v!=='string') return undefined
  const d=new Date(v)
  return Number.isNaN(d.getTime()) ? undefined : d
}
function parseListId(v: unknown):string | null {
  if (typeof v!=='string' || !v.trim()) return null
  return v
}
async function ensureListBelongsToUser(userId:string, listId:string): Promise<boolean>{
  const list=await prisma.taskList.findFirst({
    where: { id: listId, user_id: userId },
    select: { id: true },
  })
  return !!list
}
router.get(
'/',
  asyncHandler(async (req, res)=>{
    const userId=userIdFrom(req)
    const statusFilter=req.query.status asstring
    const listId=parseListId(req.query.listId)
    const limitRaw=Number(req.query.limit)
    const limit=Number.isFinite(limitRaw) ? Math.max(1, limitRaw) : 50
    const offsetRaw=Number(req.query.offset)
    const offset=Number.isFinite(offsetRaw) ? Math.max(0, offsetRaw) : 0
    const where: any={ user_id: userId }
    if (statusFilter==='open' || statusFilter==='completed') {
      where.status=statusFilter
    }
    if (listId) {
      where.task_list_id=listId
    }
    const [total, tasks]=await Promise.all([
      prisma.task.count({ where }),
      prisma.task.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: [
          { status:'desc' },
          { completed_at:'desc' },
          { due_at:'asc' },
          { sort_order:'asc' },
          { created_at:'asc' },
        ],
      }),
    ])
    res.json({ tasks: tasks.map(taskRowToJson as any), total })
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
    const listId=parseListId(req.body?.listId)
    if (!listId) {
      res.status(400).json({ error:'Task list id is required' })
      return
    }
    if (!(await ensureListBelongsToUser(userId, listId))) {
      res.status(400).json({ error:'Invalid task list' })
      return
    }
    const priority=parsePriority(req.body?.priority) ??'low'
    const dueParsed=parseDueAt(req.body?.dueAt)
    if (dueParsed===undefined&&req.body?.dueAt!==undefined&&req.body?.dueAt!==null) {
      res.status(400).json({ error:'Invalid dueAt; use ISO-8601 datetime or null' })
      return
    }
    const dueAt=dueParsed===undefined ? null : dueParsed
    const maxSort=await prisma.task.aggregate({
      where: { user_id: userId },
      _max: { sort_order: true },
    })
    const sortOrder=(maxSort._max.sort_order||0)+1
    const task=await prisma.task.create({
      data: {
        user_id: userId,
        task_list_id: listId,
        title,
        description,
        due_at: dueAt,
        priority,
        sort_order: sortOrder,
      },
    })
    res.status(201).json({ task: taskRowToJson(task as any) })
  })
)
router.patch(
'/:id',
  asyncHandler(async (req, res)=>{
    const userId=userIdFrom(req)
    const id=req.params.id asstring
    if (!id||typeof id!=='string') {
      res.status(400).json({ error:'Invalid task id' })
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
    if (req.body?.dueAt!==undefined) {
      const dueParsed=parseDueAt(req.body.dueAt)
      if (dueParsed===undefined) {
        res.status(400).json({ error:'Invalid dueAt; use ISO-8601 datetime or null' })
        return
      }
      data.due_at=dueParsed
    }
    if (req.body?.priority!==undefined) {
      const p=parsePriority(req.body.priority)
      if (!p) {
        res.status(400).json({ error:'priority must be low, medium, or high' })
        return
      }
      data.priority=p
    }
    if (req.body?.listId!==undefined) {
      const listId=parseListId(req.body.listId)
      if (!listId||!(await ensureListBelongsToUser(userId, listId))) {
        res.status(400).json({ error:'Invalid task list' })
        return
      }
      data.task_list_id=listId
    }
    if (req.body?.status!==undefined) {
      if (req.body.status!=='open' && req.body.status!=='completed') {
        res.status(400).json({ error:'status must be open or completed' })
        return
      }
      data.status=req.body.status
      if (req.body.status==='completed') {
        data.completed_at=new Date()
      } else {
        data.completed_at=null
      }
    }
    if (req.body?.sortOrder!==undefined) {
      if (typeof req.body.sortOrder!=='number' || !Number.isFinite(req.body.sortOrder)) {
        res.status(400).json({ error:'sortOrder must be a number' })
        return
      }
      data.sort_order=Math.round(req.body.sortOrder)
    }
    if (Object.keys(data).length===0) {
      res.status(400).json({ error:'No valid fields to update' })
      return
    }
    data.updated_at=new Date()
    const updatedTask=await prisma.task.updateMany({
      where: { user_id: userId, id },
      data,
    })
    if (updatedTask.count===0) {
      res.status(404).json({ error:'Task not found' })
      return
    }
    const task=await prisma.task.findUnique({ where: { id } })
    res.json({ task: taskRowToJson(task as any) })
  })
)
router.delete(
'/:id',
  asyncHandler(async (req, res)=>{
    const userId=userIdFrom(req)
    const id=req.params.id asstring
    const deletedTask=await prisma.task.deleteMany({
      where: { user_id: userId, id },
    })
    if (deletedTask.count===0) {
      res.status(404).json({ error:'Task not found' })
      return
    }
    res.status(204).send()
  })
)
router.get(
'/lists',
  asyncHandler(async (req, res)=>{
    const userId=userIdFrom(req)
    const lists=await prisma.taskList.findMany({
      where: { user_id: userId },
      orderBy: [{ sort_order:'asc' }, { name:'asc' }],
    })
    res.json({ lists })
  })
)
router.post(
'/lists',
  asyncHandler(async (req, res)=>{
    const userId=userIdFrom(req)
    const name=typeof req.body?.name==='string' ? req.body.name.trim() :''
    if (!name) {
      res.status(400).json({ error:'List name is required' })
      return
    }
    const maxSort=await prisma.taskList.aggregate({
      where: { user_id: userId },
      _max: { sort_order: true },
    })
    const sortOrder=(maxSort._max.sort_order||0)+1
    const list=await prisma.taskList.create({
      data: {
        user_id: userId,
        name,
        sort_order: sortOrder,
      },
      select: { id: true, user_id: true, name: true, sort_order: true },
    })
    res.status(201).json({ list })
  })
)
router.patch(
'/lists/:id',
  asyncHandler(async (req, res)=>{
    const userId=userIdFrom(req)
    const id=req.params.id asstring
    const name=typeof req.body?.name==='string' ? req.body.name.trim() :''
    if (!name) {
      res.status(400).json({ error:'List name is required' })
      return
    }
    const updatedList=await prisma.taskList.updateMany({
      where: { user_id: userId, id },
      data: { name, updated_at: new Date() },
    })
    if (updatedList.count===0) {
      res.status(404).json({ error:'Task list not found' })
      return
    }
    const list=await prisma.taskList.findUnique({
      where: { id },
      select: { id: true, user_id: true, name: true, sort_order: true },
    })
    res.json({ list })
  })
)
router.delete(
'/lists/:id',
  asyncHandler(async (req, res)=>{
    const userId=userIdFrom(req)
    const id=req.params.id asstring
    const taskCount=await prisma.task.count({
      where: { user_id: userId, task_list_id: id },
    })
    if (taskCount>0) {
      res.status(400).json({ error:'Cannot delete a list with tasks' })
      return
    }
    const deletedList=await prisma.taskList.deleteMany({
      where: { user_id: userId, id },
    })
    if (deletedList.count===0) {
      res.status(404).json({ error:'Task list not found' })
      return
    }
    res.status(204).send()
  })
)
export default router