import { Router, type Request } from'express'
import multer from'multer'
import path from'path'
import fs from'fs'
import { prisma } from'../db'
import { requireAuth, type AuthedRequest } from'../middleware/auth'
import { asyncHandler } from'../utils/asyncHandler'
const router=Router()
router.use(requireAuth)
function userIdFrom(req: Request):string {
  return (req as unknown as AuthedRequest).userId
}
const uploadDir=path.join(process.cwd(),'uploads')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}
const storage=multer.diskStorage({
  destination: (_req, _file, cb)=>{
    cb(null, uploadDir)
  },
  filename: (_req, file, cb)=>{
    const uniqueSuffix=Date.now() +'-' + Math.round(Math.random()*1e9)
    const ext=path.extname(file.originalname)
    cb(null, file.fieldname +'-' + uniqueSuffix+ext)
  },
})
const upload=multer({
  storage,
  limits: { fileSize: 50*1024*1024 },
})
router.get(
'/',
  asyncHandler(async (req, res)=>{
    const userId=userIdFrom(req)
    const attachments=await prisma.attachment.findMany({
      where: { user_id: userId },
      orderBy: { created_at:'desc' },
    })
    res.json({ attachments })
  })
)
router.post(
'/',
  upload.single('file'),
  asyncHandler(async (req, res)=>{
    const userId=userIdFrom(req)
    const file=req.file
    if (!file) {
      res.status(400).json({ error:'No file uploaded' })
      return
    }
    const noteId=req.body.noteId||null
    const taskId=req.body.taskId||null
    const attachment=await prisma.attachment.create({
      data: {
        user_id: userId,
        filename: file.originalname,
        filepath: file.filename,
        mime_type: file.mimetype,
        size: file.size,
        note_id: noteId,
        task_id: taskId,
      },
    })
    res.status(201).json({ attachment })
  })
)
router.delete(
'/:id',
  asyncHandler(async (req, res)=>{
    const userId=userIdFrom(req)
    const id=req.params.id as string
    const attachment=await prisma.attachment.findUnique({ where: { id } })
    if (!attachment||attachment.user_id!==userId) {
      res.status(404).json({ error:'Attachment not found' })
      return
    }
    await prisma.attachment.delete({ where: { id } })
    const filePath=path.join(uploadDir, attachment.filepath)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
    res.status(204).send()
  })
)
export default router
