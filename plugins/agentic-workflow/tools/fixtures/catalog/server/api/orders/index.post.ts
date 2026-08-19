export default defineEventHandler(async (event) => { requireStaff(event); return { ok: true } })
