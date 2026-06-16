import { Router, type Request } from'express'
import { prisma } from'../db'
import { requireAuth, type AuthedRequest } from'../middleware/auth'
import { folderRowToClient } from'../domain/folderRow'
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
    const folders=await prisma.folder.findMany({
      where: { user_id: userId },
      orderBy: { name:'asc' },
    })
    res.json({ folders: folders.map(folderRowToClient as any) })
  })
)
router.post(
'/',
  asyncHandler(async (req, res)=>{
    const userId=userIdFrom(req)
    const name=typeof req.body?.name==='string' ? req.body.name.trim() :''
    const parentId=typeof req.body?.parentId==='string' ? req.body.parentId : null
    if (!name) {
      res.status(400).json({ error:'Folder name is required' })
      return
    }
    if (parentId) {
      const parentCheck=await prisma.folder.findUnique({
        where: { id: parentId },
      })
      if (!parentCheck||parentCheck.user_id!==userId) {
        res.status(400).json({ error:'Invalid parent folder' })
        return
      }
    }
    const folder=await prisma.folder.create({
      data: {
        user_id: userId,
        parent_id: parentId,
        name,
      },
    })
    res.status(201).json({ folder: folderRowToClient(folder as any) })
  })
)
router.patch(
'/:id',
  asyncHandler(async (req, res)=>{
    const userId=userIdFrom(req)
    const id=req.params.id asstring
    const data: any={}
    if (req.body?.name!==undefined) {
      const name=String(req.body.name).trim()
      if (!name) {
        res.status(400).json({ error:'Folder name cannot be empty' })
        return
      }
      data.name=name
    }
    if (req.body?.parentId!==undefined) {
      data.parent_id=req.body.parentId===null ? null : String(req.body.parentId)
    }
    if (Object.keys(data).length===0) {
      res.status(400).json({ error:'No valid fields to update' })
      return
    }
    data.updated_at=new Date()
    const updatedFolder=await prisma.folder.updateMany({
      where: { user_id: userId, id },
      data,
    })
    if (updatedFolder.count===0) {
      res.status(404).json({ error:'Folder not found' })
      return
    }
    const folder=await prisma.folder.findUnique({ where: { id } })
    res.json({ folder: folderRowToClient(folder as any) })
  })
)
router.delete(
'/:id',
  asyncHandler(async (req, res)=>{
    const userId=userIdFrom(req)
    const id=req.params.id asstring
    const deletedFolder=await prisma.folder.deleteMany({
      where: { user_id: userId, id },
    })
    if (deletedFolder.count===0) {
      res.status(404).json({ error:'Folder not found' })
      return
    }
    res.status(204).send()
  })
)
export default router