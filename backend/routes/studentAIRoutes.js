const express = require("express")
const router = express.Router()
const OpenAI = require("openai")
const { pool } = require("../db/db")

const verifyToken = require("../middleware/authMiddleware")
const verifyStudent = require("../middleware/studentMiddleware")

const openai = process.env.OPENAI_API_KEY
	? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
	: null

const ensureChatTable = async () => {
	await pool.query(`
		CREATE TABLE IF NOT EXISTS ai_chat_history (
			chat_id SERIAL PRIMARY KEY,
			student_id INT NOT NULL,
			role VARCHAR(20) NOT NULL,
			message TEXT NOT NULL,
			action_type VARCHAR(30),
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)
	`)
}

const buildInstruction = (action) => {
	const normalized = String(action || "").toLowerCase()

	if (normalized === "summarize") {
		return "Summarize the requested topic in concise bullet points for a student."
	}

	if (normalized === "quiz") {
		return "Generate 5 MCQs with options and answer key for the requested topic."
	}

	if (normalized === "explain") {
		return "Explain the topic with simple examples for beginner students."
	}

	return "Answer student doubts clearly and concisely."
}

const fallbackReply = (message, action) => {
	const actionLabel = String(action || "general")
	if (actionLabel === "quiz") {
		return `Quick quiz mode is active. Topic: ${message}.\n1) What is the main concept?\nA) ... B) ... C) ... D) ...\n(Use API key for full smart quiz output.)`
	}
	if (actionLabel === "summarize") {
		return `Summary mode is active for: ${message}.\n- Core concept\n- Important points\n- Practical use\n(Connect OPENAI_API_KEY for richer responses.)`
	}
	return `I received your question: "${message}". Configure OPENAI_API_KEY for detailed AI responses.`
}

router.get("/history", verifyToken, verifyStudent, async (req, res) => {
	try {
		await ensureChatTable()
		const result = await pool.query(
			`SELECT chat_id, role, message, action_type, created_at
			 FROM ai_chat_history
			 WHERE student_id = $1
			 ORDER BY created_at ASC
			 LIMIT 200`,
			[req.user.id]
		)
		res.json(result.rows)
	} catch (error) {
		console.log(error)
		res.status(500).json({ error: "Failed to fetch chat history" })
	}
})

router.post("/chat", verifyToken, verifyStudent, async (req, res) => {
	try {
		await ensureChatTable()
		const { message, action } = req.body

		if (!message) {
			return res.status(400).json({ error: "Message is required" })
		}

		await pool.query(
			`INSERT INTO ai_chat_history(student_id, role, message, action_type)
			 VALUES($1, 'user', $2, $3)`,
			[req.user.id, message, action || null]
		)

		let reply = ""

		if (openai) {
			const completion = await openai.chat.completions.create({
				model: process.env.OPENAI_MODEL || "gpt-4o-mini",
				messages: [
					{
						role: "system",
						content: `${buildInstruction(action)} Keep answers safe, accurate, and student-friendly.`
					},
					{
						role: "user",
						content: message
					}
				],
				temperature: 0.6
			})

			reply = completion.choices?.[0]?.message?.content?.trim() || fallbackReply(message, action)
		} else {
			reply = fallbackReply(message, action)
		}

		await pool.query(
			`INSERT INTO ai_chat_history(student_id, role, message, action_type)
			 VALUES($1, 'assistant', $2, $3)`,
			[req.user.id, reply, action || null]
		)

		res.json({ ok: true, data: { reply } })
	} catch (error) {
		console.log(error)
		res.status(500).json({ ok: false, error: "Assistant is unavailable" })
	}
})

module.exports = router
